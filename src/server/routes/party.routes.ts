import { Router } from 'express';
import { PartyController } from '../controllers/party.controller';

const router = Router();

router.post('/', PartyController.createParty);
router.get('/user/:userId', PartyController.getUserParty);
router.get('/:partyId', PartyController.getPartyDetails);
router.post('/:partyId/join', PartyController.joinParty);
router.post('/:partyId/leave', PartyController.leaveParty);

export default router;