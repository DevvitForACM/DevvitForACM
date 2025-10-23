import { Request, Response } from "express";
import * as PartyService from "../services/party.service";

export const createParty = async (req: Request, res: Response) => {
  try {
    const { hostId, partyName } = req.body;
    if (!hostId || !partyName) return res.status(400).json({ error: "Missing fields" });

    const newParty = await PartyService.createParty(hostId, partyName);
    res.status(201).json(newParty);
  } 
  catch (err) {
    res.status(500).json({ error: "Failed to create party" });
  }
};

export const joinParty = async (req: Request, res: Response) => {
  try {
    const { partyId } = req.params;
    const { userId } = req.body;

    if (!partyId || !userId) {
      return res.status(400).json({ error: "Missing partyId or userId" });
    }

    await PartyService.joinParty(partyId, userId);
    res.status(200).json({ message: "Joined party successfully" });
  }
  catch {
    res.status(500).json({ error: "failed to join party" });
  }
};

export const getPartyDetails = async (req: Request, res: Response) => {
  try {
    const { partyId } = req.params;
    
    if (!partyId) {
      return res.status(400).json({ error: "Missing partyId" });
    }

    const party = await PartyService.getPartyDetails(partyId);

    if (!party) 
      return res.status(404).json({ error: "party not found" });
    res.status(200).json(party);
  }
  catch {
    res.status(500).json({ error: "Error fetching party details" });
  }
};
