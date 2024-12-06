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
  ssl: {
    rejectUnauthorized: false, // Use `true` for stricter validation if CA certificate is provided
  },
});

// CRUD Endpoints for `expt`

// Get all records
app.get("/api/vehicle_status", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vehicle_status");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single record by ID
app.get("/api/vehicle_status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const result = await pool.query("SELECT * FROM vehicle_status WHERE indicator = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/api/vehicle_values", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM vehicle_values");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get a single record by ID
  app.get("/api/vehicle_values/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query("SELECT * FROM vehicle_values WHERE name = $1", [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Create a new record
// app.post("/api/vehicle_status", async (req, res) => {
//   try {
//     const { indicator } = req.body;
//     const {is_on} = req.body;
//     const result = await pool.query(
//       "INSERT INTO vehicle_status (indicator, is_on) VALUES ($1, $2) RETURNING *",
//       [indicator, is_on]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Update a record by ID
app.put("/api/vehicle_status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_on } = req.body;
    const result = await pool.query(
      "UPDATE vehicle_status SET is_on = $1 WHERE indicator = $2 RETURNING *",
      [is_on, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/vehicle_values/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { value } = req.body;
      const result = await pool.query(
        "UPDATE vehicle_values SET value = $1 WHERE name = $2 RETURNING *",
        [value, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Delete a record by ID
// app.delete("/api/expt/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await pool.query("DELETE FROM expt WHERE id = $1 RETURNING *", [id]);
//     if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
//     res.json({ message: "Record deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const LOOP_INTERVAL = 2000; // 2 seconds
const FULL_CHARGE = 100;
const LOW_BATTERY = 20;
const simulateBatteryCharge = async () => {

        // Check if the charging status is true
        const chargingStatus = await pool.query(
            "SELECT is_on FROM vehicle_status WHERE indicator = 'charging'"
        );

        if (chargingStatus.rows[0]?.is_on) {
            let batteryPercent = (await pool.query(
                "SELECT value FROM vehicle_values WHERE name = 'battery_percent'"
            )).rows[0].value;

            let batteryLow = (await pool.query(
                "SELECT is_on FROM vehicle_status WHERE indicator = 'battery_low'"
            )).rows[0].is_on;

            if (batteryPercent >  LOW_BATTERY && batteryLow) {
                await pool.query(
                    "UPDATE vehicle_status SET is_on = false WHERE indicator = 'battery_low'"
                );
            }

            if (batteryPercent < FULL_CHARGE) {
                batteryPercent += 1;

            // Update the battery_percent value in the database
                await pool.query(
                    "UPDATE vehicle_values SET value = $1 WHERE name = 'battery_percent'",
                    [batteryPercent]
                );
            }
        }

        let batteryPercent = (await pool.query(
            "SELECT value FROM vehicle_values WHERE name = 'battery_percent'"
        )).rows[0].value;

};
setInterval(simulateBatteryCharge, LOOP_INTERVAL);