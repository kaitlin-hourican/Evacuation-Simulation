const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const db = require("./models/db");

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// test routes
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Backend is running" });
});

app.get('/api/db-test', (req, res) => {
    db.get('SELECT 1 as result', [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Database connection successful', result: row });
        }
    });
});

app.get('/api/tables', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ tables: rows });
        }
    });
});

// route imports
const scenarioRoutes = require('./routes/scenarios');
// const simulationRoutes = require('./routes/simulations');

// routes
app.use('/api/scenarios', scenarioRoutes);
// app.use('/api/simulations', simulationRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// server config
app.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});