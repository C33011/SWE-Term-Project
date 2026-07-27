-- Additive migration for an existing Sprint 3 database, doesn't harm existing stuff (TESTED)


BEGIN;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmation_number VARCHAR(64);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Confirmed';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'Approved';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_confirmation_number
    ON bookings (confirmation_number)
    WHERE confirmation_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS payments (
    payment_id         SERIAL PRIMARY KEY,
    booking_id         INT NOT NULL UNIQUE,
    amount             DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_reference  VARCHAR(255) NOT NULL UNIQUE,
    payment_method     VARCHAR(30) NOT NULL,
    card_last_four     VARCHAR(4),
    status             VARCHAR(20) NOT NULL DEFAULT 'Approved',
    processed_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking_id FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seat_locks (
    seat_lock_id  SERIAL PRIMARY KEY,
    show_id       INT NOT NULL,
    seat_id       INT NOT NULL,
    session_id    VARCHAR(100) NOT NULL,
    expires_at    TIMESTAMP NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seat_locks_show_id FOREIGN KEY (show_id)
        REFERENCES shows(show_id) ON DELETE CASCADE,
    CONSTRAINT fk_seat_locks_seat_id FOREIGN KEY (seat_id)
        REFERENCES seats(seat_id) ON DELETE CASCADE,
    CONSTRAINT uq_seat_locks_show_seat UNIQUE (show_id, seat_id)
);

CREATE INDEX IF NOT EXISTS idx_seat_locks_expiration ON seat_locks (expires_at);
CREATE INDEX IF NOT EXISTS idx_seat_locks_session ON seat_locks (show_id, session_id);

COMMIT;
