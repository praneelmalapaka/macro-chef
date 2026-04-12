const pool = require("./db");

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Connected to PostgreSQL");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

testConnection();