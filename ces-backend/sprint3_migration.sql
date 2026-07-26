-- Review and run once. This does not delete or rewrite existing rows.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_seats_showroom_position'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM seats
      GROUP BY showroom_id, row_number, seat_number
      HAVING COUNT(*) > 1
    ) THEN
      RAISE NOTICE 'Skipped uq_seats_showroom_position because duplicate seat positions exist.';
    ELSE
      ALTER TABLE seats
        ADD CONSTRAINT uq_seats_showroom_position
        UNIQUE (showroom_id, row_number, seat_number);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_tickets_show_seat'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM tickets
      GROUP BY show_id, seat_id
      HAVING COUNT(*) > 1
    ) THEN
      RAISE NOTICE 'Skipped uq_tickets_show_seat because duplicate booked seats exist.';
    ELSE
      ALTER TABLE tickets
        ADD CONSTRAINT uq_tickets_show_seat
        UNIQUE (show_id, seat_id);
    END IF;
  END IF;
END $$;
