const express = require('express');
const router = express.Router();
const db = require('../models/db');


// GET /api/scenarios - Get all scenarios
router.get("/", (req, res) => {
    db.all("SELECT * FROM scenarios ORDER BY created_at DESC", [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ scenarios: rows });
    })
})

// GET /api/scenarios/:id - Get a specific scenario
router.get('/:id', (req, res) => {
    const id = req.params.id;
    
    db.get('SELECT * FROM scenarios WHERE id = ?', [id], (err, row) => {
        if (err) res.status(500).json({ error: err.message });
        else if (!row) res.status(404).json({ error: 'Scenario not found' });
        else res.json({ scenario: row });
    });
});

// GET /api/scenarios/:id - Get a specific scenario
router.get('/:id', (req, res) => {
    const id = req.params.id;
    
    db.get('SELECT * FROM scenarios WHERE id = ?', [id], (err, row) => {
        if (err) res.status(500).json({ error: err.message });
        else if (!row) res.status(404).json({ error: 'Scenario not found' });
        else res.json({ scenario: row });
    });
});

// POST /api/scenarios - Create a new scenario
router.post('/', (req, res) => {
    const { name, description, building_data, exit_data } = req.body;
    
    // Validate required fields
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    
    // Convert objects to JSON strings for storage
    const buildingDataStr = JSON.stringify(building_data);
    const exitDataStr = JSON.stringify(exit_data);
    
    const sql = `INSERT INTO scenarios (name, description, building_data, exit_data) 
                 VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [name, description, buildingDataStr, exitDataStr], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ 
                id: this.lastID, 
                message: 'Scenario created successfully' 
            });
        }
    });
});

// DELETE /api/scenarios/:id - Delete a scenario
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    
    db.run('DELETE FROM scenarios WHERE id = ?', [id], function(err) {
        if (err) res.status(500).json({ error: err.message });
        else if (this.changes === 0) res.status(404).json({ error: 'Scenario not found' });
        else res.json({ message: 'Scenario deleted successfully' });
    });
});

module.exports = router;