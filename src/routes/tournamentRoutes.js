const express = require('express');
const { 
  setupTournament, 
  advanceTournament, 
  getBracket,
  resetTournament 
} = require('../controllers/tournamentController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/tournament/setup', authMiddleware, setupTournament);
router.post('/tournament/advance', authMiddleware, advanceTournament);
router.get('/bracket', getBracket);
router.delete('/tournament/reset', authMiddleware, resetTournament);

module.exports = router;