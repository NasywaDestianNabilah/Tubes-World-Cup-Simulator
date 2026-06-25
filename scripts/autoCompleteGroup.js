const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function autoCompleteGroup() {
  console.log('🏆 Auto-completing all group matches...\n');
  
  // Ambil semua match grup yang belum selesai
  const matches = await prisma.match.findMany({
    where: {
      phase: 'group',
      status: 'scheduled'
    },
    include: {
      teamA: true,
      teamB: true
    }
  });
  
  if (matches.length === 0) {
    console.log('✅ All matches already finished!');
    return;
  }
  
  console.log(`📊 Found ${matches.length} matches to finish\n`);
  
  let total = 0;
  for (const match of matches) {
    // Random score dengan variasi
    const scoreA = Math.floor(Math.random() * 4);
    const scoreB = Math.floor(Math.random() * 4);
    
    // Biar ga seri terus, kadang hasilnya beda
    const finalScoreA = scoreA === scoreB ? scoreA + 1 : scoreA;
    const finalScoreB = scoreA === scoreB ? scoreB : scoreB + (Math.random() > 0.5 ? 1 : 0);
    
    await prisma.match.update({
      where: { id: match.id },
      data: {
        scoreA: finalScoreA,
        scoreB: finalScoreB,
        status: 'finished'
      }
    });
    
    total++;
    console.log(`✅ Match ${match.id}: ${match.teamA.name} ${finalScoreA} - ${finalScoreB} ${match.teamB.name}`);
  }
  
  console.log(`\n✅ All ${total} matches finished successfully!`);
  console.log('🏆 Now you can advance to knockout!');
}

autoCompleteGroup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());