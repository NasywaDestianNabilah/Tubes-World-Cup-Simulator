const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌍 Seeding World Cup 2026 - 48 Teams...');

  // Hapus data existing
  await prisma.match.deleteMany({});
  await prisma.team.deleteMany({});
  
  const teams = [
    // ===== GROUP A =====
    { name: 'Brazil', code: 'BRA', groupName: 'A' },
    { name: 'Croatia', code: 'CRO', groupName: 'A' },
    { name: 'Cameroon', code: 'CMR', groupName: 'A' },
    { name: 'New Zealand', code: 'NZL', groupName: 'A' },
    
    // ===== GROUP B =====
    { name: 'Argentina', code: 'ARG', groupName: 'B' },
    { name: 'Netherlands', code: 'NED', groupName: 'B' },
    { name: 'Nigeria', code: 'NGA', groupName: 'B' },
    { name: 'Canada', code: 'CAN', groupName: 'B' },
    
    // ===== GROUP C =====
    { name: 'France', code: 'FRA', groupName: 'C' },
    { name: 'Denmark', code: 'DEN', groupName: 'C' },
    { name: 'Senegal', code: 'SEN', groupName: 'C' },
    { name: 'Australia', code: 'AUS', groupName: 'C' },
    
    // ===== GROUP D =====
    { name: 'England', code: 'ENG', groupName: 'D' },
    { name: 'Germany', code: 'GER', groupName: 'D' },
    { name: 'Morocco', code: 'MAR', groupName: 'D' },
    { name: 'Costa Rica', code: 'CRC', groupName: 'D' },
    
    // ===== GROUP E =====
    { name: 'Spain', code: 'ESP', groupName: 'E' },
    { name: 'Portugal', code: 'POR', groupName: 'E' },
    { name: 'Iran', code: 'IRN', groupName: 'E' },
    { name: 'South Korea', code: 'KOR', groupName: 'E' },
    
    // ===== GROUP F =====
    { name: 'Italy', code: 'ITA', groupName: 'F' },
    { name: 'Belgium', code: 'BEL', groupName: 'F' },
    { name: 'Mexico', code: 'MEX', groupName: 'F' },
    { name: 'Saudi Arabia', code: 'KSA', groupName: 'F' },
    
    // ===== GROUP G =====
    { name: 'Uruguay', code: 'URU', groupName: 'G' },
    { name: 'Switzerland', code: 'SUI', groupName: 'G' },
    { name: 'Ghana', code: 'GHA', groupName: 'G' },
    { name: 'Japan', code: 'JPN', groupName: 'G' },
    
    // ===== GROUP H =====
    { name: 'Colombia', code: 'COL', groupName: 'H' },
    { name: 'Sweden', code: 'SWE', groupName: 'H' },
    { name: 'Algeria', code: 'ALG', groupName: 'H' },
    { name: 'Ukraine', code: 'UKR', groupName: 'H' },
    
    // ===== GROUP I =====
    { name: 'Chile', code: 'CHI', groupName: 'I' },
    { name: 'Poland', code: 'POL', groupName: 'I' },
    { name: 'Egypt', code: 'EGY', groupName: 'I' },
    { name: 'Wales', code: 'WAL', groupName: 'I' },
    
    // ===== GROUP J =====
    { name: 'Ecuador', code: 'ECU', groupName: 'J' },
    { name: 'Serbia', code: 'SRB', groupName: 'J' },
    { name: 'Tunisia', code: 'TUN', groupName: 'J' },
    { name: 'Panama', code: 'PAN', groupName: 'J' },
    
    // ===== GROUP K =====
    { name: 'Peru', code: 'PER', groupName: 'K' },
    { name: 'Czech Republic', code: 'CZE', groupName: 'K' },
    { name: 'Ivory Coast', code: 'CIV', groupName: 'K' },
    { name: 'Iraq', code: 'IRQ', groupName: 'K' },
    
    // ===== GROUP L =====
    { name: 'USA', code: 'USA', groupName: 'L' },
    { name: 'Norway', code: 'NOR', groupName: 'L' },
    { name: 'South Africa', code: 'RSA', groupName: 'L' },
    { name: 'China', code: 'CHN', groupName: 'L' }
  ];

  for (const team of teams) {
    await prisma.team.create({
      data: team
    });
  }

  console.log(`✅ Seeded ${teams.length} teams successfully!`);
  console.log(`📊 12 Groups (A-L) with 4 teams each`);
  console.log(`🏆 Format: Top 2 + 8 best third-placed = 32 teams to knockout`);
  console.log(`\n📋 Teams per group:`);
  
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  for (const group of groups) {
    const groupTeams = teams.filter(t => t.groupName === group);
    console.log(`   Group ${group}: ${groupTeams.map(t => t.code).join(', ')}`);
  }
}

main()
  .catch(e => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });