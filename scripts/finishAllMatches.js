const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finishAllMatches() {
  console.log('⚽ Finishing all group matches...');
  
  // Dapatkan semua match grup yang masih scheduled
  const matches = await prisma.match.findMany({
    where: {
      phase: 'group',
      status: 'scheduled'
    }
  });
  
  console.log(`📊 Found ${matches.length} matches to finish`);
  
  for (const match of matches) {
    // Random score (1-3 goals)
    const scoreA = Math.floor(Math.random() * 3) + 1;
    const scoreB = Math.floor(Math.random() * 3) + 1;
    
    await prisma.match.update({
      where: { id: match.id },
      data: {
        scoreA,
        scoreB,
        status: 'finished'
      }
    });
    
    console.log(`✅ Match ${match.id}: ${match.teamAId} ${scoreA} - ${scoreB} ${match.teamBId}`);
  }
  
  console.log(`✅ All ${matches.length} matches finished!`);
}

finishAllMatches()
  .catch(console.error)
  .finally(() => prisma.$disconnect());