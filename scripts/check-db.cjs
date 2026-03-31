
const { PrismaClient } = require('@prisma/client');

try {
    const prisma = new PrismaClient();

    async function main() {
        console.log('Connecting...');
        await prisma.$connect();
        console.log('Connected!');

        const count = await prisma.user.count();
        console.log('User count:', count);

        await prisma.$disconnect();
    }

    main().catch(e => {
        console.error('Error:', e);
        process.exit(1);
    });
} catch (e) {
    console.error('Init Error:', e);
}
