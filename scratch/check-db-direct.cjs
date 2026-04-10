const pg = require('pg');
const { Pool } = pg;

const connectionString = "postgresql://neondb_owner:npg_6FnwrW3plBsk@ep-rough-frost-aka9f48l-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function check() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables found:", res.rows.map(r => r.table_name));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

check();
