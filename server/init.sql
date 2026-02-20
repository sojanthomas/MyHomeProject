CREATE DATABASE IF NOT EXISTS home_assets;
USE home_assets;

CREATE TABLE IF NOT EXISTS assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  location VARCHAR(255),
  purchase_date DATE
);

-- Sticky notes table
CREATE TABLE IF NOT EXISTS sticky_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT,
  severity VARCHAR(32) DEFAULT 'low',
  position VARCHAR(16) DEFAULT 'left',
  color VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
