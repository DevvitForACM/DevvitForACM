import { admin } from "./firebase-party-helper.service"
import { Party } from "../models/party";

admin.initialize().catch(console.error);

export const createParty = async (hostId: string, partyName: string): Promise<Party> => {
  const partyId = `party_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const newParty: Party = {
    id: partyId,
    hostId,
    partyName,
    members: { [hostId]: true },
    createdAt: Date.now(),
  };

  await admin.setRealtimeData(`parties/${partyId}`, newParty);
  await admin.setFirestoreDoc('parties', partyId, newParty);

  return newParty;
};

export const joinParty = async (partyId: string, userId: string): Promise<void> => {
  await admin.updateRealtimeData(`parties/${partyId}/members/${userId}`, true);
  await admin.updateFirestoreDoc('parties', partyId, {
    [`members.${userId}`]: true
  });
};

export const getPartyDetails = async (partyId: string): Promise<Party | null> => {
  const partyData = await admin.getRealtimeData(`parties/${partyId}`);
  return partyData || null;
};

export const getPartiesByHost = async (hostId: string): Promise<Party[]> => {
  return await admin.queryFirestore('parties', 'hostId', '==', hostId);
};

export const getAllParties = async (): Promise<Party[]> => {
  return await admin.queryFirestore('parties');
};
