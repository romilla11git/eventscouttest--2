const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rejected = await prisma.rejectedEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(rejected.map(r => ({ title: r.titleExtracted, reason: r.reason })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
