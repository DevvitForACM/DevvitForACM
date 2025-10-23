import { admin } from "./firebase-admin.service";
import { Party } from "../models/party";

// Initialize Firebase Admin on service load
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
  
  // Store in both Realtime Database and Firestore for demonstration
  await admin.setRealtimeData(`parties/${partyId}`, newParty);
  await admin.setFirestoreDoc('parties', partyId, newParty);
  
  return newParty;
};

export const joinParty = async (partyId: string, userId: string): Promise<void> => {
  // Update both databases
  await admin.updateRealtimeData(`parties/${partyId}/members/${userId}`, true);
  await admin.updateFirestoreDoc('parties', partyId, {
    [`members.${userId}`]: true
  });
};

export const getPartyDetails = async (partyId: string): Promise<Party | null> => {
  // Get from Realtime Database (you can switch to Firestore if preferred)
  const partyData = await admin.getRealtimeData(`parties/${partyId}`);
  return partyData || null;
};

// Additional methods using Firestore
export const getPartiesByHost = async (hostId: string): Promise<Party[]> => {
  return await admin.queryFirestore('parties', 'hostId', '==', hostId);
};

export const getAllParties = async (): Promise<Party[]> => {
  return await admin.queryFirestore('parties');
};
