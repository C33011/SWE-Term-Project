CREATE TABLE IF NOT EXISTS theatres (
    theatre_id  SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    address     VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS genres (
    genre_id    SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS movies (
    movie_id          SERIAL PRIMARY KEY,
    title             VARCHAR(255) NOT NULL,
    genre_id          INT,
    rating            VARCHAR(8),
    description       TEXT,
    poster_url        VARCHAR(500),
    trailer_url       VARCHAR(500),
    director          VARCHAR(255),
    producer          VARCHAR(255),
    cast_members      VARCHAR(500),
    reviews           TEXT,
    status            VARCHAR(50) CHECK (status IN ('Currently Running', 'Coming Soon')),
    release_date      DATE,
    created_at        DATE DEFAULT CURRENT_DATE,
    CONSTRAINT fk_movies_genre_id FOREIGN KEY (genre_id)
        REFERENCES genres(genre_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS showrooms (
    showroom_id      SERIAL PRIMARY KEY,
    theatre_id       INT,
    showroom_name    VARCHAR(255),
    number_of_seats  INT,
    CONSTRAINT fk_showrooms_theatre_id FOREIGN KEY (theatre_id)
        REFERENCES theatres(theatre_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS seats (
    seat_id      SERIAL PRIMARY KEY,
    showroom_id  INT NOT NULL,
    row_number   VARCHAR(10),
    seat_number  INT,
    status       VARCHAR(50) DEFAULT 'available',
    CONSTRAINT fk_seats_showroom_id FOREIGN KEY (showroom_id)
        REFERENCES showrooms(showroom_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shows (
    show_id          SERIAL PRIMARY KEY,
    movie_id         INT NOT NULL,
    showroom_id      INT,
    show_date        DATE NOT NULL,
    show_time        TIME NOT NULL,
    duration         INT,
    available_seats  INT,
    CONSTRAINT fk_shows_movie_id FOREIGN KEY (movie_id)
        REFERENCES movies(movie_id) ON DELETE CASCADE,
    CONSTRAINT fk_shows_showroom_id FOREIGN KEY (showroom_id)
        REFERENCES showrooms(showroom_id) ON DELETE SET NULL,
    CONSTRAINT uq_shows_showroom_datetime
        UNIQUE (showroom_id, show_date, show_time)
);

CREATE TABLE IF NOT EXISTS users (
    user_id                   SERIAL PRIMARY KEY,
    email                     VARCHAR(255) NOT NULL UNIQUE,
    password_hash             VARCHAR(255) NOT NULL,
    first_name                VARCHAR(100) NOT NULL,
    last_name                 VARCHAR(100) NOT NULL,
    phone_number              VARCHAR(20),
    mailing_address           TEXT,
    role                      VARCHAR(20) NOT NULL DEFAULT 'customer'
        CHECK (role IN ('admin', 'customer')),
    status                    VARCHAR(20) NOT NULL DEFAULT 'Inactive'
        CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    promotional_emails        BOOLEAN NOT NULL DEFAULT FALSE,
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

CREATE TABLE IF NOT EXISTS credit_cards (
    card_id          SERIAL PRIMARY KEY,
    user_id          INT NOT NULL,
    card_number      TEXT NOT NULL,
    expiration_date  DATE NOT NULL,
    billing_address  TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_credit_cards_user_id FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promotions (
    promotion_id         SERIAL PRIMARY KEY,
    promo_code           VARCHAR(50) NOT NULL UNIQUE,
    discount_percentage  DECIMAL(5, 2) NOT NULL
        CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    valid_until          DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id           SERIAL PRIMARY KEY,
    user_id              INT NOT NULL,
    booking_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount         DECIMAL(10, 2) NOT NULL,
    payment_reference    VARCHAR(255),
    confirmation_email   VARCHAR(255),
    promotion_id         INT,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user_id FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_promotion_id FOREIGN KEY (promotion_id)
        REFERENCES promotions(promotion_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tickets (
    ticket_id    SERIAL PRIMARY KEY,
    booking_id   INT NOT NULL,
    show_id      INT NOT NULL,
    seat_id      INT NOT NULL,
    ticket_type  VARCHAR(20) NOT NULL
        CHECK (ticket_type IN ('Adult', 'Senior', 'Child')),
    price        DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_tickets_booking_id FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_show_id FOREIGN KEY (show_id)
        REFERENCES shows(show_id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_seat_id FOREIGN KEY (seat_id)
        REFERENCES seats(seat_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS favorite_movies (
    user_id     INT NOT NULL,
    movie_id    INT NOT NULL,
    date_added  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id),
    CONSTRAINT fk_favorite_movies_user_id FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_movies_movie_id FOREIGN KEY (movie_id)
        REFERENCES movies(movie_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS preference_profiles (
    preference_profile_id  SERIAL PRIMARY KEY,
    user_id                INT NOT NULL UNIQUE,
    favorite_genres        TEXT,
    favorite_actors        TEXT,
    CONSTRAINT fk_preference_profiles_user_id FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommendation_engines (
    recommendation_engine_id  SERIAL PRIMARY KEY,
    algorithm_version         VARCHAR(50) NOT NULL
);

CREATE OR REPLACE FUNCTION enforce_credit_card_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM credit_cards WHERE user_id = NEW.user_id) >= 3 THEN
        RAISE EXCEPTION 'Users may store at most 3 credit cards';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_credit_card_limit ON credit_cards;

CREATE TRIGGER trg_credit_card_limit
    BEFORE INSERT ON credit_cards
    FOR EACH ROW
    EXECUTE FUNCTION enforce_credit_card_limit();
