const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeAllBracket() {
    console.log('🏆 Auto-completing entire bracket!\n');

    const rounds = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

    for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        console.log(`📌 Processing ${round}...`);

        // Cek apakah ada match di round ini
        const matches = await prisma.match.findMany({
            where: {
                phase: 'knockout',
                round: round,
                status: 'scheduled'
            },
            include: {
                teamA: true,
                teamB: true
            }
        });

        // Skip jika round ini sudah selesai
        const finished = await prisma.match.count({
            where: {
                phase: 'knockout',
                round: round,
                status: 'finished'
            }
        });

        if (finished > 0 && matches.length === 0) {
            console.log(`  ✅ ${round} already complete`);
            continue;
        }

        // Jika ada match TBD, generate dulu
        const hasTbd = matches.some(m => m.teamAId === null || m.teamBId === null);
        if (hasTbd && i > 0) {
            // Generate dari round sebelumnya
            const prevRound = rounds[i - 1];
            console.log(`  🔄 Generating from ${prevRound}...`);
            
            const prevMatches = await prisma.match.findMany({
                where: {
                    phase: 'knockout',
                    round: prevRound,
                    status: 'finished'
                },
                include: {
                    teamA: true,
                    teamB: true
                },
                orderBy: { matchOrder: 'asc' }
            });

            const winners = [];
            for (const m of prevMatches) {
                let winnerId = m.scoreA > m.scoreB ? m.teamAId : 
                               m.scoreB > m.scoreA ? m.teamBId : 
                               Math.random() > 0.5 ? m.teamAId : m.teamBId;
                if (winnerId) {
                    const team = await prisma.team.findUnique({ where: { id: winnerId } });
                    if (team) winners.push(team);
                }
            }

            for (let j = 0; j < Math.min(matches.length, Math.floor(winners.length / 2)); j++) {
                const match = matches[j];
                const teamA = winners[j * 2];
                const teamB = winners[j * 2 + 1];
                if (teamA && teamB) {
                    await prisma.match.update({
                        where: { id: match.id },
                        data: { teamAId: teamA.id, teamBId: teamB.id }
                    });
                    console.log(`  ✅ ${round} Match ${j+1}: ${teamA.name} vs ${teamB.name}`);
                }
            }
        }

        // Finish semua match di round ini
        const toFinish = await prisma.match.findMany({
            where: {
                phase: 'knockout',
                round: round,
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

        if (toFinish.length > 0) {
            console.log(`  📊 Finishing ${toFinish.length} matches...`);
            for (const match of toFinish) {
                const scoreA = Math.floor(Math.random() * 4) + 1;
                const scoreB = Math.floor(Math.random() * 4);
                await prisma.match.update({
                    where: { id: match.id },
                    data: { scoreA, scoreB, status: 'finished' }
                });
                console.log(`  ✅ ${match.teamA.name} ${scoreA} - ${scoreB} ${match.teamB.name}`);
            }
        }

        console.log('');
    }

    console.log('🏆 ALL KNOCKOUT COMPLETE!');
    console.log('🎉 Check the bracket in web!');
}

completeAllBracket()
    .catch(console.error)
    .finally(() => prisma.$disconnect());