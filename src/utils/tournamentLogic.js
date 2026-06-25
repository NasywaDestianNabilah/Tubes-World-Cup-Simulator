const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate round-robin fixtures untuk satu grup
const generateGroupFixtures = async (groupName) => {
  const teams = await prisma.team.findMany({
    where: { groupName }
  });
  
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
    await prisma.match.createMany({
      data: matches
    });
  }
  
  return matches.length;
};

// Hitung klasemen grup
const calculateStandings = async (groupName) => {
  const teams = await prisma.team.findMany({
    where: { groupName },
    include: {
      homeMatches: {
        where: { status: 'finished', phase: 'group' }
      },
      awayMatches: {
        where: { status: 'finished', phase: 'group' }
      }
    }
  });
  
  const standings = teams.map(team => {
    let played = 0, won = 0, drawn = 0, lost = 0;
    let goalsFor = 0, goalsAgainst = 0;
    
    const allMatches = [...team.homeMatches, ...team.awayMatches];
    
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
    
    return {
      team: team.name,
      code: team.code,
      teamId: team.id,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
      points: won * 3 + drawn * 1
    };
  });
  
  standings.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
  
  return standings;
};

// Dapatkan 8 best third-placed
const getBestThirdPlaced = async () => {
  const groups = await prisma.team.findMany({
    distinct: ['groupName'],
    select: { groupName: true }
  });
  
  const thirdPlacedTeams = [];
  
  for (const group of groups) {
    const standings = await calculateStandings(group.groupName);
    if (standings.length >= 3) {
      thirdPlacedTeams.push({
        ...standings[2],
        group: group.groupName
      });
    }
  }
  
  thirdPlacedTeams.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
  
  return thirdPlacedTeams.slice(0, 8);
};

// Generate knockout bracket 32 tim
const generateKnockoutBracket = async () => {
  const groups = await prisma.team.findMany({
    distinct: ['groupName'],
    select: { groupName: true }
  });
  
  const qualifiedTeams = [];
  
  // Top 2 dari setiap grup
  for (const group of groups) {
    const standings = await calculateStandings(group.groupName);
    const top2 = standings.slice(0, 2);
    for (const team of top2) {
      qualifiedTeams.push({
        ...team,
        group: group.groupName
      });
    }
  }
  
  // Best third-placed
  const bestThird = await getBestThirdPlaced();
  const allQualified = [...qualifiedTeams, ...bestThird];
  
  // Urutkan berdasarkan peringkat
  allQualified.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
  
  const matches = [];
  const n = allQualified.length;
  
  // Round of 32 (16 matches)
  for (let i = 0; i < n / 2; i++) {
    const teamA = allQualified[i];
    const teamB = allQualified[n - 1 - i];
    
    matches.push({
      teamAId: teamA.teamId,
      teamBId: teamB.teamId,
      phase: 'knockout',
      status: 'scheduled',
      round: 'Round of 32',
      matchOrder: i + 1
    });
  }
  
  // Template untuk round selanjutnya (TBD) - matchOrder dilanjutkan
  let order = 17; // Start dari 17 karena Round of 32 pakai 1-16
  
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
  
  await prisma.match.createMany({
    data: matches
  });
  
  return {
    totalMatches: matches.length,
    qualifiedCount: allQualified.length
  };
};

module.exports = { 
  generateGroupFixtures, 
  calculateStandings, 
  getBestThirdPlaced,
  generateKnockoutBracket 
};