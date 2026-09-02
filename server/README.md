# Paramount Direct — Backend API

FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL backend for the Paramount Direct
insurance platform.

## Stack
- **FastAPI** — web framework, auto docs at `/docs`
- **SQLAlchemy 2.0** — ORM
- **Alembic** — DB migrations
- **PostgreSQL** — database (local cluster on `:5432`)
- **JWT auth** — with `admin` / `reviewer` / `agent` roles (RBAC)

## Setup (WSL / Ubuntu)

```bash
cd ~/Projects/paramountdirect_v2.0/server

# 1. Virtual environment + deps
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Configure (defaults already point at the local DB)
cp .env.example .env    # edit if your DB creds differ

# 3. Create tables
alembic upgrade head

# 4. Seed admin + sample data
python -m app.seed

# 5. Run
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive API.

## Default admin
- email: `admin@paramountdirect.example.com`
- password: `admin12345`

(Change these in `.env` before seeding for anything beyond local dev.)

## Roles
| Role      | Can do                                                        |
|-----------|---------------------------------------------------------------|
| admin     | everything, incl. creating users                              |
| reviewer  | create + update applications (advance status, set premium)    |
| agent     | create + read applications                                    |

## Key endpoints
- `POST /api/auth/login` — OAuth2 password flow (username = email)
- `GET  /api/auth/me` — current user
- `POST /api/auth/users` — create user (admin only)
- `GET/POST /api/applications` — list / create
- `GET/PATCH /api/applications/{id}` — detail / update
- `GET /api/dashboard/summary` — KPIs + Customer Acquisition breakdown
- `GET /api/health` — health check
