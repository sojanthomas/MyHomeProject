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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
