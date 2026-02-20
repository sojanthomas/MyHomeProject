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

// Ensure activities table exists
await db.execute(
  `CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity VARCHAR(255) NOT NULL,
    activity_datetime DATETIME NOT NULL,
    description TEXT,
    comments TEXT,
    priority VARCHAR(32),
    assigned_to VARCHAR(255)
  )`
);

// Ensure accounts table exists
await db.execute(
  `CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_name VARCHAR(255),
    account_number VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) DEFAULT 0,
    maturity_date DATE,
    balance DECIMAL(15,2) DEFAULT 0,
    comments TEXT
  )`
);

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

// Accounts CRUD
app.post('/api/accounts', async (req, res) => {
  const { account_name, account_number, amount, maturity_date, balance, comments } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO accounts (account_name, account_number, amount, maturity_date, balance, comments) VALUES (?, ?, ?, ?, ?, ?)',
      [account_name, account_number, amount ?? 0, maturity_date ?? null, balance ?? 0, comments]
    );
    res.status(201).json({ id: result.insertId, account_name, account_number, amount, maturity_date, balance, comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/accounts', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM accounts ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  const { id } = req.params;
  const { account_name, account_number, amount, maturity_date, balance, comments } = req.body;
  try {
    await db.execute(
      'UPDATE accounts SET account_name=?, account_number=?, amount=?, maturity_date=?, balance=?, comments=? WHERE id=?',
      [account_name, account_number, amount ?? 0, maturity_date ?? null, balance ?? 0, comments, id]
    );
    res.json({ id, account_name, account_number, amount, maturity_date, balance, comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM accounts WHERE id=?', [id]);
    res.json({ success: true });
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

// Activities CRUD
app.post('/api/activities', async (req, res) => {
  const { activity, activity_datetime, description, comments, priority, assigned_to } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO activities (activity, activity_datetime, description, comments, priority, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
      [activity, activity_datetime, description, comments, priority, assigned_to]
    );
    res.status(201).json({ id: result.insertId, activity, activity_datetime, description, comments, priority, assigned_to });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM activities ORDER BY activity_datetime DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/activities/:id', async (req, res) => {
  const { id } = req.params;
  const { activity, activity_datetime, description, comments, priority, assigned_to } = req.body;
  try {
    await db.execute(
      'UPDATE activities SET activity=?, activity_datetime=?, description=?, comments=?, priority=?, assigned_to=? WHERE id=?',
      [activity, activity_datetime, description, comments, priority, assigned_to, id]
    );
    res.json({ id, activity, activity_datetime, description, comments, priority, assigned_to });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/activities/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM activities WHERE id=?', [id]);
    res.json({ success: true });
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
