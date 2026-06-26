# Cinema E-Booking System (CES)

A full-stack movie booking app built with React (frontend) and Node/Express (backend), backed by a PostgreSQL database. Features include a dynamic home page, search by title, filter by genre, and a movie details page with embedded trailers.

---

## Prerequisites

Install these first (skip any you already have):

- [Node.js (LTS)](https://nodejs.org/) — includes `npm`
- [PostgreSQL 17](https://www.postgresql.org/download/) — includes `psql`
- [Git](https://git-scm.com/)

> **Windows note:** If `psql` is not recognized, add PostgreSQL to your PATH. Run this in PowerShell (adjust `17` to your version), then reopen PowerShell:
> ```powershell
> [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PostgreSQL\17\bin", "User")
> ```

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/C33011/SWE-Term-Project.git
cd SWE-Term-Project
```

---

## Step 2 — Create the database

Open the PostgreSQL shell (enter your `postgres` password when prompted):

```bash
psql -U postgres
```

Paste these lines one at a time:

```sql
CREATE USER swe_user WITH PASSWORD 'password';
CREATE DATABASE swe_db OWNER swe_user;
GRANT ALL PRIVILEGES ON DATABASE swe_db TO swe_user;
\c swe_db
GRANT ALL ON SCHEMA public TO swe_user;
\q
```

> **Already ran this before?** Drop and recreate for a clean slate:
> ```sql
> DROP DATABASE IF EXISTS swe_db;
> CREATE DATABASE swe_db OWNER swe_user;
> \c swe_db
> GRANT ALL ON SCHEMA public TO swe_user;
> \q
> ```
> (If you see "role swe_user does not exist," run the `CREATE USER` line first.)

---

## Step 3 — Load the schema and seed data

The SQL files are included in the repo. From the `SWE-Term-Project` folder, type `password` when prompted:

```bash
psql -U swe_user -d swe_db -f ces-backend/schema.sql
psql -U swe_user -d swe_db -f ces-backend/seed.sql
```

Verify it worked — this should print a number greater than 0:

```bash
psql -U swe_user -d swe_db -c "SELECT COUNT(*) FROM movies;"
```

---

## Step 4 — Create the backend `.env` file

The `.env` file is not checked in to Git. Create it from inside the `SWE-Term-Project` folder.

**PowerShell:**
```powershell
@"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swe_db
DB_USER=swe_user
DB_PASSWORD=password
PORT=8080
"@ | Out-File -Encoding utf8 ces-backend\.env
```

**Or create `ces-backend/.env` by hand with this content:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swe_db
DB_USER=swe_user
DB_PASSWORD=password
PORT=8080
```

---

## Step 5 — Start the app

**Terminal 1 — backend:**
```bash
cd ces-backend
npm install
npm run dev
```
You should see: `CES backend running on http://localhost:8080`

**Terminal 2 — frontend** (keep the first terminal open):
```bash
cd ces-frontend
npm install
npm run dev
```

Then open **`http://localhost:5173`** in your browser.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `psql` not recognized | PostgreSQL not on PATH | See the Windows note under Prerequisites |
| `relation "genres" already exists` | Tables already created | Harmless, or use the clean-slate reset in Step 2 |
| Homepage is empty (no movies) | Database not seeded or backend can't connect | Re-check Step 3 count is > 0; confirm `.env` exists and matches your DB |
| `relation "movies" does not exist` (backend window) | Database has no tables | Re-run Step 3 to load schema and seed |
| Backend starts but homepage still empty | `.env` file missing or wrong path | Re-do Step 4, then restart the backend |

---

## Screenshots

### Home Page
![Home Page](screenshots/Homepage.png)

### Filter by genre
![Filter](screenshots/Filter.png)

### Movie Details page with trailer
![Movie Details](screenshots/MovieDetails.png)
