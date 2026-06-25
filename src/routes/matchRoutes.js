const express = require('express');
const { getMatches, updateMatchResult } = require('../controllers/matchController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/matches', getMatches);
router.put('/matches/:id/result', authMiddleware, updateMatchResult);

module.exports = router;