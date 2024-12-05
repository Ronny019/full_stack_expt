const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Configure PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// CRUD Endpoints for `expt`

// Get all records
app.get("/api/expt", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expt");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single record by ID
app.get("/api/expt/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM expt WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new record
app.post("/api/expt", async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      "INSERT INTO expt (name) VALUES ($1) RETURNING *",
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a record by ID
app.put("/api/expt/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await pool.query(
      "UPDATE expt SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a record by ID
app.delete("/api/expt/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM expt WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
