const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeRound32() {
    console.log('🏆 Completing Round of 32 matches...\n');

    // Ambil match Round of 32 yang masih scheduled
    const matches = await prisma.match.findMany({
        where: {
            phase: 'knockout',
            round: 'Round of 32',
            status: 'scheduled',
            NOT: {
                teamAId: null
            }
        },
        include: {
            teamA: true,
            teamB: true
        }
    });

    if (matches.length === 0) {
        console.log('⚠️ No Round of 32 matches to complete!');
        return;
    }

    console.log(`📊 Found ${matches.length} matches to complete\n`);

    for (const match of matches) {
        // Random score
        const scoreA = Math.floor(Math.random() * 4) + 1;
        const scoreB = Math.floor(Math.random() * 4);

        await prisma.match.update({
            where: { id: match.id },
            data: {
                scoreA: scoreA,
                scoreB: scoreB,
                status: 'finished'
            }
        });

        console.log(`✅ ${match.teamA.name} ${scoreA} - ${scoreB} ${match.teamB.name}`);
    }

    console.log(`\n✅ All ${matches.length} Round of 32 matches completed!`);
    console.log('🏆 Now generate next round!');
}

completeRound32()
    .catch(console.error)
    .finally(() => prisma.$disconnect());