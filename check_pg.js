
import pkg from 'pg';
const { Client } = pkg;

async function check() {
    const regions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1', 'eu-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3', 'ap-south-1', 'sa-east-1', 'ca-central-1', 'af-south-1', 'me-south-1'];
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const client = new Client({
            user: `postgres.kykfheakmyhmhcguwhbj`,
            password: '1234',
            host: host,
            port: 5432,
            database: 'postgres',
            connectionTimeoutMillis: 5000
        });
        
        try {
            await client.connect();
            console.log(`SUCCESS in ${region}!`);
            await client.end();
            process.exit(0);
        } catch (e) {
            if (e.message.includes('Tenant or user not found')) {
                // not this region
            } else if (e.message.includes('password authentication failed')) {
                console.log(`FOUND REGION (wrong password, but tenant exists): ${region}`);
                process.exit(0);
            } else {
                console.log(`Error in ${region}: ${e.message}`);
            }
        }
    }
    console.log("Could not find tenant in any region.");
}
check();
