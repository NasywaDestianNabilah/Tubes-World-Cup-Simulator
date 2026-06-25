const express = require('express');
const { getGroupStandings, getAllStandings } = require('../controllers/groupController');
const router = express.Router();

router.get('/groups/:id/standings', getGroupStandings);
router.get('/standings', getAllStandings);

module.exports = router;