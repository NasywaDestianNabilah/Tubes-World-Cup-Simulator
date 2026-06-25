const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// ===== MIDDLEWARE =====
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

// ===== MIDDLEWARE AUTH =====
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ===== 1. LOGIN =====
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  console.log('📝 Login attempt');
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  if (password !== (process.env.ADMIN_PASSWORD || 'admin123')) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET || 'secret123',
    { expiresIn: '24h' }
  );
  
  res.json({ token, message: 'Login successful' });
});

// ===== 2. TEAMS =====
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      orderBy: [{ groupName: 'asc' }, { name: 'asc' }]
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/teams', authMiddleware, async (req, res) => {
  const { name, code, groupName } = req.body;
  if (!name || !code || !groupName) {
    return res.status(400).json({ error: 'Name, code, groupName required' });
  }
  try {
    const team = await prisma.team.create({ data: { name, code, groupName } });
    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== 3. MATCHES =====
app.get('/api/matches', async (req, res) => {
  try {
    const { phase, status, group } = req.query;
    const where = {};
    if (phase) where.phase = phase;
    if (status) where.status = status;
    if (group) where.groupName = group;
    
    const matches = await prisma.match.findMany({
      where,
      include: { teamA: true, teamB: true },
      orderBy: [{ groupName: 'asc' }, { id: 'asc' }]
    });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/matches/:id/result', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { scoreA, scoreB } = req.body;
  
  if (scoreA === undefined || scoreB === undefined || scoreA < 0 || scoreB < 0) {
    return res.status(400).json({ error: 'Valid scores required' });
  }
  
  try {
    const match = await prisma.match.update({
      where: { id: parseInt(id) },
      data: { scoreA, scoreB, status: 'finished' },
      include: { teamA: true, teamB: true }
    });
    res.json(match);
  } catch (error) {
    res.status(404).json({ error: 'Match not found' });
  }
});

// ===== 4. STANDINGS =====
app.get('/api/standings', async (req, res) => {
  try {
    const groups = await prisma.team.findMany({
      distinct: ['groupName'],
      select: { groupName: true },
      orderBy: { groupName: 'asc' }
    });
    
    const allStandings = [];
    for (const group of groups) {
      const standings = await calculateStandings(group.groupName);
      allStandings.push({ group: group.groupName, standings });
    }
    res.json(allStandings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:id/standings', async (req, res) => {
  try {
    const standings = await calculateStandings(req.params.id);
    res.json({ group: req.params.id, standings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 5. TOURNAMENT =====
app.post('/api/tournament/setup', authMiddleware, async (req, res) => {
  try {
    const groups = await prisma.team.findMany({
      distinct: ['groupName'],
      select: { groupName: true }
    });
    
    let totalMatches = 0;
    for (const group of groups) {
      const existing = await prisma.match.count({
        where: { groupName: group.groupName, phase: 'group' }
      });
      if (existing === 0) {
        const count = await generateGroupFixtures(group.groupName);
        totalMatches += count;
      }
    }
    res.json({ message: 'Fixtures generated', matchesCreated: totalMatches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tournament/advance', authMiddleware, async (req, res) => {
  try {
    const unfinished = await prisma.match.count({
      where: { phase: 'group', status: 'scheduled' }
    });
    if (unfinished > 0) {
      return res.status(400).json({ error: `${unfinished} matches still not finished` });
    }
    
    const result = await generateKnockoutBracket();
    res.json({ message: 'Knockout generated!', matchesCreated: result.totalMatches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bracket', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { phase: 'knockout' },
      include: { teamA: true, teamB: true },
      orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }]
    });
    const bracket = {};
    matches.forEach(m => {
      if (!bracket[m.round]) bracket[m.round] = [];
      bracket[m.round].push(m);
    });
    res.json(bracket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tournament/reset', authMiddleware, async (req, res) => {
  try {
    const deleted = await prisma.match.deleteMany({});
    res.json({ message: 'All matches deleted', count: deleted.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== HELPER FUNCTIONS =====
async function calculateStandings(groupName) {
  const teams = await prisma.team.findMany({
    where: { groupName },
    include: {
      homeMatches: { where: { status: 'finished', phase: 'group' } },
      awayMatches: { where: { status: 'finished', phase: 'group' } }
    }
  });
  
  return teams.map(team => {
    let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
    [...team.homeMatches, ...team.awayMatches].forEach(m => {
      played++;
      const isHome = m.teamAId === team.id;
      const score = isHome ? m.scoreA : m.scoreB;
      const opp = isHome ? m.scoreB : m.scoreA;
      gf += score; ga += opp;
      if (score > opp) won++;
      else if (score === opp) drawn++;
      else lost++;
    });
    return {
      team: team.name,
      code: team.code,
      teamId: team.id,
      played, won, drawn, lost,
      goalsFor: gf,
      goalsAgainst: ga,
      goalDiff: gf - ga,
      points: won * 3 + drawn * 1
    };
  }).sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

async function generateGroupFixtures(groupName) {
  const teams = await prisma.team.findMany({ where: { groupName } });
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        teamAId: teams[i].id,
        teamBId: teams[j].id,
        phase: 'group',
        status: 'scheduled',
        groupName
      });
    }
  }
  if (matches.length > 0) {
    await prisma.match.createMany({ data: matches });
  }
  return matches.length;
}

async function generateKnockoutBracket() {
  const groups = await prisma.team.findMany({
    distinct: ['groupName'],
    select: { groupName: true }
  });
  
  const qualified = [];
  for (const group of groups) {
    const standings = await calculateStandings(group.groupName);
    const top2 = standings.slice(0, 2);
    qualified.push(...top2);
  }
  
  // Best third (8 dari 12 grup)
  const thirdTeams = [];
  for (const group of groups) {
    const standings = await calculateStandings(group.groupName);
    if (standings.length >= 3) {
      thirdTeams.push({ ...standings[2], group: group.groupName });
    }
  }
  const bestThird = thirdTeams.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    return b.goalDiff - a.goalDiff;
  }).slice(0, 8);
  
  const allQualified = [...qualified, ...bestThird];
  allQualified.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    return b.goalDiff - a.goalDiff;
  });
  
  const matches = [];
  const n = allQualified.length;
  for (let i = 0; i < n / 2; i++) {
    matches.push({
      teamAId: allQualified[i].teamId,
      teamBId: allQualified[n - 1 - i].teamId,
      phase: 'knockout',
      status: 'scheduled',
      round: 'Round of 32',
      matchOrder: i + 1
    });
  }
  
  let order = 17;
  const rounds = [
    { name: 'Round of 16', count: 8 },
    { name: 'Quarter-final', count: 4 },
    { name: 'Semi-final', count: 2 },
    { name: 'Final', count: 1 }
  ];
  for (const round of rounds) {
    for (let i = 0; i < round.count; i++) {
      matches.push({
        teamAId: null,
        teamBId: null,
        phase: 'knockout',
        status: 'scheduled',
        round: round.name,
        matchOrder: order++
      });
    }
  }
  
  await prisma.match.createMany({ data: matches });
  return { totalMatches: matches.length };
}

// ===== TEST =====
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// ===== ROOT =====
app.get('/', (req, res) => {
  res.json({
    name: '🏆 World Cup 2026 Simulator API',
    status: 'running',
    port: PORT,
    admin: { password: process.env.ADMIN_PASSWORD || 'admin123' }
  });
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  console.log(`📝 Test: http://localhost:${PORT}/api/test`);
});