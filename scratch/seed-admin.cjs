const pg = require('pg');
const { Pool } = pg;
const bcrypt = require('bcryptjs');

const connectionString = "postgresql://neondb_owner:npg_6FnwrW3plBsk@ep-rough-frost-aka9f48l-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function seed() {
  try {
    const email = 'admin@zdspgc.edu';
    const password = 'admin123';
    
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      console.log("Admin user already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
      ["Admin User", email, hashedPassword, "admin"]
    );
    console.log("Admin user seeded successfully.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

seed();
