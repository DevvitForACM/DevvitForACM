import { Party, PartyMember, CreatePartyRequest } from '../../shared/types/party';

export class PartyModel {
  private static readonly PARTY_PREFIX = 'party';
  private static readonly PARTY_MEMBERS_PREFIX = 'party:members';
  private static readonly USER_PARTY_PREFIX = 'user:party';
  
  static createParty(request: CreatePartyRequest): Party {
    const partyId = this.generatePartyId();
    const now = Date.now();
    
    const hostMember: PartyMember = {
      userId: request.hostId,
      username: request.hostUsername,
      joinedAt: now,
      isHost: true
    };

    return {
      id: partyId,
      name: request.partyName,
      hostId: request.hostId,
      hostUsername: request.hostUsername,
      members: [hostMember],
      maxMembers: request.maxMembers || 10,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  }

  static createMember(userId: string, username: string, isHost: boolean = false): PartyMember {
    return {
      userId,
      username,
      joinedAt: Date.now(),
      isHost
    };
  }

  static validateParty(party: Partial<Party>): boolean {
    return !!(
      party.id &&
      party.name &&
      party.hostId &&
      party.hostUsername &&
      Array.isArray(party.members) &&
      typeof party.maxMembers === 'number' &&
      party.maxMembers > 0 &&
      typeof party.isActive === 'boolean'
    );
  }

  static validateMember(member: Partial<PartyMember>): boolean {
    return !!(
      member.userId &&
      member.username &&
      typeof member.isHost === 'boolean'
    );
  }

  static getPartyKey(partyId: string): string {
    return `${this.PARTY_PREFIX}:${partyId}`;
  }

  static getPartyMembersKey(partyId: string): string {
    return `${this.PARTY_MEMBERS_PREFIX}:${partyId}`;
  }

  static getUserPartyKey(userId: string): string {
    return `${this.USER_PARTY_PREFIX}:${userId}`;
  }



  private static generatePartyId(): string {
    // Generate a 6-character alphanumeric party code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}