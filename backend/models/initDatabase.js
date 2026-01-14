// initialisation file - connection to db and creates tables

const db = require("./db");

db.run(`
    CREATE TABLE IF NOT EXISTS scenarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        building_data TEXT,
        exit_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('Error creating scenarios table:', err.message);
    } else {
        console.log('scenarios table created successfully');
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS simulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenario_id INTEGER,
        num_agents INTEGER NOT NULL,
        parameters TEXT,
        run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    )
`, (err) => {
    if (err) {
        console.error('Error creating simulations table:', err.message);
    } else {
        console.log('simulations table created successfully');
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        simulation_id INTEGER,
        total_time REAL,
        evacuation_rate REAL,
        bottlenecks TEXT,
        agent_data TEXT,
        FOREIGN KEY (simulation_id) REFERENCES simulations(id)
    )
`, (err) => {
    if (err) {
        console.error('Error creating results table:', err.message);
    } else {
        console.log('results table created successfully');
    }
});

// Give tables time to be created, then close
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database initialization complete');
        }
    });
}, 1000);