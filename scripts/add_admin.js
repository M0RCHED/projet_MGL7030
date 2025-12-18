import bcrypt from "bcrypt";
import pg from "pg";

const username = process.argv[2];
const password = process.argv[3];
const googleEmail = process.argv[4] || null;

if (!username || !password) {
  console.log("Usage: node scripts/add_admin.js <username> <password> [google_email]");
  process.exit(1);
}

const pool = new pg.Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || "cremerie",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "root"
});

const run = async () => {
  const hash = await bcrypt.hash(password, 10);
  const r = await pool.query(
      "INSERT INTO admins (username, password_hash, google_email) VALUES ($1, $2, $3) RETURNING id, username, google_email",
      [username, hash, googleEmail]
  );
  console.log(r.rows[0]);
  await pool.end();
};

run().catch(async (e) => {
  console.error(e.message);
  await pool.end();
  process.exit(1);
});
