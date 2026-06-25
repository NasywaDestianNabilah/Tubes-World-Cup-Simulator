const express = require('express');
const { getAllTeams, createTeam, getTeamStats } = require('../controllers/teamController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/teams', getAllTeams);
router.post('/teams', authMiddleware, createTeam);
router.get('/teams/:id/stats', getTeamStats); // BONUS

module.exports = router;