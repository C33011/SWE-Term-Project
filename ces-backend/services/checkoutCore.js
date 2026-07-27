const TICKET_PRICES = Object.freeze({
  Adult: 12.50,
  Senior: 9.50,
  Child: 8.50,
});

const TICKET_TYPES = Object.keys(TICKET_PRICES);

function validateTicketCounts(ticketCounts) {
  if (!ticketCounts || typeof ticketCounts !== 'object') {
    return { error: 'Ticket counts are required.' };
  }

  const counts = {};
  let totalTickets = 0;

  for (const type of TICKET_TYPES) {
    const raw = ticketCounts[type];
    const count = raw === undefined ? 0 : Number(raw);
    if (!Number.isInteger(count) || count < 0 || count > 20) {
      return { error: `Invalid ticket count for type "${type}".` };
    }
    counts[type] = count;
    totalTickets += count;
  }

  if (totalTickets <= 0) {
    return { error: 'At least one ticket must be selected.' };
  }

  return { counts, totalTickets };
}

function computeLineItems(counts) {
  const lineItems = [];
  let totalCents = 0;

  for (const type of TICKET_TYPES) {
    const count = counts[type] || 0;
    if (count <= 0) continue;

    const priceCents = Math.round(TICKET_PRICES[type] * 100);
    const subtotalCents = priceCents * count;
    totalCents += subtotalCents;

    lineItems.push({
      ticketType: type,
      quantity: count,
      pricePerTicket: priceCents / 100,
      subtotal: subtotalCents / 100,
    });
  }

  return {
    lineItems,
    totalCents,
    totalBeforeTax: totalCents / 100,
  };
}

function normalizeSeatIds(seatIds) {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return { error: 'At least one seat must be selected.' };
  }

  const normalizedSeatIds = seatIds.map(Number);
  if (normalizedSeatIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    return { error: 'One or more selected seat IDs are invalid.' };
  }

  if (new Set(normalizedSeatIds).size !== normalizedSeatIds.length) {
    return { error: 'The same seat cannot be selected more than once.' };
  }

  return { seatIds: normalizedSeatIds };
}

function assignTicketTypesToSeats(seats, counts) {
  const orderedTypes = [];
  for (const type of TICKET_TYPES) {
    for (let index = 0; index < (counts[type] || 0); index += 1) {
      orderedTypes.push(type);
    }
  }

  return seats.map((seat, index) => {
    const ticketType = orderedTypes[index];
    const price = TICKET_PRICES[ticketType];
    return {
      ...seat,
      ticketType,
      price,
    };
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

module.exports = {
  TICKET_PRICES,
  TICKET_TYPES,
  validateTicketCounts,
  computeLineItems,
  normalizeSeatIds,
  assignTicketTypesToSeats,
  isValidEmail,
};
