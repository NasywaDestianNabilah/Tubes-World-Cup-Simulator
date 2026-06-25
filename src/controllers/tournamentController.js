const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { 
  generateGroupFixtures, 
  generateKnockoutBracket 
} = require('../utils/tournamentLogic');

const setupTournament = async (req, res) => {
  try {
    const groups = await prisma.team.findMany({
      distinct: ['groupName'],
      select: { groupName: true },
      orderBy: { groupName: 'asc' }
    });
    
    let totalMatches = 0;
    for (const group of groups) {
      const existingMatches = await prisma.match.count({
        where: { 
          groupName: group.groupName, 
          phase: 'group' 
        }
      });
      
      if (existingMatches === 0) {
        const count = await generateGroupFixtures(group.groupName);
        totalMatches += count;
      }
    }
    
    res.json({
      message: `Group fixtures generated for ${groups.length} groups`,
      matchesCreated: totalMatches,
      groups: groups.map(g => g.groupName)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const advanceTournament = async (req, res) => {
  try {
    // Cek apakah semua match grup sudah selesai
    const unfinishedMatches = await prisma.match.count({
      where: {
        phase: 'group',
        status: 'scheduled'
      }
    });
    
    if (unfinishedMatches > 0) {
      return res.status(400).json({
        error: `${unfinishedMatches} group matches still not finished. Please complete all group matches first.`
      });
    }
    
    // Cek apakah sudah ada knockout bracket
    const existingKnockout = await prisma.match.count({
      where: { phase: 'knockout' }
    });
    
    if (existingKnockout > 0) {
      return res.status(400).json({
        error: 'Knockout bracket already exists. Use DELETE /tournament/reset to reset.'
      });
    }
    
    // Generate knockout bracket
    const result = await generateKnockoutBracket();
    
    res.json({
      message: 'Knockout bracket generated successfully!',
      matchesCreated: result.totalMatches,
      qualifiedTeams: result.qualifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBracket = async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { phase: 'knockout' },
      include: {
        teamA: true,
        teamB: true
      },
      orderBy: [
        { round: 'asc' },
        { matchOrder: 'asc' }
      ]
    });
    
    // Group by round
    const bracket = {};
    matches.forEach(match => {
      if (!bracket[match.round]) {
        bracket[match.round] = [];
      }
      bracket[match.round].push(match);
    });
    
    res.json(bracket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetTournament = async (req, res) => {
  try {
    // Hapus semua match
    const deleted = await prisma.match.deleteMany({});
    
    res.json({
      message: 'Tournament reset successfully! All matches deleted.',
      matchesDeleted: deleted.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  setupTournament, 
  advanceTournament, 
  getBracket,
  resetTournament 
};