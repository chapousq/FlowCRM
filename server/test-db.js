const { Pool } = require('pg');

const passwords = ['Senhaqqq446.', 'Senhaqqq446', 'bkjHlKvA2T7eQTqX'];
const hosts = [
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
];

async function test() {
  for (const pw of passwords) {
    for (const host of hosts) {
      const url = `postgresql://postgres:${pw}@${host}:6543/postgres`;
      process.stdout.write(`${host} pw=${pw.substring(0,8)}... `);
      const p = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
      try {
        const r = await p.query('SELECT 1');
        console.log('OK!');
        console.log('\nURL: ' + url);
        await p.end();
        process.exit(0);
      } catch (e) {
        console.log(e.code);
        await p.end().catch(() => {});
      }
    }
  }
  console.log('\nFalhou todas');
  process.exit(1);
}
test();
