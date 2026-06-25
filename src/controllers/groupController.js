const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateStandings } = require('../utils/tournamentLogic');

const getGroupStandings = async (req, res) => {
  try {
    const { id } = req.params;
    const standings = await calculateStandings(id);
    res.json({ 
      group: id, 
      standings 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllStandings = async (req, res) => {
  try {
    const groups = await prisma.team.findMany({
      distinct: ['groupName'],
      select: { groupName: true },
      orderBy: { groupName: 'asc' }
    });
    
    const allStandings = [];
    for (const group of groups) {
      const standings = await calculateStandings(group.groupName);
      allStandings.push({ 
        group: group.groupName, 
        standings 
      });
    }
    res.json(allStandings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getGroupStandings, getAllStandings };