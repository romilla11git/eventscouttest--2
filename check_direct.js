import pkg from 'pg';
const { Client } = pkg;

async function checkDirect() {
    console.log("Attempting direct connection to db...");
    const client = new Client({
        user: `postgres`,
        password: '1234',
        host: 'db.kykfheakmyhmhcguwhbj.supabase.co',
        port: 5432,
        database: 'postgres',
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
    });
    
    const start = Date.now();
    try {
        await client.connect();
        console.log(`SUCCESS connected to direct DB!`);
        
        const res = await client.query('SELECT NOW()');
        console.log(res.rows[0]);
        
        await client.end();
        process.exit(0);
    } catch (e) {
        const time = Date.now() - start;
        console.log(`Failed after ${time}ms:`, e.message);
        if (e.code) {
             console.log(`Error code:`, e.code);
        }
    }
}
checkDirect();
