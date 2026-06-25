CREATE TABLE genres (
    genre_id    SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE movies (
    movie_id     SERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    genre_id     INT,
    rating       VARCHAR(8),
    description  TEXT,
    poster_url   VARCHAR(500),
    trailer_url  VARCHAR(500),
    director     VARCHAR(255),
    cast_members VARCHAR(500),
    status       VARCHAR(50) CHECK (status IN ('Currently Running', 'Coming Soon')),
    release_date DATE,
    created_at   DATE DEFAULT CURRENT_DATE,
    CONSTRAINT fk_movies_genre_id FOREIGN KEY (genre_id)
        REFERENCES genres(genre_id) ON DELETE SET NULL
);

CREATE TABLE halls (
    hall_id     SERIAL PRIMARY KEY,
    hall_name   VARCHAR(255),
    capacity    INT,
    total_seats INT
);

CREATE TABLE seats (
    seat_id     SERIAL PRIMARY KEY,
    hall_id     INT NOT NULL,
    seat_row    VARCHAR(10),
    seat_number INT,
    status      VARCHAR(50) DEFAULT 'available',
    CONSTRAINT fk_seats_hall_id FOREIGN KEY (hall_id)
        REFERENCES halls(hall_id) ON DELETE CASCADE
);

CREATE TABLE showtimes (
    showtime_id     SERIAL PRIMARY KEY,
    movie_id        INT NOT NULL,
    hall_id         INT,
    show_datetime   TIMESTAMP NOT NULL,
    available_seats INT,
    CONSTRAINT fk_showtimes_movie_id FOREIGN KEY (movie_id)
        REFERENCES movies(movie_id) ON DELETE CASCADE,
    CONSTRAINT fk_showtimes_hall_id FOREIGN KEY (hall_id)
        REFERENCES halls(hall_id) ON DELETE SET NULL
);
