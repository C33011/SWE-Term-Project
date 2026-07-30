# Final Demo Checkout Implementation

This version extends the existing Sprint 3 checkout without replacing the existing movie, admin, profile, favorites, or payment-card features.

## What was added

- Final **Place Order** endpoint using one PostgreSQL transaction
- Saved-card checkout and new-card checkout
- Optional saving of a new card (maximum three cards)
- Payment record and unique booking confirmation number
- One ticket record per selected seat and ticket type
- Booking confirmation page
- Order-confirmation email with ticket type, seat, price, and total
- Customer order history
- Five-minute server-side seat holds with expiration
- Three explicit design patterns:
  - Facade (`CheckoutFacade`)
  - Factory Method (`PaymentProcessorFactory`)
  - Strategy (`SavedCardPaymentProcessor` / `NewCardPaymentProcessor`)

No real external card network is contacted. The payment gateway is a controlled course-project simulation, but a successful payment creates a real booking, tickets, and payment record in PostgreSQL.

## Database setup



### Existing Sprint 3 database

Keep the existing database and run the additive migration once:

```powershell
psql -U swe_user -d swe_db -f .\ces-backend\final_demo_migration.sql
```

This does not delete existing movies, users, cards, showtimes, bookings, or tickets.

### Completely fresh database

The updated `schema.sql` already includes the final-demo tables and columns:

```powershell
psql -U swe_user -d swe_db -f .\ces-backend\schema.sql
psql -U swe_user -d swe_db -f .\ces-backend\seed.sql
psql -U swe_user -d swe_db -f .\ces-backend\sprint3_demo_seed.sql
```

Do not run `final_demo_migration.sql` after the updated `schema.sql`; it is only needed for an older existing database.

## Add the saved-card demo account

After creating `ces-backend/.env` and loading `seed.sql`:

```powershell
cd ces-backend
npm run seed:demo-card
```

This safely adds one encrypted test Visa ending in `4242` to:

```text
carduser@test.com / password
```

The script does nothing if that customer already has a saved card.

Use this account for the saved-card path. Use this account for the no-saved-card path:

```text
fanuser@test.com / password
```

A valid new-card demo entry is:

```text
Card: 4242 4242 4242 4242
Expiration: any future month/year
CVV: 123
Billing address: any non-empty test address
```



## Run the project

Backend:

```powershell
cd ces-backend
npm install
npm start
```

Frontend in another terminal:

```powershell
cd ces-frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Final checkout flow

```text
Movie -> Showtime -> Tickets -> Seats -> Login if needed
-> Order Summary -> Email Confirmation -> Payment
-> Booking Confirmation -> Order History
```

At payment time the backend rechecks:

- showtime is still in the future
- every seat belongs to the selected showroom
- ticket count equals selected-seat count
- seats are not already booked
- seats are not held by another browser session
- saved card belongs to the logged-in customer
- new card passes Luhn, expiry, CVV, and billing-address validation

The database transaction then:

1. processes the mock payment
2. creates the booking
3. creates one ticket per seat
4. creates the payment record
5. updates available seats
6. removes the temporary seat hold
7. commits everything together

If any database step fails, the transaction rolls back.

## Seat-lock demonstration

Use a normal browser and an Incognito/InPrivate window:

1. Open the same showtime in both windows.
2. Select a seat in Window A.
3. Refresh the seat map in Window B.
4. The seat appears purple as **Held** and cannot be selected.
5. The hold expires automatically after five minutes if the booking is abandoned.
6. Completing payment converts the seat into a permanently booked red seat.



## Email behavior

The booking transaction commits before the email is sent. If Gmail credentials are missing or Gmail is temporarily unavailable:

- the booking remains confirmed
- the confirmation page shows an email warning
- no paid booking is lost because of an email-delivery failure

For email delivery, set `EMAIL_USER` and a Gmail App Password in `.env`.

## Design pattern explanation



### Facade

File:

```text
ces-backend/services/CheckoutFacade.js
```

The Express route calls one operation, `placeOrder()`. The facade hides the coordination among seat validation, payment selection, booking creation, ticket creation, payment recording, seat release, and email delivery.

### Factory Method

File:

```text
ces-backend/services/payment/PaymentProcessorFactory.js
```

`PaymentProcessorFactory.create()` returns either:

- `SavedCardPaymentProcessor`
- `NewCardPaymentProcessor`

The checkout facade does not need separate saved-card and new-card conditional workflows.

### Strategy

File:

```text
ces-backend/services/payment/PaymentProcessorFactory.js
```

`SavedCardPaymentProcessor` and `NewCardPaymentProcessor` are interchangeable payment strategies. Each encapsulates a different payment algorithm behind the same `process()` interface:

- `SavedCardPaymentProcessor.process()` looks up the customer's stored card, verifies ownership, checks expiry, and decrypts the card number.
- `NewCardPaymentProcessor.process()` validates a newly entered card (Luhn check, expiry, CVV, billing address) and optionally saves it (up to three cards).

Because both strategies share the same `process()` contract, `CheckoutFacade` runs the selected payment the same way regardless of which one it receives. The two patterns work together: Factory MEthod decides which payment strategy to create, and the Strategy method lets checkout execute either payment algorithm through one common interface.

## Security points for Q/A

- JWT authenticates customers and admins.
- Order endpoints use the customer ID from the verified JWT.
- Customers cannot request another customer's order history.
- All SQL values use parameterized queries.
- Checkout revalidates seats on the server and inside the transaction.
- Saved card numbers and billing addresses remain encrypted.
- Only the last four digits are returned to the frontend.
- CVV is never inserted into the database.
- `.env` must not be submitted or committed.

