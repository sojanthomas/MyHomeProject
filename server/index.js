import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = await mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'home_assets',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create asset
app.post('/api/assets', async (req, res) => {
  const { name, value, location, purchase_date } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO assets (name, value, location, purchase_date) VALUES (?, ?, ?, ?)',
      [name, value, location, purchase_date]
    );
    res.status(201).json({ id: result.insertId, name, value, location, purchase_date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all assets
app.get('/api/assets', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM assets');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update asset
app.put('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  const { name, value, location, purchase_date } = req.body;
  try {
    await db.execute(
      'UPDATE assets SET name=?, value=?, location=?, purchase_date=? WHERE id=?',
      [name, value, location, purchase_date, id]
    );
    res.json({ id, name, value, location, purchase_date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete asset
app.delete('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM assets WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
