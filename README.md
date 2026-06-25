# Cinema E-Booking System (CES)

This branch adds the **Node.js backend**, **Movie Details page**, and **trailer playback** on top of the team's React frontend and PostgreSQL database. This guide lets anyone clone the branch and run the full project locally from scratch.

---

## What this branch includes

- **Node + Express backend** (`ces-backend/`) that connects the frontend to the PostgreSQL database
- **Home Page** populated dynamically from the database
- **Search** by movie title
- **Filter** by genre
- **Movie Details page** with poster, rating, description, showtimes, and an embedded, playable trailer

---

## Prerequisites

Install these first (skip any you already have):

- [Node.js (LTS)](https://nodejs.org/) — includes `npm`
- [PostgreSQL 17](https://www.postgresql.org/download/) — includes `psql`
- [Git](https://git-scm.com/)

Verify they work by running:

```bash
node --version
npm --version
psql --version
git --version
```

Each should print a version number.

---

## 1. Clone the project and switch to this branch

```bash
git clone https://github.com/C33011/SWE-Term-Project.git
cd SWE-Term-Project
git checkout afrin/backend
```

---

## 2. Set up the database

The database files live on the `tate/database` branch. The quickest way is to grab those two SQL files (`schema.sql` and `seed.sql`) from that branch, or ask a teammate for them. Then:

**a) Create the database and user.** Open the PostgreSQL shell (use your own postgres password when prompted):

```bash
psql -U postgres
```

Then run these lines inside the shell:

```sql
CREATE USER swe_user WITH PASSWORD 'password';
CREATE DATABASE swe_db OWNER swe_user;
GRANT ALL PRIVILEGES ON DATABASE swe_db TO swe_user;
\c swe_db
GRANT ALL ON SCHEMA public TO swe_user;
\q
```

**b) Load the schema and the seed data** (type `password` when prompted):

```bash
psql -U swe_user -d swe_db -f path/to/schema.sql
psql -U swe_user -d swe_db -f path/to/seed.sql
```

**c) Verify** — this should print `12`:

```bash
psql -U swe_user -d swe_db -c "SELECT COUNT(*) FROM movies;"
```

---

## 3. Create the backend `.env` file

The `.env` file holds the database password, so it is **not** uploaded to GitHub. Create it yourself.

Inside the `ces-backend/` folder, create a file named `.env` with this content:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swe_db
DB_USER=swe_user
DB_PASSWORD=password
PORT=8080
```

---

## 4. Run the backend

In a terminal:

```bash
cd ces-backend
npm install
npm run dev
```

You should see:

```
CES backend running on http://localhost:8080
```

Leave this terminal running.

---

## 5. Run the frontend

Open a **second** terminal:

```bash
cd ces-frontend
npm install
npm run dev
```

Then open the link it shows (usually `http://localhost:5173`) in your browser.

Leave this terminal running too. You now have the full app working: backend on port 8080, frontend on port 5173.

---

## Quick reference

| What | Command | Where |
|------|---------|-------|
| Start backend | `npm run dev` | `ces-backend/` |
| Start frontend | `npm run dev` | `ces-frontend/` |
| Stop a server | `Ctrl + C` | in its terminal |

---

## Screenshots

### Home Page (movies from database)
![Home Page](screenshots/Homepage.png)

### Filter by genre
![Filter](screenshots/Filter.png)

### Movie Details page with trailer
![Movie Details](screenshots/MovieDetails.png)
