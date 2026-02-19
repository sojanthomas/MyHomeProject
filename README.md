# Home Asset Management System

This is a full-stack application for managing home assets, built with React (Vite), Node.js/Express, MySQL, and Docker.

## Features
- Add, edit, delete, and view home assets
- Data stored in MySQL database
- Fully dockerized (frontend, backend, and database)

## Getting Started

### Prerequisites
- Docker & Docker Compose

### Running the App
1. Clone this repository
2. Run `docker-compose up --build`
3. Access the frontend at http://localhost:3000
4. The backend API runs at http://localhost:5000

## Project Structure
- `client/` - React frontend
- `server/` - Node.js/Express backend
- `docker-compose.yml` - Multi-container orchestration

## Environment Variables
See `server/.env` for backend DB config.

## Database
- MySQL 8
- Table: `assets` (id, name, value, location, purchase_date)

---

Built with ❤️ using Vite, React, Express, MySQL, and Docker.
