const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fiveMinsAgo = new Date(Date.now() - 30 * 60000); // 30 mins ago
  const rejected = await prisma.rejectedEvent.findMany({
    where: { createdAt: { gte: fiveMinsAgo } },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(rejected.map(r => ({ title: r.titleExtracted, reason: r.reason, date: r.createdAt })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
