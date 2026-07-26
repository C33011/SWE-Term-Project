-- It does not remove or overwrite existing movies, users, cards, bookings, or showtimes.

BEGIN;

INSERT INTO theatres (name, address)
SELECT 'Cinema E-Booking Theatre', '123 College Ave, Athens, GA 30601'
WHERE NOT EXISTS (
  SELECT 1 FROM theatres WHERE name = 'Cinema E-Booking Theatre'
);

INSERT INTO genres (name, description)
SELECT 'Sci-Fi', 'Films exploring futuristic technology and scientific concepts'
WHERE NOT EXISTS (
  SELECT 1 FROM genres WHERE name = 'Sci-Fi'
);

INSERT INTO movies (
  title, genre_id, rating, description, poster_url, trailer_url,
  director, producer, cast_members, reviews, status, release_date
)
SELECT
  'Sprint 3 Demo Movie',
  (SELECT genre_id FROM genres WHERE name = 'Sci-Fi' ORDER BY genre_id LIMIT 1),
  'PG-13',
  'A demonstration movie used for the Sprint 3 booking workflow.',
  'https://placehold.co/500x750?text=Sprint+3+Demo',
  'https://www.youtube.com/embed/2ZfuX4IBTXM',
  'Demo Director',
  'Demo Producer',
  'Demo Actor One, Demo Actor Two',
  'Prepared specifically for the instructor demonstration.',
  'Currently Running',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM movies WHERE title = 'Sprint 3 Demo Movie'
);

INSERT INTO showrooms (theatre_id, showroom_name, number_of_seats)
SELECT t.theatre_id, v.name, v.capacity
FROM (VALUES
  ('Showroom A', 100),
  ('Showroom B', 75),
  ('Showroom C', 50)
) AS v(name, capacity)
CROSS JOIN LATERAL (
  SELECT theatre_id FROM theatres ORDER BY theatre_id LIMIT 1
) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM showrooms r WHERE r.showroom_name = v.name
);

-- Showroom A: 10 rows x 10 seats.
INSERT INTO seats (showroom_id, row_number, seat_number, status)
SELECT r.showroom_id, chr(64 + row_no), seat_no, 'available'
FROM showrooms r
CROSS JOIN generate_series(1, 10) AS row_no
CROSS JOIN generate_series(1, 10) AS seat_no
WHERE r.showroom_name = 'Showroom A'
  AND NOT EXISTS (
    SELECT 1 FROM seats s
    WHERE s.showroom_id = r.showroom_id
      AND s.row_number = chr(64 + row_no)
      AND s.seat_number = seat_no
  );

-- Showroom B: 5 rows x 15 seats.
INSERT INTO seats (showroom_id, row_number, seat_number, status)
SELECT r.showroom_id, chr(64 + row_no), seat_no, 'available'
FROM showrooms r
CROSS JOIN generate_series(1, 5) AS row_no
CROSS JOIN generate_series(1, 15) AS seat_no
WHERE r.showroom_name = 'Showroom B'
  AND NOT EXISTS (
    SELECT 1 FROM seats s
    WHERE s.showroom_id = r.showroom_id
      AND s.row_number = chr(64 + row_no)
      AND s.seat_number = seat_no
  );

-- Showroom C: 5 rows x 10 seats.
INSERT INTO seats (showroom_id, row_number, seat_number, status)
SELECT r.showroom_id, chr(64 + row_no), seat_no, 'available'
FROM showrooms r
CROSS JOIN generate_series(1, 5) AS row_no
CROSS JOIN generate_series(1, 10) AS seat_no
WHERE r.showroom_name = 'Showroom C'
  AND NOT EXISTS (
    SELECT 1 FROM seats s
    WHERE s.showroom_id = r.showroom_id
      AND s.row_number = chr(64 + row_no)
      AND s.seat_number = seat_no
  );

-- Future test showtimes in all three rooms.
INSERT INTO shows (movie_id, showroom_id, show_date, show_time, duration, available_seats)
SELECT m.movie_id, r.showroom_id, CURRENT_DATE + v.day_offset, v.show_time, 120, r.number_of_seats
FROM movies m
JOIN (VALUES
  ('Showroom A', 7,  TIME '18:00'),
  ('Showroom B', 8,  TIME '19:00'),
  ('Showroom C', 9,  TIME '20:00')
) AS v(room_name, day_offset, show_time) ON TRUE
JOIN showrooms r ON r.showroom_name = v.room_name
WHERE m.title = 'Sprint 3 Demo Movie'
  AND NOT EXISTS (
    SELECT 1 FROM shows s
    WHERE s.showroom_id = r.showroom_id
      AND s.show_date = CURRENT_DATE + v.day_offset
      AND s.show_time = v.show_time
  );

-- Add one booked seat to the first demo show so the red/disabled state is visible.
DO $$
DECLARE
  v_user_id INT;
  v_user_email TEXT;
  v_show_id INT;
  v_seat_id INT;
  v_booking_id INT;
BEGIN
  SELECT user_id, email
    INTO v_user_id, v_user_email
    FROM users
   WHERE role = 'customer' AND status = 'Active'
   ORDER BY user_id
   LIMIT 1;

  SELECT s.show_id
    INTO v_show_id
    FROM shows s
    JOIN movies m ON m.movie_id = s.movie_id
   WHERE m.title = 'Sprint 3 Demo Movie'
     AND (s.show_date + s.show_time) > CURRENT_TIMESTAMP
   ORDER BY s.show_date, s.show_time
   LIMIT 1;

  SELECT seat_id
    INTO v_seat_id
    FROM seats
   WHERE showroom_id = (SELECT showroom_id FROM shows WHERE show_id = v_show_id)
   ORDER BY row_number, seat_number
   LIMIT 1;

  IF v_user_id IS NOT NULL AND v_show_id IS NOT NULL AND v_seat_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM tickets WHERE show_id = v_show_id AND seat_id = v_seat_id
     ) THEN
    INSERT INTO bookings (user_id, total_amount, confirmation_email)
    VALUES (v_user_id, 12.50, v_user_email)
    RETURNING booking_id INTO v_booking_id;

    INSERT INTO tickets (booking_id, show_id, seat_id, ticket_type, price)
    VALUES (v_booking_id, v_show_id, v_seat_id, 'Adult', 12.50);

    UPDATE shows
       SET available_seats = GREATEST(COALESCE(available_seats, 1) - 1, 0)
     WHERE show_id = v_show_id;
  END IF;
END $$;

COMMIT;
