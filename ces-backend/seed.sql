INSERT INTO genres (name, description) VALUES
    ('Action',    'High-energy films featuring stunts, chases, and adventure'),
    ('Horror',    'Films designed to frighten and unsettle the audience'),
    ('Comedy',    'Light-hearted films intended to make audiences laugh'),
    ('Drama',     'Character-driven films exploring serious or emotional themes'),
    ('Sci-Fi',    'Films exploring futuristic technology and scientific concepts'),
    ('Animation', 'Films produced using animated or CGI imagery'),
    ('Thriller',  'Suspenseful films built on tension and unexpected twists'),
    ('Romance',   'Films centered on love stories and relationships');


INSERT INTO halls (hall_name, capacity, total_seats) VALUES
    ('Hall A', 100, 100),
    ('Hall B', 75,  75),
    ('Hall C', 50,  50);


INSERT INTO seats (hall_id, seat_row, seat_number, status)
SELECT 1, chr(64 + gs_row), gs_seat, 'available'
FROM generate_series(1, 10) AS gs_row,
     generate_series(1, 10) AS gs_seat;

INSERT INTO seats (hall_id, seat_row, seat_number, status)
SELECT 2, chr(64 + gs_row), gs_seat, 'available'
FROM generate_series(1, 5) AS gs_row,
     generate_series(1, 15) AS gs_seat;

INSERT INTO seats (hall_id, seat_row, seat_number, status)
SELECT 3, chr(64 + gs_row), gs_seat, 'available'
FROM generate_series(1, 5) AS gs_row,
     generate_series(1, 10) AS gs_seat;


INSERT INTO movies (title, genre_id, rating, description, poster_url, trailer_url, director, cast_members, status, release_date)
VALUES
(
    'Toy Story 5',
    (SELECT genre_id FROM genres WHERE name = 'Animation' LIMIT 1),
    'PG',
    'Bonnie gets a new tablet named Lilypad and stops playing with her toys. Jessie, Woody, and Buzz have to figure out what they mean to her now.',
    'https://image.tmdb.org/t/p/w500/7veGbEIL1nvtVXVwFlqCs62zsvc.jpg',
    'https://www.youtube.com/embed/c51ND9Hdbw0',
    'Andrew Stanton',
    'Tom Hanks, Tim Allen, Joan Cusack, Greta Lee, Conan O''Brien',
    'Currently Running',
    '2026-06-19'
),
(
    'Obsession',
    (SELECT genre_id FROM genres WHERE name = 'Horror' LIMIT 1),
    'R',
    'A music store employee makes a wish for his friend to fall in love with him—and gets exactly that, in the worst possible way.',
    'https://image.tmdb.org/t/p/w500/bRwnj8WEKBCvmfeUNOukJPwB43K.jpg',
    'https://www.youtube.com/embed/TaaDkbG3I7g',
    'Curry Barker',
    'Michael Johnston, Inde Navarrette, Cooper Tomlinson, Andy Richter',
    'Currently Running',
    '2026-05-15'
),
(
    'Backrooms',
    (SELECT genre_id FROM genres WHERE name = 'Horror' LIMIT 1),
    'R',
    'A furniture store owner falls through a crack in his wall and into an endless maze of yellow rooms. Something is already in there with him.',
    'https://image.tmdb.org/t/p/w500/rhGx6E3qRNMgj3i5su2oukNHwIQ.jpg',
    'https://www.youtube.com/embed/0HjdiohVOik',
    'Kane Parsons',
    'Chiwetel Ejiofor, Renate Reinsve, Mark Duplass, Finn Bennett, Lukita Maxwell',
    'Currently Running',
    '2026-05-29'
),
(
    'Project Hail Mary',
    (SELECT genre_id FROM genres WHERE name = 'Sci-Fi' LIMIT 1),
    'PG-13',
    'Ryland Grace wakes up alone on an interstellar spaceship with no memory. As it comes back to him, he realizes he may be humanity''s last hope.',
    'https://image.tmdb.org/t/p/w500/yihdXomYb5kTeSivtFndMy5iDmf.jpg',
    'https://www.youtube.com/embed/m08TxIsFTRI',
    'Phil Lord, Christopher Miller',
    'Ryan Gosling, Sandra Hüller, James Ortiz, Lionel Boyce',
    'Currently Running',
    '2026-03-20'
),
(
    'Masters of the Universe',
    (SELECT genre_id FROM genres WHERE name = 'Action' LIMIT 1),
    'PG-13',
    'Raised on Earth, Prince Adam reclaims the Sword of Power and discovers his destiny on Eternia—becoming He-Man to fight the warlord Skeletor.',
    'https://image.tmdb.org/t/p/w500/3YMd9Ogae4rDKLWuAZFuse9xhc5.jpg',
    'https://www.youtube.com/embed/X21JsHLHnY8',
    'Travis Knight',
    'Nicholas Galitzine, Camila Mendes, Jared Leto, Idris Elba, Alison Brie',
    'Currently Running',
    '2026-06-05'
),
(
    'Scary Movie',
    (SELECT genre_id FROM genres WHERE name = 'Comedy' LIMIT 1),
    'R',
    'Cindy, Brenda, Shorty, and Ray are back. So is Ghostface—and this time the killer is targeting the whole legacy cast.',
    'https://image.tmdb.org/t/p/w500/bqOKJrZFR9KpqWE607dw6KOdKCj.jpg',
    'https://www.youtube.com/embed/0fZ58S-7QP0',
    'Michael Tiddes',
    'Marlon Wayans, Shawn Wayans, Anna Faris, Regina Hall',
    'Currently Running',
    '2026-06-05'
);


INSERT INTO movies (title, genre_id, rating, description, poster_url, trailer_url, director, cast_members, status, release_date)
VALUES
(
    'Supergirl',
    (SELECT genre_id FROM genres WHERE name = 'Action' LIMIT 1),
    'PG-13',
    'When a ruthless enemy strikes too close to home, Kara Zor-El teams up with an unlikely companion on an interstellar journey of vengeance and justice.',
    'https://image.tmdb.org/t/p/w500/xhei2GX9L2H1eQlrHeFw44VNLd1.jpg',
    'https://www.youtube.com/embed/s1-pfiVMKAs',
    'Craig Gillespie',
    'Milly Alcock, Matthias Schoenaerts, Eve Ridley, Jason Momoa, David Corenswet',
    'Coming Soon',
    '2026-06-26'
),
(
    'Jackass: Best and Last',
    (SELECT genre_id FROM genres WHERE name = 'Comedy' LIMIT 1),
    'R',
    'The original Jackass crew reunites for their final film—a send-off packed with the most outrageous stunts they''ve ever pulled, plus a look back at 26 years of chaos.',
    'https://image.tmdb.org/t/p/w500/tfgccePxnswMqhmtxafliLlcCVR.jpg',
    'https://www.youtube.com/embed/sNwzFhGwA94',
    'Jeff Tremaine',
    'Johnny Knoxville, Steve-O, Chris Pontius, Wee Man, Dave England, Danger Ehren',
    'Coming Soon',
    '2026-06-26'
),
(
    'Lucky Strike',
    (SELECT genre_id FROM genres WHERE name = 'Thriller' LIMIT 1),
    'R',
    'During the Battle of the Bulge, a wounded American soldier is trapped behind German lines with nothing but a radio. He has to fight his way out before the Panzer army rolls through.',
    'https://image.tmdb.org/t/p/w500/kzRAd7mj39ZY3FGNrDdZjqx56tn.jpg',
    'https://www.youtube.com/embed/vtEnjikCXyA',
    'Rod Lurie',
    'Scott Eastwood, Colin Hanks, Aunjanue Ellis-Taylor, Taylor John Smith',
    'Coming Soon',
    '2026-06-26'
),
(
    'Welcome to the Jungle',
    (SELECT genre_id FROM genres WHERE name = 'Comedy' LIMIT 1),
    'NR',
    'The mob bosses, bodyguards, and everyone in between are back for another round of absolute chaos in this third installment of the Welcome series.',
    'https://image.tmdb.org/t/p/w500/zibb9EBBCsCeXOUbEw0J6yA0vhZ.jpg',
    'https://www.youtube.com/embed/R704yP3dlXw',
    'Ahmed Khan',
    'Akshay Kumar, Suniel Shetty, Disha Patani, Jacqueline Fernandez, Arshad Warsi',
    'Coming Soon',
    '2026-06-26'
),
(
    'Runner',
    (SELECT genre_id FROM genres WHERE name = 'Action' LIMIT 1),
    'R',
    'A courier has three hours to deliver a life-saving organ to a sick girl. Then a cartel decides they want it and he has to outrun them to save her life.',
    'https://image.tmdb.org/t/p/w500/gA1UBGxQp0xRaewFF5AE7Xdy1b3.jpg',
    'https://www.youtube.com/embed/2ZfuX4IBTXM',
    'Scott Waugh',
    'Alan Ritchson, Owen Wilson, Rodrigo Santoro, Leila George, Adriana Barraza',
    'Coming Soon',
    '2026-09-11'
),
(
    'Evil Dead Burn',
    (SELECT genre_id FROM genres WHERE name = 'Horror' LIMIT 1),
    'R',
    'After the loss of her husband, a woman seeks solace with her in-laws. As one by one they transform into deadites, she comes to discover that the vows she took in life - survive even in death.',
    'https://image.tmdb.org/t/p/w500/ztadKzIIR0ERYqpHteaPFtk7inP.jpg',
    'https://www.youtube.com/embed/TnHby2cxJzs',
    'Sébastien Vaniček',
    'Souheila Yacoub, Tandi Wright, Hunter Doohan, Luciane Buchanan, Maude Davey',
    'Coming Soon',
    '2026-07-10'
);


INSERT INTO showtimes (movie_id, hall_id, show_datetime, available_seats) VALUES
    ((SELECT movie_id FROM movies WHERE title = 'Toy Story 5'), 1, '2026-06-23 14:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Toy Story 5'), 1, '2026-06-23 17:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Toy Story 5'), 1, '2026-06-23 20:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Toy Story 5'), 1, '2026-06-24 14:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Toy Story 5'), 1, '2026-06-24 17:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Toy Story 5'), 1, '2026-06-24 20:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Toy Story 5'), 1, '2026-06-25 14:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Toy Story 5'), 1, '2026-06-25 17:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Toy Story 5'), 1, '2026-06-25 20:00:00', 100);

INSERT INTO showtimes (movie_id, hall_id, show_datetime, available_seats) VALUES
    ((SELECT movie_id FROM movies WHERE title = 'Obsession'), 2, '2026-06-23 14:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Obsession'), 2, '2026-06-23 17:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Obsession'), 2, '2026-06-23 20:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Obsession'), 2, '2026-06-24 14:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Obsession'), 2, '2026-06-24 17:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Obsession'), 2, '2026-06-24 20:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Obsession'), 2, '2026-06-25 14:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Obsession'), 2, '2026-06-25 17:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Obsession'), 2, '2026-06-25 20:00:00', 75);

INSERT INTO showtimes (movie_id, hall_id, show_datetime, available_seats) VALUES
    ((SELECT movie_id FROM movies WHERE title = 'Backrooms'), 3, '2026-06-23 14:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Backrooms'), 3, '2026-06-23 17:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Backrooms'), 3, '2026-06-23 20:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Backrooms'), 3, '2026-06-24 14:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Backrooms'), 3, '2026-06-24 17:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Backrooms'), 3, '2026-06-24 20:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Backrooms'), 3, '2026-06-25 14:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Backrooms'), 3, '2026-06-25 17:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Backrooms'), 3, '2026-06-25 20:00:00', 50);

INSERT INTO showtimes (movie_id, hall_id, show_datetime, available_seats) VALUES
    ((SELECT movie_id FROM movies WHERE title = 'Project Hail Mary'), 1, '2026-06-23 14:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Project Hail Mary'), 1, '2026-06-23 17:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Project Hail Mary'), 1, '2026-06-23 20:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Project Hail Mary'), 1, '2026-06-24 14:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Project Hail Mary'), 1, '2026-06-24 17:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Project Hail Mary'), 1, '2026-06-24 20:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Project Hail Mary'), 1, '2026-06-25 14:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Project Hail Mary'), 1, '2026-06-25 17:00:00', 100),
    ((SELECT movie_id FROM movies WHERE title = 'Project Hail Mary'), 1, '2026-06-25 20:00:00', 100);

INSERT INTO showtimes (movie_id, hall_id, show_datetime, available_seats) VALUES
    ((SELECT movie_id FROM movies WHERE title = 'Masters of the Universe'), 2, '2026-06-23 14:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Masters of the Universe'), 2, '2026-06-23 17:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Masters of the Universe'), 2, '2026-06-23 20:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Masters of the Universe'), 2, '2026-06-24 14:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Masters of the Universe'), 2, '2026-06-24 17:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Masters of the Universe'), 2, '2026-06-24 20:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Masters of the Universe'), 2, '2026-06-25 14:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Masters of the Universe'), 2, '2026-06-25 17:00:00', 75),
    ((SELECT movie_id FROM movies WHERE title = 'Masters of the Universe'), 2, '2026-06-25 20:00:00', 75);

INSERT INTO showtimes (movie_id, hall_id, show_datetime, available_seats) VALUES
    ((SELECT movie_id FROM movies WHERE title = 'Scary Movie'), 3, '2026-06-23 14:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Scary Movie'), 3, '2026-06-23 17:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Scary Movie'), 3, '2026-06-23 20:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Scary Movie'), 3, '2026-06-24 14:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Scary Movie'), 3, '2026-06-24 17:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Scary Movie'), 3, '2026-06-24 20:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Scary Movie'), 3, '2026-06-25 14:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Scary Movie'), 3, '2026-06-25 17:00:00', 50),
    ((SELECT movie_id FROM movies WHERE title = 'Scary Movie'), 3, '2026-06-25 20:00:00', 50);
