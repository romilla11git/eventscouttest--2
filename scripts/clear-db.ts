import { prisma } from '../lib/prisma';
async function main() {
  await prisma.event.deleteMany({});
  console.log('All events cleared.');
}
main().catch(console.error);
