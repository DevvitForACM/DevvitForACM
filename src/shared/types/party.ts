export interface Party {
  id: string;
  name: string;
  hostId: string;
  hostUsername: string;
  members: PartyMember[];
  maxMembers: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PartyMember {
  userId: string;
  username: string;
  joinedAt: number;
  isHost: boolean;
}

export interface CreatePartyRequest {
  hostId: string;
  hostUsername: string;
  partyName: string;
  maxMembers?: number;
}

export interface CreatePartyResponse {
  type: 'party-created';
  success: boolean;
  party?: Party;
  message?: string;
}

export interface JoinPartyRequest {
  partyId: string;
  userId: string;
  username: string;
}

export interface JoinPartyResponse {
  type: 'party-joined';
  success: boolean;
  party?: Party;
  message?: string;
}

export interface LeavePartyRequest {
  partyId: string;
  userId: string;
}

export interface LeavePartyResponse {
  type: 'party-left';
  success: boolean;
  message?: string;
}

export interface GetPartyResponse {
  type: 'party-details';
  party?: Party;
  message?: string;
}

