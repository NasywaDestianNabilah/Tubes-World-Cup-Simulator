const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMatches = async (req, res) => {
  try {
    const { phase, status, group } = req.query;
    const where = {};
    
    if (phase) where.phase = phase;
    if (status) where.status = status;
    if (group) where.groupName = group;
    
    const matches = await prisma.match.findMany({
      where,
      include: {
        teamA: true,
        teamB: true
      },
      orderBy: [
        { phase: 'asc' },
        { groupName: 'asc' },
        { matchOrder: 'asc' },
        { id: 'asc' }
      ]
    });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMatchResult = async (req, res) => {
  const { id } = req.params;
  const { scoreA, scoreB } = req.body;
  
  if (scoreA === undefined || scoreB === undefined) {
    return res.status(400).json({ 
      error: 'Both scores are required' 
    });
  }
  
  if (scoreA < 0 || scoreB < 0) {
    return res.status(400).json({ 
      error: 'Scores must be non-negative' 
    });
  }
  
  try {
    const match = await prisma.match.update({
      where: { id: parseInt(id) },
      data: {
        scoreA,
        scoreB,
        status: 'finished'
      },
      include: {
        teamA: true,
        teamB: true
      }
    });
    res.json(match);
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Match not found' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = { getMatches, updateMatchResult };