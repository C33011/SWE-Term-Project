CREATE TABLE IF NOT EXISTS genres (
    genre_id    SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS movies (
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

CREATE TABLE IF NOT EXISTS halls (
    hall_id     SERIAL PRIMARY KEY,
    hall_name   VARCHAR(255),
    capacity    INT,
    total_seats INT
);

CREATE TABLE IF NOT EXISTS seats (
    seat_id     SERIAL PRIMARY KEY,
    hall_id     INT NOT NULL,
    seat_row    VARCHAR(10),
    seat_number INT,
    status      VARCHAR(50) DEFAULT 'available',
    CONSTRAINT fk_seats_hall_id FOREIGN KEY (hall_id)
        REFERENCES halls(hall_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS showtimes (
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

CREATE TABLE IF NOT EXISTS users (
    user_id                   SERIAL PRIMARY KEY,
    email                     VARCHAR(255) NOT NULL UNIQUE,
    password_hash             VARCHAR(255) NOT NULL,
    first_name                VARCHAR(100) NOT NULL,
    last_name                 VARCHAR(100) NOT NULL,
    phone                     VARCHAR(20),
    
    -- Added columns to map directly to the EditProfile.jsx frontend
    address                   VARCHAR(255), 
    card1_num                 VARCHAR(20),
    card1_expiry              VARCHAR(5),
    card2_num                 VARCHAR(20),
    card2_expiry              VARCHAR(5),
    card3_num                 VARCHAR(20),
    card3_expiry              VARCHAR(5),
    
    role                      VARCHAR(20) NOT NULL DEFAULT 'customer'
        CHECK (role IN ('admin', 'customer')),
    status                    VARCHAR(20) NOT NULL DEFAULT 'Inactive'
        CHECK (status IN ('Active', 'Inactive')),
    subscribe_to_promotions   BOOLEAN NOT NULL DEFAULT FALSE,
    email_confirmation_token  VARCHAR(255),
    email_confirmed_at        TIMESTAMP,
    created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_id    SERIAL PRIMARY KEY,
    user_id     INT NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used_at     TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_tokens_user_id FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS addresses (
    address_id     SERIAL PRIMARY KEY,
    user_id        INT NOT NULL UNIQUE,
    street_address VARCHAR(255) NOT NULL,
    city           VARCHAR(100) NOT NULL,
    state          VARCHAR(50) NOT NULL,
    zip_code       VARCHAR(20) NOT NULL,
    CONSTRAINT fk_addresses_user_id FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_cards (
    card_id                 SERIAL PRIMARY KEY,
    user_id                 INT NOT NULL,
    cardholder_name         VARCHAR(255) NOT NULL,
    encrypted_card_number   TEXT NOT NULL,
    encrypted_cvv           TEXT NOT NULL,
    expiry_month            INT NOT NULL
        CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year             INT NOT NULL,
    billing_address         VARCHAR(255),
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_cards_user_id FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorite_movies (
    user_id    INT NOT NULL,
    movie_id   INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id),
    CONSTRAINT fk_favorite_movies_user_id FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_movies_movie_id FOREIGN KEY (movie_id)
        REFERENCES movies(movie_id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION enforce_payment_card_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM payment_cards WHERE user_id = NEW.user_id) >= 3 THEN
        RAISE EXCEPTION 'Users may store at most 3 payment cards';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to prevent errors when re-running the schema
DROP TRIGGER IF EXISTS trg_payment_card_limit ON payment_cards;

CREATE TRIGGER trg_payment_card_limit
    BEFORE INSERT ON payment_cards
    FOR EACH ROW
    EXECUTE FUNCTION enforce_payment_card_limit();