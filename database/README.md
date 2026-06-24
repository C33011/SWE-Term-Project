First, if you haven't created the user/db yet, run this:

CREATE USER swe_user WITH PASSWORD 'password';
CREATE DATABASE swe_db OWNER swe_user;
GRANT ALL PRIVILEGES ON DATABASE swe_db TO swe_user;

Then, to seed it, run this:

psql -U swe_user -d swe_db -f database/schema.sql
psql -U swe_user -d swe_db -f database/seed.sql