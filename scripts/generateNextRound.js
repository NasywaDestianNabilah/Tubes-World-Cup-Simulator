const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateNextRound() {
    console.log('🔄 Generating next knockout round...\n');

    try {
        // Ambil semua match knockout yang masih scheduled DAN timnya udah ada
        const scheduledMatches = await prisma.match.findMany({
            where: {
                phase: 'knockout',
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

        if (scheduledMatches.length === 0) {
            console.log('⚠️ No scheduled knockout matches found!');
            console.log('🏆 Tournament might already be complete!');
            return;
        }

        console.log(`📊 Found ${scheduledMatches.length} scheduled matches`);

        // Cek round apa yang sedang aktif
        const rounds = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
        let currentRound = null;
        for (const round of rounds) {
            const count = scheduledMatches.filter(m => m.round === round).length;
            if (count > 0) {
                currentRound = round;
                break;
            }
        }

        console.log(`📌 Current round: ${currentRound}`);

        // Cari next round yang masih TBD
        const nextRoundIndex = rounds.indexOf(currentRound) + 1;
        if (nextRoundIndex >= rounds.length) {
            console.log('🏆 Tournament is already complete!');
            return;
        }

        const nextRound = rounds[nextRoundIndex];
        console.log(`🔄 Generating ${nextRound}...`);

        // Ambil pemenang dari current round
        const finishedMatches = await prisma.match.findMany({
            where: {
                phase: 'knockout',
                round: currentRound,
                status: 'finished'
            },
            include: {
                teamA: true,
                teamB: true
            },
            orderBy: {
                matchOrder: 'asc'
            }
        });

        console.log(`📊 ${finishedMatches.length} finished matches in ${currentRound}`);

        // Dapatkan pemenang dari setiap match
        const winners = [];
        for (const match of finishedMatches) {
            let winnerId = null;
            if (match.scoreA > match.scoreB) {
                winnerId = match.teamAId;
            } else if (match.scoreB > match.scoreA) {
                winnerId = match.teamBId;
            } else {
                // Seri -> pilih random
                winnerId = Math.random() > 0.5 ? match.teamAId : match.teamBId;
            }
            
            if (winnerId) {
                const winner = await prisma.team.findUnique({
                    where: { id: winnerId }
                });
                if (winner) {
                    winners.push(winner);
                }
            }
        }

        console.log(`🏆 ${winners.length} winners found`);

        // Update next round matches dengan winners
        const nextMatches = await prisma.match.findMany({
            where: {
                phase: 'knockout',
                round: nextRound,
                status: 'scheduled'
            },
            orderBy: {
                matchOrder: 'asc'
            }
        });

        console.log(`📊 ${nextMatches.length} matches in ${nextRound}`);

        for (let i = 0; i < Math.min(nextMatches.length, Math.floor(winners.length / 2)); i++) {
            const match = nextMatches[i];
            const teamA = winners[i * 2];
            const teamB = winners[i * 2 + 1];
            
            if (teamA && teamB) {
                await prisma.match.update({
                    where: { id: match.id },
                    data: {
                        teamAId: teamA.id,
                        teamBId: teamB.id
                    }
                });
                console.log(`✅ ${nextRound} Match ${i+1}: ${teamA.name} vs ${teamB.name}`);
            }
        }

        console.log(`\n✅ ${nextRound} generated successfully!`);
        console.log('📝 Check the bracket in web!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

generateNextRound()
    .catch(console.error)
    .finally(() => prisma.$disconnect());