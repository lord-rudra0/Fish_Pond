const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database setup
const db = new sqlite3.Database('sensor_data.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        db.run(`
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                value INTEGER NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

// Routes
app.post('/submit-data', (req, res) => {
    try {
        const { sensor_value } = req.body;
        if (sensor_value === undefined) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        const query = 'INSERT INTO sensor_data (value) VALUES (?)';
        db.run(query, [sensor_value], function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(200).json({ message: 'Data saved successfully' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/get-data', (req, res) => {
    try {
        const query = 'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100';
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            const data = rows.map(row => ({
                id: row.id,
                value: row.value,
                timestamp: row.timestamp
            }));
            res.status(200).json(data);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
