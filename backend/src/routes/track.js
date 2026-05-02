const router   = require('express').Router();
const supabase = require('../services/supabase');
const { requireAuth } = require('../middleware/auth');


router.get('/:orderNumber', async (req, res, next) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status,
        pickup_address, drop_address, pickup_lat, pickup_lng, drop_lat, drop_lng,
        estimated_fare, distance_km, duration_min,
        picked_up_at, delivered_at, created_at,
        driver:profiles!driver_id(
          full_name, phone,
          driver_details(current_lat, current_lng, vehicle_reg, rating)
        ),
        vehicle:vehicles(name, type, icon),
        status_history:order_status_history(status, created_at)
      `)
      .eq('order_number', req.params.orderNumber.toUpperCase())
      .single();

    if (error) {
      console.error('Track error:', error);
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!order) return res.status(404).json({ error: 'Order not found' });

    
    if (order.driver && order.driver.driver_details) {
      order.driver_details = Array.isArray(order.driver.driver_details) 
        ? order.driver.driver_details[0] 
        : order.driver.driver_details;
      delete order.driver.driver_details;
    }

    const statusOrder = ['pending','driver_assigned','picked_up','in_transit','delivered'];
    const currentIdx  = statusOrder.indexOf(order.status);

    const timeline = [
      { label: 'Order Placed',    status: 'pending',         done: true },
      { label: 'Driver Assigned', status: 'driver_assigned', done: currentIdx >= 1 },
      { label: 'Picked Up',       status: 'picked_up',       done: currentIdx >= 2 },
      { label: 'In Transit',      status: 'in_transit',      done: currentIdx >= 3 },
      { label: 'Delivered',       status: 'delivered',       done: currentIdx >= 4 },
    ];

    res.json({ order, timeline });
  } catch (err) { next(err); }
});


router.patch('/:id/location', requireAuth, async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const { error } = await supabase
      .from('driver_details')
      .update({ current_lat: lat, current_lng: lng, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Location updated' });
  } catch (err) { next(err); }
});

module.exports = router;
