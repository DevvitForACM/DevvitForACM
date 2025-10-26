import { Request, Response } from 'express';
import { PartyService } from '../services/party.service';
import {
  CreatePartyRequest,
  CreatePartyResponse,
  JoinPartyRequest,
  JoinPartyResponse,
  LeavePartyRequest,
  LeavePartyResponse,
  GetPartyResponse
} from '../../shared/types/party';

export class PartyController {

  static async createParty(req: Request, res: Response): Promise<void> {
    try {
      const { hostId, hostUsername, partyName, maxMembers } = req.body as CreatePartyRequest;

      if (!hostId || !hostUsername || !partyName) {
        res.status(400).json({
          type: 'party-created',
          success: false,
          message: 'Missing required fields: hostId, hostUsername, partyName'
        } as CreatePartyResponse);
        return;
      }

      if (partyName.trim().length === 0) {
        res.status(400).json({
          type: 'party-created',
          success: false,
          message: 'Party name cannot be empty'
        } as CreatePartyResponse);
        return;
      }

      if (maxMembers && (maxMembers < 2 || maxMembers > 50)) {
        res.status(400).json({
          type: 'party-created',
          success: false,
          message: 'Max members must be between 2 and 50'
        } as CreatePartyResponse);
        return;
      }

      const party = await PartyService.createParty({
        hostId,
        hostUsername,
        partyName: partyName.trim(),
        ...(maxMembers && { maxMembers })
      });

      const response: CreatePartyResponse = {
        type: 'party-created',
        success: true,
        party,
        message: 'Party created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating party:', error);
      
      const response: CreatePartyResponse = {
        type: 'party-created',
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create party'
      };

      res.status(400).json(response);
    }
  }


  static async joinParty(req: Request, res: Response): Promise<void> {
    try {
      const { partyId } = req.params;
      const { userId, username } = req.body as Omit<JoinPartyRequest, 'partyId'>;

      if (!partyId || !userId || !username) {
        res.status(400).json({
          type: 'party-joined',
          success: false,
          message: 'Missing required fields: partyId, userId, username'
        } as JoinPartyResponse);
        return;
      }

      const party = await PartyService.joinParty({
        partyId: partyId.toUpperCase(),
        userId,
        username
      });

      const response: JoinPartyResponse = {
        type: 'party-joined',
        success: true,
        party,
        message: 'Successfully joined party'
      };

      res.json(response);
    } catch (error) {
      console.error('Error joining party:', error);
      
      const response: JoinPartyResponse = {
        type: 'party-joined',
        success: false,
        message: error instanceof Error ? error.message : 'Failed to join party'
      };

      res.status(400).json(response);
    }
  }


  static async leaveParty(req: Request, res: Response): Promise<void> {
    try {
      const { partyId } = req.params;
      const { userId } = req.body as Omit<LeavePartyRequest, 'partyId'>;

      if (!partyId || !userId) {
        res.status(400).json({
          type: 'party-left',
          success: false,
          message: 'Missing required fields: partyId, userId'
        } as LeavePartyResponse);
        return;
      }

      await PartyService.leaveParty({
        partyId: partyId.toUpperCase(),
        userId
      });

      const response: LeavePartyResponse = {
        type: 'party-left',
        success: true,
        message: 'Successfully left party'
      };

      res.json(response);
    } catch (error) {
      console.error('Error leaving party:', error);
      
      const response: LeavePartyResponse = {
        type: 'party-left',
        success: false,
        message: error instanceof Error ? error.message : 'Failed to leave party'
      };

      res.status(400).json(response);
    }
  }


  static async getPartyDetails(req: Request, res: Response): Promise<void> {
    try {
      const { partyId } = req.params;

      if (!partyId) {
        res.status(400).json({
          type: 'party-details',
          message: 'Party ID is required'
        } as GetPartyResponse);
        return;
      }

      const party = await PartyService.getPartyById(partyId.toUpperCase());

      if (!party) {
        res.status(404).json({
          type: 'party-details',
          message: 'Party not found'
        } as GetPartyResponse);
        return;
      }

      const response: GetPartyResponse = {
        type: 'party-details',
        party
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching party details:', error);
      res.status(500).json({
        type: 'party-details',
        message: 'Failed to fetch party details'
      } as GetPartyResponse);
    }
  }


  static async getUserParty(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          type: 'party-details',
          message: 'User ID is required'
        } as GetPartyResponse);
        return;
      }

      const party = await PartyService.getUserParty(userId);

      const response: GetPartyResponse = {
        type: 'party-details',
        ...(party && { party }),
        ...(!party && { message: 'User is not in any party' })
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching user party:', error);
      res.status(500).json({
        type: 'party-details',
        message: 'Failed to fetch user party'
      } as GetPartyResponse);
    }
  }


}