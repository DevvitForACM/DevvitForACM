import { 
  Party, 
  PartyMember, 
  CreatePartyRequest, 
  JoinPartyRequest, 
  LeavePartyRequest
} from '../../shared/types/party';
import { PartyModel } from '../models/party';
import { redis } from './redis.service';
import { RedisHelper } from '../helpers/redis.helper';

export class PartyService {
  static async createParty(request: CreatePartyRequest): Promise<Party> {
    const party = PartyModel.createParty(request);

    if (!PartyModel.validateParty(party)) {
      throw new Error('Invalid party data');
    }

    // Check if user is already in a party
    const existingPartyId = await redis.get(PartyModel.getUserPartyKey(request.hostId));
    if (existingPartyId) {
      throw new Error('User is already in a party');
    }

    const partyKey = PartyModel.getPartyKey(party.id);
    const membersKey = PartyModel.getPartyMembersKey(party.id);
    const userPartyKey = PartyModel.getUserPartyKey(request.hostId);

    // Store party data
    await RedisHelper.hSetObject(partyKey, {
      id: party.id,
      name: party.name,
      hostId: party.hostId,
      hostUsername: party.hostUsername,
      maxMembers: party.maxMembers.toString(),
      isActive: party.isActive.toString(),
      createdAt: party.createdAt.toString(),
      updatedAt: party.updatedAt.toString()
    });

    // Add host as first member
    await RedisHelper.hSet(membersKey, request.hostId, JSON.stringify(party.members[0]));
    
    // Track user's party membership
    await redis.set(userPartyKey, party.id);

    return party;
  }

  static async joinParty(request: JoinPartyRequest): Promise<Party> {
    const { partyId, userId, username } = request;

    const party = await this.getPartyById(partyId);
    if (!party) {
      throw new Error('Party not found');
    }

    if (!party.isActive) {
      throw new Error('Party is not active');
    }

    // Check if user is already in a party
    const existingPartyId = await redis.get(PartyModel.getUserPartyKey(userId));
    if (existingPartyId) {
      throw new Error('User is already in a party');
    }

    if (party.members.length >= party.maxMembers) {
      throw new Error('Party is full');
    }

    if (party.members.some(member => member.userId === userId)) {
      throw new Error('User is already in this party');
    }

    const newMember = PartyModel.createMember(userId, username);
    const membersKey = PartyModel.getPartyMembersKey(partyId);
    const userPartyKey = PartyModel.getUserPartyKey(userId);

    // Add member atomically
    await RedisHelper.hSet(membersKey, userId, JSON.stringify(newMember));
    await redis.set(userPartyKey, partyId);
    await RedisHelper.hSet(PartyModel.getPartyKey(partyId), 'updatedAt', Date.now().toString());

    // Re-check party size after adding (basic race condition mitigation)
    const updatedParty = await this.getPartyById(partyId);
    if (updatedParty && updatedParty.members.length > party.maxMembers) {
      // Remove the user we just added
      await RedisHelper.hDel(membersKey, userId);
      await redis.del(userPartyKey);
      throw new Error('Party became full while joining');
    }

    return await this.getPartyById(partyId) as Party;
  }

  static async leaveParty(request: LeavePartyRequest): Promise<void> {
    const { partyId, userId } = request;

    const party = await this.getPartyById(partyId);
    if (!party) {
      throw new Error('Party not found');
    }

    const member = party.members.find(m => m.userId === userId);
    if (!member) {
      throw new Error('User is not in this party');
    }

    const membersKey = PartyModel.getPartyMembersKey(partyId);
    const userPartyKey = PartyModel.getUserPartyKey(userId);

    await RedisHelper.hDel(membersKey, userId);
    await redis.del(userPartyKey);

    // Handle host transfer or party deletion
    if (member.isHost) {
      const remainingMembers = party.members.filter(m => m.userId !== userId);
      
      if (remainingMembers.length === 0) {
        await this.deleteParty(partyId);
      } else {
        const newHost = remainingMembers[0];
        if (newHost) {
          // Create updated host member object
          const updatedHost: PartyMember = {
            ...newHost,
            isHost: true
          };
          
          await RedisHelper.hSet(membersKey, newHost.userId, JSON.stringify(updatedHost));
          await RedisHelper.hSet(PartyModel.getPartyKey(partyId), 'hostId', newHost.userId);
          await RedisHelper.hSet(PartyModel.getPartyKey(partyId), 'hostUsername', newHost.username);
          await RedisHelper.hSet(PartyModel.getPartyKey(partyId), 'updatedAt', Date.now().toString());
        }
      }
    } else {
      await RedisHelper.hSet(PartyModel.getPartyKey(partyId), 'updatedAt', Date.now().toString());
    }
  }


  static async getPartyById(partyId: string): Promise<Party | null> {
    const partyKey = PartyModel.getPartyKey(partyId);
    const membersKey = PartyModel.getPartyMembersKey(partyId);

    const [partyData, membersData] = await Promise.all([
      redis.hGetAll(partyKey),
      redis.hGetAll(membersKey)
    ]);

    if (!partyData.id) {
      return null;
    }

    const members: PartyMember[] = Object.values(membersData)
      .filter(memberStr => memberStr)
      .map(memberStr => JSON.parse(memberStr as string))
      .sort((a, b) => a.joinedAt - b.joinedAt); // Sort by join time

    return {
      id: partyData.id || '',
      name: partyData.name || '',
      hostId: partyData.hostId || '',
      hostUsername: partyData.hostUsername || '',
      members,
      maxMembers: parseInt(partyData.maxMembers || '10'),
      isActive: partyData.isActive === 'true',
      createdAt: parseInt(partyData.createdAt || '0'),
      updatedAt: parseInt(partyData.updatedAt || '0')
    };
  }


  static async getUserParty(userId: string): Promise<Party | null> {
    const partyId = await redis.get(PartyModel.getUserPartyKey(userId));
    if (!partyId) {
      return null;
    }
    return await this.getPartyById(partyId);
  }


  private static async deleteParty(partyId: string): Promise<void> {
    const partyKey = PartyModel.getPartyKey(partyId);
    const membersKey = PartyModel.getPartyMembersKey(partyId);

    const membersData = await redis.hGetAll(membersKey);
    const memberIds = Object.keys(membersData);

    // Clean up user:party mappings
    for (const userId of memberIds) {
      await redis.del(PartyModel.getUserPartyKey(userId));
    }

    await RedisHelper.del(partyKey, membersKey);
  }
}