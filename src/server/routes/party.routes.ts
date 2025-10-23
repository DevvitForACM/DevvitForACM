import express from "express";
import * as PartyController from "../controllers/party.controller";

const router = express.Router();

router.post("/create", PartyController.createParty);
router.post("/join/:partyId", PartyController.joinParty);
router.get("/:partyId", PartyController.getPartyDetails);

export default router;
