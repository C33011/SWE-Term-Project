const express = require('express');
const { authenticate, requireCustomer } = require('../middleware');
const { CheckoutFacade } = require('../services/CheckoutFacade');

module.exports = function createOrderRoutes(pool) {
  const router = express.Router();
  const checkoutFacade = new CheckoutFacade(pool);

  router.use(authenticate, requireCustomer);

  router.post('/place', async (req, res) => {
    try {
      const order = await checkoutFacade.placeOrder({
        userId: req.user.userId,
        ...req.body,
      });
      res.status(201).json({ order });
    } catch (error) {
      console.error('Place order error:', error);
      res.status(error.status || 500).json({
        error: error.status ? error.message : 'Could not complete the order.',
        bookedSeatIds: error.bookedSeatIds,
        lockedSeatIds: error.lockedSeatIds,
      });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const orders = await checkoutFacade.listOrders(req.user.userId);
      res.json({ orders });
    } catch (error) {
      console.error('Order history error:', error);
      res.status(500).json({ error: 'Could not retrieve order history.' });
    }
  });

  router.get('/:bookingId', async (req, res) => {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Invalid booking ID.' });
    }

    try {
      const order = await checkoutFacade.getOrder(req.user.userId, bookingId);
      if (!order) return res.status(404).json({ error: 'Order not found.' });
      res.json({ order });
    } catch (error) {
      console.error('Order detail error:', error);
      res.status(500).json({ error: 'Could not retrieve the order.' });
    }
  });

  return router;
};
