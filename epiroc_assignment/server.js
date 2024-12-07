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
const BATTERY_FULL_CHARGE = 100;
const LOW_BATTERY = 20;
const BATTERY_CHARGE_PER_SEC = 3;
const POWER_GAUGE_WHILE_CHARGING = -750;
const POWER_GAUGE_ZERO = 0;
const BATTERY_ZERO_CHARGE = 0;
const MOTOR_HIGH_SPEED = 700;

const simulateBatteryCharge = async () => {

        // Check if the charging status is true
        const isCharging = (await pool.query(
            "SELECT is_on FROM vehicle_status WHERE indicator = 'charging'"
        )).rows[0].is_on;

        let power_gauge = (await pool.query(
          "SELECT value FROM vehicle_values WHERE name = 'power_gauge'"
      )).rows[0].value;

        if (isCharging) {

            let isMotorRunning = (await pool.query(
                "SELECT is_on FROM vehicle_status WHERE indicator = 'motor_status'"
            )).rows[0].is_on;

            if (isMotorRunning) {
              await pool.query(
                "UPDATE vehicle_status SET is_on = false WHERE indicator = 'motor_status'"
            );
            await pool.query(
              "UPDATE vehicle_values SET value = 0 WHERE name = 'motor_speed_setting'"
          );
            }

            let batteryPercent = (await pool.query(
                "SELECT value FROM vehicle_values WHERE name = 'battery_percent'"
            )).rows[0].value;

            let isBatteryLow = (await pool.query(
                "SELECT is_on FROM vehicle_status WHERE indicator = 'battery_low'"
            )).rows[0].is_on;

            if (batteryPercent >  LOW_BATTERY && isBatteryLow) {
                await pool.query(
                    "UPDATE vehicle_status SET is_on = false WHERE indicator = 'battery_low'"
                );
            }
            if (batteryPercent < BATTERY_FULL_CHARGE) {
                batteryPercent += BATTERY_CHARGE_PER_SEC;
                if(batteryPercent > BATTERY_FULL_CHARGE) {
                  batteryPercent = BATTERY_FULL_CHARGE;
                }

                await pool.query(
                    "UPDATE vehicle_values SET value = $1 WHERE name = 'battery_percent'",
                    [batteryPercent]
                );

                if (power_gauge != POWER_GAUGE_WHILE_CHARGING){
                  await pool.query(
                    "UPDATE vehicle_values SET value = $1 WHERE name = 'power_gauge'",
                    [POWER_GAUGE_WHILE_CHARGING]
                  );
                }
            }
            else {
                if (power_gauge != 0){
                  await pool.query(
                    "UPDATE vehicle_values SET value = $1 WHERE name = 'power_gauge'",
                    [POWER_GAUGE_ZERO]
                  );
                }
            }
        }
        else {
          const isMotorRunning = (await pool.query(
            "SELECT is_on FROM vehicle_status WHERE indicator = 'motor_status'"
        )).rows[0].is_on;
          if(!isMotorRunning){
            if (power_gauge != 0){
              await pool.query(
                "UPDATE vehicle_values SET value = $1 WHERE name = 'power_gauge'",
                [POWER_GAUGE_ZERO]
              );
            }
          }
        }
};


const simulateMotorRunning = async () => {

  let isMotorRunning = (await pool.query(
    "SELECT is_on FROM vehicle_status WHERE indicator = 'motor_status'"
    )).rows[0].is_on;

  let motor_speed_setting = (await pool.query(
    "SELECT value FROM vehicle_values WHERE name = 'motor_speed_setting'"
    )).rows[0].value;
    if (motor_speed_setting == 0 && isMotorRunning) {
      isMotorRunning = false;
      await pool.query(
        "UPDATE vehicle_status SET is_on = false WHERE indicator = 'motor_status'"
    );
    }
    else if(motor_speed_setting !=0 && !isMotorRunning) {
      isMotorRunning = true;
      await pool.query(
        "UPDATE vehicle_status SET is_on = true WHERE indicator = 'motor_status'"
    );
    }
      let queried_power_gauge = (await pool.query(
        "SELECT value FROM vehicle_values WHERE name = 'power_gauge'"
    )).rows[0].value;
      let calculated_power_guage = motor_speed_setting * 250;

      let queried_motor_rpm = (await pool.query(
        "SELECT value FROM vehicle_values WHERE name = 'motor_rpm'"
    )).rows[0].value;
      let calculated_motor_rpm = motor_speed_setting * 200;

      const isCharging = (await pool.query(
        "SELECT is_on FROM vehicle_status WHERE indicator = 'charging'"
        )).rows[0].is_on;

        if(queried_power_gauge != calculated_power_guage && !isCharging){
          await pool.query(
            "UPDATE vehicle_values SET value = $1 WHERE name = 'power_gauge'",
            [calculated_power_guage]
          );
        }
        if(queried_motor_rpm != calculated_motor_rpm){
          await pool.query(
            "UPDATE vehicle_values SET value = $1 WHERE name = 'motor_rpm'",
            [calculated_motor_rpm]
          );
        }
        const isMotorHighSpeed = (await pool.query(
            "SELECT is_on FROM vehicle_status WHERE indicator = 'motor_high_speed'"
            )).rows[0].is_on;
        
            if(!isMotorHighSpeed && calculated_motor_rpm > MOTOR_HIGH_SPEED) {
                await pool.query(
                    "UPDATE vehicle_status SET is_on = true WHERE indicator = 'motor_high_speed'"
                );
            }
            else if (isMotorHighSpeed && calculated_motor_rpm <= MOTOR_HIGH_SPEED) {
                await pool.query(
                    "UPDATE vehicle_status SET is_on = false WHERE indicator = 'motor_high_speed'"
                );
            }
        if (isMotorRunning) {
            let batteryPercent = (await pool.query(
                "SELECT value FROM vehicle_values WHERE name = 'battery_percent'"
            )).rows[0].value;

            let isBatteryLow = (await pool.query(
                "SELECT is_on FROM vehicle_status WHERE indicator = 'battery_low'"
            )).rows[0].is_on;

            if (batteryPercent <  LOW_BATTERY && !isBatteryLow) {
                await pool.query(
                    "UPDATE vehicle_status SET is_on = true WHERE indicator = 'battery_low'"
                );
            }
            calculated_charge_drop = motor_speed_setting;
            if (batteryPercent > BATTERY_ZERO_CHARGE) {
                batteryPercent -= calculated_charge_drop;
                if(batteryPercent < BATTERY_ZERO_CHARGE) {
                batteryPercent = BATTERY_ZERO_CHARGE;
                }

                await pool.query(
                    "UPDATE vehicle_values SET value = $1 WHERE name = 'battery_percent'",
                    [batteryPercent]
                );
            }
            else {
                await pool.query(
                    "UPDATE vehicle_status SET is_on = false WHERE indicator = 'motor_status'"
                );
                await pool.query(
                    "UPDATE vehicle_values SET value = 0 WHERE name = 'motor_speed_setting'"
                );
            }
        }
        
}



setInterval(simulateBatteryCharge, LOOP_INTERVAL);
setInterval(simulateMotorRunning, LOOP_INTERVAL);