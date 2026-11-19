# Smart Expense Calculator 💳 📊

A full-stack personal finance and expense management platform engineered with **FastAPI**, **React 18**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL**.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jaivanthm24-cyber/smart-expense-calculator)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jaivanthm24-cyber/smart-expense-calculator&root-directory=frontend)

---

## Key Features

- **Non-Floating-Point Precision**: Financial computations use exact `NUMERIC(12, 2)` / Python `decimal.Decimal` types.
- **Strict Data Isolation**: User multi-tenancy ensures all queries are filtered by authenticated user identity.
- **Argon2 Password Security**: Modern password hashing with JWT access tokens and database-tracked refresh tokens.
- **Interactive Overview Dashboard**: Key metrics (Income, Expenses, Net Balance, Savings Rate), 6-month historical trends, category donut breakdown, and recent audited ledger entries.
- **Dynamic Date Filters**: Filter across Today, This Week, This Month, Last Month, This Year, or custom date ranges.
- **Smart Budgets & Warnings**: Overall and category-level monthly budgets with automated 80% warning and 100% exceeded alert thresholds.
- **Savings Goals & Contributions**: Milestone tracking with progress bars, remaining target amount, days left, and required monthly contributions.
- **Behavioral Analytics**: Day-of-week spending habits, daily spend averages, and period-over-period delta comparisons.
- **Rule-Based Insights**: Real-time financial observations (MoM category spikes, expense-to-income ratio analysis) with a 0-100 Financial Health Score.
- **Statement Exports**: 1-click downloads for audit-ready CSV spreadsheets and PDF reports.
- **Modern Responsive Design**: Dark and light themes with smooth transitions across mobile, tablet, and desktop views.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, React Hook Form, Zod |
| **Backend** | Python 3, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, ReportLab |
| **Database** | PostgreSQL 16 (production) / SQLite (zero-dependency local development) |
| **Security** | Argon2id, JWT (HS256), SHA-256 hashed refresh tokens, security headers, CORS |
| **Testing** | Pytest (backend), Vitest + Testing Library (frontend) |
| **DevOps** | Docker, Docker Compose, Nginx, GitHub Actions CI/CD |

---

## Architecture Diagram

```mermaid
graph TD
    Client["Browser / Single-Page App"]
    Proxy["Nginx Gateway (:3000)"]
    API["FastAPI Backend (:8000)"]
    DB[("PostgreSQL / SQLite Database")]

    Client -->|HTTP / SPA Navigation| Proxy
    Proxy -->|API Requests /api/| API
    API -->|SQLAlchemy ORM (Decimal)| DB
```

---

## Local Development Setup

### Prerequisites
- Node.js 20+ & npm
- Python 3.10+
- (Optional) Docker & Docker Compose

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations and start server
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
FastAPI Swagger API docs will be accessible at: `http://localhost:8000/api/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application UI will run at: `http://localhost:3000`

---

## Running with Docker Compose

Start the full production-style containerized environment (PostgreSQL + FastAPI + Nginx React Frontend):

```bash
docker compose up --build
```

- Web Application: `http://localhost:3000`
- API Endpoints: `http://localhost:8000/api`
- API Docs: `http://localhost:8000/api/docs`

---

## Running Automated Tests

### Backend Tests (Pytest)
```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest -v
```
All 12 backend test suites cover auth, CRUD, budget calculations, savings, analytics, and reports.

### Frontend Tests (Vitest)
```bash
cd frontend
npm run test
```
Vitest validates UI components, interaction handling, and formatting utilities.

---

## Project Structure

```
smart-expense-calculator/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components & modals
│   │   ├── pages/          # Dashboard, Expenses, Budgets, Analytics, etc.
│   │   ├── context/        # Auth & Theme providers
│   │   ├── services/       # Axios client & typed API endpoints
│   │   └── utils/          # Currency & date formatters
│   ├── nginx.conf          # Reverse proxy configuration
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Route handlers
│   │   ├── core/           # Security, config & database setup
│   │   ├── models/         # SQLAlchemy schema entities
│   │   ├── schemas/        # Pydantic validation models
│   │   ├── services/       # Core business logic engines
│   │   └── main.py         # Application entry point
│   ├── migrations/         # Alembic database migrations
│   ├── tests/              # Pytest test suite
│   └── requirements.txt
│
├── docs/                   # Architecture, database schema, & API reference
├── docker-compose.yml
├── .env.example
└── README.md
```
