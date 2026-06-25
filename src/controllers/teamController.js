const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      orderBy: [
        { groupName: 'asc' },
        { name: 'asc' }
      ]
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTeam = async (req, res) => {
  const { name, code, groupName } = req.body;
  
  if (!name || !code || !groupName) {
    return res.status(400).json({ 
      error: 'Name, code, and groupName are required' 
    });
  }
  
  try {
    const team = await prisma.team.create({
      data: { name, code, groupName }
    });
    res.status(201).json(team);
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Team code already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

const getTeamStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        homeMatches: {
          where: { status: 'finished' }
        },
        awayMatches: {
          where: { status: 'finished' }
        }
      }
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const allMatches = [...team.homeMatches, ...team.awayMatches];
    let played = 0, won = 0, drawn = 0, lost = 0;
    let goalsFor = 0, goalsAgainst = 0;
    
    allMatches.forEach(match => {
      played++;
      const isHome = match.teamAId === team.id;
      const scoreTeam = isHome ? match.scoreA : match.scoreB;
      const scoreOpponent = isHome ? match.scoreB : match.scoreA;
      
      goalsFor += scoreTeam;
      goalsAgainst += scoreOpponent;
      
      if (scoreTeam > scoreOpponent) won++;
      else if (scoreTeam === scoreOpponent) drawn++;
      else lost++;
    });
    
    res.json({
      team: team.name,
      code: team.code,
      group: team.groupName,
      stats: {
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDiff: goalsFor - goalsAgainst,
        points: won * 3 + drawn * 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllTeams, createTeam, getTeamStats };