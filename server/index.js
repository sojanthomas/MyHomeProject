import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { XMLParser } from 'fast-xml-parser';

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

const JWT_SECRET = process.env.JWT_SECRET || 'myhomeproject_secret_2026';

// Ensure users table exists
await db.execute(
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
);

// Auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email || null, hash]
    );
    const token = jwt.sign({ id: result.insertId, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid username or password' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) return res.status(400).json({ error: 'Username and new password required' });
  try {
    const [rows] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.status(404).json({ error: 'Username not found' });
    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password_hash = ? WHERE username = ?', [hash, username]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// Ensure budgets table exists
await db.execute(
  `CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(15,2) NOT NULL,
    month_year VARCHAR(7) NOT NULL UNIQUE,
    closed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
);

// Ensure expenses table exists
await db.execute(
  `CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    scheduled BOOLEAN DEFAULT FALSE,
    paid BOOLEAN DEFAULT FALSE,
    month_year VARCHAR(7) NOT NULL,
    budget_id INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
);

// Ensure stocks table exists
await db.execute(
  `CREATE TABLE IF NOT EXISTS stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(32) NOT NULL,
    name VARCHAR(255),
    qty DECIMAL(15,4) DEFAULT 0,
    current_price DECIMAL(15,4) DEFAULT 0,
    financial_institution VARCHAR(255),
    cost DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) DEFAULT 0
  )`
);

// Ensure sticky_notes table exists
await db.execute(
  `CREATE TABLE IF NOT EXISTS sticky_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT,
    severity VARCHAR(32) DEFAULT 'low',
    position VARCHAR(16) DEFAULT 'left',
    color VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Stocks CRUD
app.get('/api/stocks', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM stocks ORDER BY id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/stocks', async (req, res) => {
  const { symbol, name, qty, current_price, financial_institution, cost, balance } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO stocks (symbol, name, qty, current_price, financial_institution, cost, balance) VALUES (?,?,?,?,?,?,?)',
      [symbol, name, qty ?? 0, current_price ?? 0, financial_institution, cost ?? 0, balance ?? 0]
    );
    res.status(201).json({ id: result.insertId, symbol, name, qty, current_price, financial_institution, cost, balance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/stocks/:id', async (req, res) => {
  const { id } = req.params;
  const { symbol, name, qty, current_price, financial_institution, cost, balance } = req.body;
  try {
    await db.execute(
      'UPDATE stocks SET symbol=?,name=?,qty=?,current_price=?,financial_institution=?,cost=?,balance=? WHERE id=?',
      [symbol, name, qty ?? 0, current_price ?? 0, financial_institution, cost ?? 0, balance ?? 0, id]
    );
    res.json({ id, symbol, name, qty, current_price, financial_institution, cost, balance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/stocks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM stocks WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============= BUDGET TRACKER ROUTES =============
const getCurrentMonthYear = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const getNextMonthYear = (my) => {
  const [y, m] = my.split('-');
  let nm = parseInt(m) + 1, ny = parseInt(y);
  if (nm > 12) { nm = 1; ny++; }
  return `${ny}-${String(nm).padStart(2, '0')}`;
};

app.get('/api/budgets/:monthYear', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, amount, month_year as monthYear, closed, created_at as createdAt FROM budgets WHERE month_year=?',
      [req.params.monthYear]
    );
    if (!rows.length) return res.status(404).json({ error: 'No budget found for this month' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/months', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT DISTINCT month_year FROM budgets ORDER BY month_year DESC');
    res.json(rows.map(r => r.month_year));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/budgets', async (req, res) => {
  const { amount, monthYear } = req.body;
  const month = monthYear || getCurrentMonthYear();
  try {
    const [existing] = await db.execute('SELECT id FROM budgets WHERE month_year=?', [month]);
    if (existing.length) {
      await db.execute('UPDATE budgets SET amount=? WHERE month_year=?', [amount, month]);
      const [updated] = await db.execute(
        'SELECT id, amount, month_year as monthYear, closed, created_at as createdAt FROM budgets WHERE month_year=?', [month]);
      return res.json(updated[0]);
    }
    const [result] = await db.execute('INSERT INTO budgets (amount, month_year) VALUES (?,?)', [amount, month]);
    res.status(201).json({ id: result.insertId, amount: parseFloat(amount), monthYear: month, closed: false, createdAt: new Date().toISOString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/expenses/:monthYear', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, title, amount, scheduled, paid, month_year as monthYear, created_at as createdAt FROM expenses WHERE month_year=? ORDER BY created_at DESC',
      [req.params.monthYear]
    );
    res.json(rows.map(e => ({ ...e, amount: parseFloat(e.amount), paid: Boolean(e.paid), scheduled: Boolean(e.scheduled) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/summary/:monthYear', async (req, res) => {
  const { monthYear } = req.params;
  try {
    const [budgets] = await db.execute('SELECT amount, closed FROM budgets WHERE month_year=?', [monthYear]);
    const budgetAmount = budgets.length ? parseFloat(budgets[0].amount) : 0;
    const closed = budgets.length ? Boolean(budgets[0].closed) : false;
    const [exps] = await db.execute(
      'SELECT id, title, amount, scheduled, paid, created_at as createdAt FROM expenses WHERE month_year=? ORDER BY created_at DESC',
      [monthYear]
    );
    const expenses = exps.map(e => ({ ...e, amount: parseFloat(e.amount), paid: Boolean(e.paid), scheduled: Boolean(e.scheduled) }));
    const paidExpenses   = expenses.filter(e => !e.scheduled).reduce((s, e) => s + e.amount, 0);
    const scheduledExpenses = expenses.filter(e => e.scheduled).reduce((s, e) => s + e.amount, 0);
    const balance = budgetAmount - paidExpenses - scheduledExpenses;
    res.json({ monthYear, budget: budgetAmount, closed, paidExpenses: +paidExpenses.toFixed(2), scheduledExpenses: +scheduledExpenses.toFixed(2), balance: +balance.toFixed(2), expenses });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses', async (req, res) => {
  const { title, amount, scheduled, paid, monthYear } = req.body;
  const month = monthYear || getCurrentMonthYear();
  try {
    const [result] = await db.execute(
      'INSERT INTO expenses (title, amount, scheduled, paid, month_year) VALUES (?,?,?,?,?)',
      [title, amount, scheduled || false, paid || false, month]
    );
    res.status(201).json({ id: result.insertId, title, amount: parseFloat(amount), scheduled: Boolean(scheduled), paid: Boolean(paid), monthYear: month, createdAt: new Date().toISOString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/expenses/:id', async (req, res) => {
  const { title, amount, scheduled, paid } = req.body;
  try {
    const [cur] = await db.execute('SELECT * FROM expenses WHERE id=?', [req.params.id]);
    if (!cur.length) return res.status(404).json({ error: 'Expense not found' });
    const c = cur[0];
    await db.execute(
      'UPDATE expenses SET title=?, amount=?, scheduled=?, paid=? WHERE id=?',
      [title ?? c.title, amount ?? c.amount, scheduled ?? c.scheduled, paid ?? c.paid, req.params.id]
    );
    res.json({ id: parseInt(req.params.id), title: title ?? c.title, amount: parseFloat(amount ?? c.amount), scheduled: Boolean(scheduled ?? c.scheduled), paid: Boolean(paid ?? c.paid), monthYear: c.month_year, createdAt: c.created_at });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM expenses WHERE id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Expense not found' });
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/expenses/month/:monthYear', async (req, res) => {
  try {
    await db.execute('DELETE FROM expenses WHERE month_year=?', [req.params.monthYear]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/expenses/:id/paid', async (req, res) => {
  const { paid } = req.body;
  if (typeof paid !== 'boolean') return res.status(400).json({ error: 'paid must be boolean' });
  try {
    const [result] = await db.execute('UPDATE expenses SET paid=? WHERE id=?', [paid, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Expense not found' });
    res.json({ id: parseInt(req.params.id), paid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/carryover/:monthYear', async (req, res) => {
  const { monthYear } = req.params;
  const nextMonth = getNextMonthYear(monthYear);
  try {
    const [exps] = await db.execute('SELECT title, amount, scheduled FROM expenses WHERE month_year=? ORDER BY id ASC', [monthYear]);
    if (!exps.length) return res.json({ message: 'No expenses to carry over', count: 0, nextMonth });
    for (const e of exps) {
      await db.execute('INSERT INTO expenses (title, amount, scheduled, paid, month_year) VALUES (?,?,?,?,?)', [e.title, e.amount, e.scheduled, false, nextMonth]);
    }
    res.json({ message: `Carried over ${exps.length} expenses to ${nextMonth}`, count: exps.length, nextMonth });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/close-month/:monthYear', async (req, res) => {
  const { monthYear } = req.params;
  try {
    const [result] = await db.execute('UPDATE expenses SET paid=TRUE WHERE month_year=? AND paid=FALSE', [monthYear]);
    await db.execute('UPDATE budgets SET closed=TRUE WHERE month_year=?', [monthYear]);
    res.json({ message: `Closed payments for ${monthYear}`, updated: result.affectedRows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sticky notes CRUD
app.post('/api/stickies', async (req, res) => {
  const { content, severity, position, color } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO sticky_notes (content, severity, position, color) VALUES (?, ?, ?, ?)',
      [content, severity ?? 'low', position ?? 'left', color ?? null]
    );
    res.status(201).json({ id: result.insertId, content, severity, position, color });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stickies', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM sticky_notes ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/stickies/:id', async (req, res) => {
  const { id } = req.params;
  const { content, severity, position, color } = req.body;
  try {
    await db.execute(
      'UPDATE sticky_notes SET content=?, severity=?, position=?, color=? WHERE id=?',
      [content, severity ?? 'low', position ?? 'left', color ?? null, id]
    );
    res.json({ id, content, severity, position, color });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stickies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM sticky_notes WHERE id=?', [id]);
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

// ── Market News Route ─────────────────────────────────────
const RSS_SOURCES = [
  { name: 'Yahoo Finance',  url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US' },
  { name: 'MarketWatch',   url: 'https://feeds.marketwatch.com/marketwatch/topstories/' },
  { name: 'CNBC Markets',  url: 'https://search.cnbc.com/rs/search/combinedcache/orderedby/date/output/rss/search.html?partnerId=wrss01&id=10000664' },
  { name: 'Reuters',       url: 'https://feeds.reuters.com/reuters/businessNews' },
  { name: 'Seeking Alpha', url: 'https://seekingalpha.com/market_currents.xml' },
];

const POSITIVE = [
  [/\b(soar|soars|soared|soaring)\b/gi, 4],
  [/\b(surge|surges|surged|surging)\b/gi, 4],
  [/\brecord high\b/gi, 4],
  [/\b(rally|rallies|rallied|rallying)\b/gi, 3],
  [/\b(jump|jumps|jumped|jumping)\b/gi, 3],
  [/\b(upgrade|upgrades|upgraded)\b/gi, 3],
  [/\bbeat(s| expectations| estimates)\b/gi, 3],
  [/\bbullish\b/gi, 3],
  [/\b(boost|boosts|boosted)\b/gi, 2],
  [/\b(gain|gains|gained)\b/gi, 2],
  [/\b(rise|rises|rose|rising)\b/gi, 2],
  [/\b(grow|grows|grew|growth)\b/gi, 2],
  [/\b(profit|profits|profitability)\b/gi, 2],
  [/\b(recover|recovery|rebounds?)\b/gi, 2],
  [/\bstrong(er)?\b/gi, 2],
  [/\bopportunity\b/gi, 1],
];

const NEGATIVE = [
  [/\b(bankrupt|bankruptcy)\b/gi, -5],
  [/\b(collapse|collapses|collapsed)\b/gi, -5],
  [/\b(crash|crashes|crashed|crashing)\b/gi, -5],
  [/\b(plunge|plunges|plunged|plunging)\b/gi, -4],
  [/\brecession\b/gi, -4],
  [/\b(slump|slumps|slumped)\b/gi, -3],
  [/\b(miss(es| expectations| estimates)|missed)\b/gi, -3],
  [/\b(downgrade|downgrades|downgraded)\b/gi, -3],
  [/\bbearish\b/gi, -3],
  [/\b(layoff|layoffs)\b/gi, -3],
  [/\b(warn|warns|warning|warnings)\b/gi, -2],
  [/\b(fall|falls|fell|falling)\b/gi, -2],
  [/\b(drop|drops|dropped|dropping)\b/gi, -2],
  [/\b(decline|declines|declined)\b/gi, -2],
  [/\b(loss|losses)\b/gi, -2],
  [/\b(cut|cuts)\b/gi, -2],
  [/\bweak(er|ness)?\b/gi, -2],
  [/\bconcern(s|ed)?\b/gi, -1],
  [/\brisk(s|y)?\b/gi, -1],
  [/\binflation\b/gi, -1],
];

function scoreSentiment(text) {
  let score = 0;
  const t = text || '';
  for (const [re, v] of POSITIVE) score += (t.match(re) || []).length * v;
  for (const [re, v] of NEGATIVE) score += (t.match(re) || []).length * v;
  return score;
}

function sentimentLabel(score) {
  if (score >= 5)  return { label: 'Strong Bullish',  level: 'high-positive',  direction: 'up' };
  if (score >= 2)  return { label: 'Bullish',          level: 'positive',       direction: 'up' };
  if (score <= -5) return { label: 'Strong Bearish',   level: 'high-negative',  direction: 'down' };
  if (score <= -2) return { label: 'Bearish',           level: 'negative',       direction: 'down' };
  return              { label: 'Neutral',           level: 'neutral',        direction: 'neutral' };
}

async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HomeAssetBot/1.0)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel || parsed?.feed;
    if (!channel) return [];
    const items = channel.item || channel.entry || [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.slice(0, 20).map(item => {
      const title   = item.title?.['#text'] || item.title || '';
      const desc    = item.description?.['#text'] || item.description ||
                      item.summary?.['#text'] || item.summary || '';
      const link    = item.link?.['#text'] || item.link?.['@_href'] || item.link || '';
      const pubDate = item.pubDate || item.published || item.updated || item['dc:date'] || null;
      const score   = scoreSentiment(title + ' ' + desc);
      const sentiment = sentimentLabel(score);
      return {
        id:        Buffer.from(link || title).toString('base64').slice(0, 32),
        title:     String(title).trim(),
        description: String(desc).replace(/<[^>]*>/g, '').trim().slice(0, 220),
        link:      String(link).trim(),
        pubDate:   pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source:    source.name,
        score,
        ...sentiment,
      };
    }).filter(i => i.title);
  } catch {
    return [];
  }
}

app.get('/api/news/market', async (_req, res) => {
  try {
    const results = await Promise.allSettled(RSS_SOURCES.map(fetchRSS));
    const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    // Deduplicate by id
    const seen = new Set();
    const unique = all.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });
    // Sort newest first
    unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    res.json(unique.slice(0, 80));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sales & Deals News Route ─────────────────────────────
const DEALS_SOURCES = [
  { name: 'SlickDeals',     url: 'https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1' },
  { name: 'DealNews',       url: 'https://dealnews.com/rss.xml' },
  { name: "Brad's Deals",  url: 'https://www.bradsdeals.com/feed' },
  { name: '9to5Toys',       url: 'https://9to5toys.com/feed/' },
  { name: '9to5Mac Deals',  url: 'https://9to5mac.com/category/deals/feed/' },
  { name: 'The Wirecutter', url: 'https://www.nytimes.com/wirecutter/deals/feed/' },
  { name: 'Reddit Deals',   url: 'https://www.reddit.com/r/deals/.rss' },
  { name: 'Reddit Frugal',  url: 'https://www.reddit.com/r/Frugal/.rss' },
  { name: 'Kinja Deals',    url: 'https://feeds.feedburner.com/KinjaDeals' },
  { name: 'Tom\'s Guide',   url: 'https://www.tomsguide.com/feeds/all' },
];

const DEALS_CATEGORIES = [
  { name: 'Electronics',    icon: '💻', patterns: [/\b(laptop|phone|iphone|android|tablet|tv|television|monitor|headphone|earbuds|camera|gaming|console|playstation|xbox|nintendo|computer|pc|mac|ipad|speaker|printer|router|smartwatch|drone)\b/gi] },
  { name: 'Clothing',       icon: '👗', patterns: [/\b(shirt|pants|jeans|dress|shoes|sneakers|boots|jacket|coat|hoodie|sweater|fashion|apparel|clothing|levi|nike|adidas|gap|h&m|zara|underwear|socks|handbag|purse)\b/gi] },
  { name: 'Home & Kitchen', icon: '🏠', patterns: [/\b(kitchen|cookware|vacuum|blender|coffee|bedding|mattress|pillow|furniture|sofa|couch|lamp|appliance|instant pot|air fryer|oven|refrigerator|washer|dryer|dishwasher|towel|curtain|rug)\b/gi] },
  { name: 'Food & Grocery', icon: '🍎', patterns: [/\b(food|grocery|meal|snack|restaurant|pizza|burger|coffee|drink|wine|beer|chocolate|organic|whole foods|instacart|doordash|grubhub|uber eats|delivery)\b/gi] },
  { name: 'Beauty',         icon: '💄', patterns: [/\b(makeup|lipstick|foundation|skincare|moisturizer|serum|shampoo|conditioner|perfume|fragrance|loreal|maybelline|ulta|sephora|beauty|hair|nail|spa|grooming)\b/gi] },
  { name: 'Sports',         icon: '🏋️', patterns: [/\b(fitness|gym|workout|treadmill|bike|yoga|running|hiking|camping|fishing|sport|exercise|weight|protein|supplement|outdoor|gear|backpack)\b/gi] },
  { name: 'Gaming',         icon: '🎮', patterns: [/\b(game|gaming|playstation|xbox|nintendo|steam|pc game|video game|controller|headset|keyboard|mouse|monitor|fps|rpg|mmo)\b/gi] },
  { name: 'Travel',         icon: '✈️', patterns: [/\b(flight|hotel|travel|vacation|trip|cruise|airfare|booking|expedia|kayak|airbnb|resort|tour|luggage|passport)\b/gi] },
  { name: 'Books & Media',  icon: '📚', patterns: [/\b(book|kindle|audible|movie|music|streaming|netflix|spotify|disney|hulu|amazon prime|ebook|magazine)\b/gi] },
  { name: 'Toys & Kids',    icon: '🧸', patterns: [/\b(toy|lego|barbie|kids|children|baby|stroller|diaper|school|backpack|game|puzzle)\b/gi] },
];

const DEAL_HOT_RE   = [/\b(\d{2,3}%\s*off|save \$\d{3,}|up to \d{2,3}%|lowest (ever|price)|all[- ]time low|price drop|clearance|blowout|flash sale|today only|limited time|door buster)\b/gi];
const DEAL_GREAT_RE = [/\b(\d{2}%\s*off|save \$\d{2,}|deal of the day|hot deal|best deal|best price|huge discount|major discount|half off|50% off|buy one get one|bogo)\b/gi];
const DEAL_GOOD_RE  = [/\b(on sale|discount|coupon|promo|promotional|offer|special|reduced|markdown|off\s*$|\d+%\s*off|save \$\d+)\b/gi];

function scoreDeal(text) {
  const t = text || '';
  if (DEAL_HOT_RE.some(re   => { re.lastIndex = 0; return re.test(t); })) return { deal: 'hot',     dealLabel: 'Hot Deal' };
  if (DEAL_GREAT_RE.some(re => { re.lastIndex = 0; return re.test(t); })) return { deal: 'great',   dealLabel: 'Great Deal' };
  if (DEAL_GOOD_RE.some(re  => { re.lastIndex = 0; return re.test(t); })) return { deal: 'good',    dealLabel: 'Good Deal' };
  return { deal: 'regular', dealLabel: 'On Sale' };
}

function detectDealCategory(text) {
  const t = text || '';
  for (const cat of DEALS_CATEGORIES) {
    if (cat.patterns.some(re => { re.lastIndex = 0; return re.test(t); }))
      return { category: cat.name, categoryIcon: cat.icon };
  }
  return { category: 'General', categoryIcon: '🛍️' };
}

function extractDiscount(text) {
  const t = text || '';
  const pct   = t.match(/(\d{2,3})%\s*off/i);
  const dollar = t.match(/save \$(\d+)/i);
  if (pct)    return pct[1] + '% OFF';
  if (dollar) return '$' + dollar[1] + ' OFF';
  return '';
}

async function fetchDealsRSS(source) {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(7000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HomeAssetBot/1.0)', 'Accept': 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', cdataTagName: '__cdata' });
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel || parsed?.feed;
    if (!channel) return [];
    const items = channel.item || channel.entry || [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.slice(0, 25).map(item => {
      const title   = item.title?.['#text'] || item.title?.['__cdata'] || item.title || '';
      const desc    = item.description?.['#text'] || item.description?.['__cdata'] || item.description ||
                      item.summary?.['#text'] || item.summary || '';
      const link    = item.link?.['#text'] || item.link?.['@_href'] || item.link || '';
      const pubDate = item.pubDate || item.published || item.updated || null;
      const combined = String(title) + ' ' + String(desc);
      const { category, categoryIcon } = detectDealCategory(combined);
      return {
        id:          Buffer.from((link || title) + source.name).toString('base64').slice(0, 32),
        title:       String(title).replace(/<[^>]*>/g, '').trim(),
        description: String(desc).replace(/<[^>]*>/g, '').trim().slice(0, 200),
        link:        String(link).trim(),
        pubDate:     pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source:      source.name,
        category,
        categoryIcon,
        discount:    extractDiscount(combined),
        ...scoreDeal(combined),
      };
    }).filter(i => i.title);
  } catch {
    return [];
  }
}

app.get('/api/news/deals', async (_req, res) => {
  try {
    const results = await Promise.allSettled(DEALS_SOURCES.map(fetchDealsRSS));
    const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const seen = new Set();
    const unique = all.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });
    // Sort by deal quality then by date
    const order = { hot: 0, great: 1, good: 2, regular: 3 };
    unique.sort((a, b) => {
      if (order[a.deal] !== order[b.deal]) return order[a.deal] - order[b.deal];
      return new Date(b.pubDate) - new Date(a.pubDate);
    });
    res.json(unique.slice(0, 120));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── World News Route ─────────────────────────────────
const WORLD_SOURCES = [
  { name: 'BBC News',         url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'Reuters World',    url: 'https://feeds.reuters.com/Reuters/worldNews' },
  { name: 'AP News',          url: 'https://rsshub.app/apnews/topics/apf-topnews' },
  { name: 'CNN World',        url: 'http://rss.cnn.com/rss/edition_world.rss' },
  { name: 'The Guardian',     url: 'https://www.theguardian.com/world/rss' },
  { name: 'Al Jazeera',       url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'NPR News',         url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'DW World',         url: 'https://rss.dw.com/rdf/rss-en-all' },
];

const WORLD_CRITICAL = [
  /\b(war|wars|warfare|battle|battles)\b/gi,
  /\b(missile|missiles|nuclear|bombing|bombed|airstrike|airstrikes)\b/gi,
  /\b(genocide|massacre|atrocity|atrocities)\b/gi,
  /\b(terrorist|terrorism|attack|attacks|explosion|explosions)\b/gi,
  /\b(earthquake|tsunami|hurricane|tornado|catastrophe|catastrophic)\b/gi,
  /\b(pandemic|epidemic|outbreak|ebola|cholera)\b/gi,
  /\b(coup|invasion|invaded|military offensive)\b/gi,
  /\b(assassination|assassinated|killed (\d+ |dozens|hundreds|thousands))\b/gi,
];

const WORLD_HIGH = [
  /\b(conflict|fighting|clashes|troops|soldiers|forces)\b/gi,
  /\b(protest|protests|riot|riots|unrest|uprising)\b/gi,
  /\b(sanctions|embargo|expelled|detained|arrested|accused)\b/gi,
  /\b(flood|floods|wildfire|wildfires|drought|famine)\b/gi,
  /\b(crisis|emergency|urgent|warning|alert)\b/gi,
  /\b(recession|economic collapse|debt crisis|hyperinflation)\b/gi,
  /\b(death toll|casualties|wounded|injuries)\b/gi,
  /\b(election fraud|impeach|indicted|charged)\b/gi,
];

const WORLD_MEDIUM = [
  /\b(election|elections|vote|votes|referendum|poll)\b/gi,
  /\b(summit|talks|negotiations|agreement|treaty|deal)\b/gi,
  /\b(trade war|tariff|tariffs|ban|boycott)\b/gi,
  /\b(climate|pollution|emissions|carbon|refugee|migrants)\b/gi,
  /\b(scandal|corruption|investigation|probe)\b/gi,
  /\b(resign|resigned|fired|ousted|removed from office)\b/gi,
  /\b(disease|virus|health|hospital|vaccines?)\b/gi,
];

const WORLD_CATEGORIES = [
  { name: 'Conflict & War',  patterns: [/\b(war|battle|military|troops|missile|airstrike|invasion|offensive|combat|ceasefire)\b/gi] },
  { name: 'Disaster',        patterns: [/\b(earthquake|tsunami|flood|hurricane|tornado|wildfire|drought|famine|disaster|catastrophe)\b/gi] },
  { name: 'Politics',        patterns: [/\b(election|president|prime minister|government|parliament|senate|congress|vote|policy|diplomatic|minister)\b/gi] },
  { name: 'Health',          patterns: [/\b(health|disease|virus|pandemic|vaccine|hospital|cancer|WHO|CDC|outbreak|epidemic)\b/gi] },
  { name: 'Economy',         patterns: [/\b(economy|economic|markets?|trade|GDP|inflation|recession|currency|bank|investment|tariff|budget)\b/gi] },
  { name: 'Science & Tech',  patterns: [/\b(science|technology|space|AI|research|discovery|NASA|climate|innovation|quantum|robot)\b/gi] },
  { name: 'Environment',     patterns: [/\b(environment|climate change|carbon|emissions|species|ocean|deforestation|pollution|COP)\b/gi] },
  { name: 'Sports',          patterns: [/\b(football|soccer|Olympics|tennis|cricket|basketball|championship|World Cup|athlete|tournament)\b/gi] },
];

function scoreWorldSeverity(text) {
  const t = text || '';
  const crit   = WORLD_CRITICAL.some(re => re.test(t));
  const high   = WORLD_HIGH.some(re => re.test(t));
  const medium = WORLD_MEDIUM.some(re => re.test(t));
  if (crit)   return { severity: 'critical', severityLabel: 'Critical' };
  if (high)   return { severity: 'high',     severityLabel: 'High' };
  if (medium) return { severity: 'medium',   severityLabel: 'Medium' };
  return              { severity: 'low',      severityLabel: 'Low' };
}

function detectCategory(text) {
  const t = text || '';
  for (const cat of WORLD_CATEGORIES) {
    if (cat.patterns.some(re => { re.lastIndex = 0; return re.test(t); }))
      return cat.name;
  }
  return 'General';
}

async function fetchWorldRSS(source) {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HomeAssetBot/1.0)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel || parsed?.feed;
    if (!channel) return [];
    const items = channel.item || channel.entry || [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.slice(0, 20).map(item => {
      const title   = item.title?.['#text'] || item.title || '';
      const desc    = item.description?.['#text'] || item.description ||
                      item.summary?.['#text'] || item.summary || '';
      const link    = item.link?.['#text'] || item.link?.['@_href'] || item.link || '';
      const pubDate = item.pubDate || item.published || item.updated || item['dc:date'] || null;
      const combined = String(title) + ' ' + String(desc);
      return {
        id:          Buffer.from((link || title) + source.name).toString('base64').slice(0, 32),
        title:       String(title).trim(),
        description: String(desc).replace(/<[^>]*>/g, '').trim().slice(0, 220),
        link:        String(link).trim(),
        pubDate:     pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source:      source.name,
        category:    detectCategory(combined),
        ...scoreWorldSeverity(combined),
      };
    }).filter(i => i.title);
  } catch {
    return [];
  }
}

app.get('/api/news/world', async (_req, res) => {
  try {
    const results = await Promise.allSettled(WORLD_SOURCES.map(fetchWorldRSS));
    const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const seen = new Set();
    const unique = all.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });
    unique.sort((a, b) => {
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
      return new Date(b.pubDate) - new Date(a.pubDate);
    });
    res.json(unique.slice(0, 100));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
