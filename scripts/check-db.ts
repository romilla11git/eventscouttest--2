
import { prisma } from '../lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    try {
        console.log('Connecting to database...');
        // access a property to trigger connection
        await prisma.$connect();
        console.log('Connected successfully.');

        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);

        const users = await prisma.user.findMany({
            take: 5,
            select: { email: true, role: true, isActive: true }
        });
        console.log('Sample users:', users);

    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    } finally {
        // await prisma.$disconnect(); // shared instance, maybe don't disconnect or doesn't matter for script
    }
}

main();
