const router   = require('express').Router();
const supabase = require('../services/supabase');
const { requireAuth } = require('../middleware/auth');
const { getRoute, calculateFare } = require('../services/maps');


router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, vehicle:vehicles(name,type,icon), cargo_type:cargo_types(name,icon), status_history:order_status_history(status,created_at)`)
      .eq('customer_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ orders: data });
  } catch (err) { next(err); }
});


router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, vehicle:vehicles(*), cargo_type:cargo_types(*), driver:profiles!driver_id(full_name,phone), status_history:order_status_history(*)`)
      .eq('id', req.params.id)
      .eq('customer_id', req.user.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: data });
  } catch (err) { next(err); }
});


router.post('/estimate', async (req, res, next) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, vehicle_type } = req.body;
    if (!pickup_lat || !pickup_lng || !drop_lat || !drop_lng)
      return res.status(400).json({ error: 'Coordinates required' });

    const route = await getRoute(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const fare  = calculateFare(vehicle_type || 'mini_truck', route.distanceKm);

    res.json({ distanceKm: route.distanceKm, durationMin: route.durationMin, estimatedFare: fare });
  } catch (err) { next(err); }
});


router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      vehicle_id, vehicle_type, cargo_type_id,
      pickup_address, pickup_lat, pickup_lng,
      drop_address,   drop_lat,   drop_lng,
      notes, payment_method = 'cod', scheduled_at
    } = req.body;

    if (!vehicle_id || !pickup_address || !drop_address)
      return res.status(400).json({ error: 'vehicle_id, pickup_address, drop_address required' });

    
    let distanceKm = 0, durationMin = 0;
    try {
      const route = await getRoute(pickup_lat, pickup_lng, drop_lat, drop_lng);
      distanceKm  = route.distanceKm;
      durationMin = route.durationMin;
    } catch (_) {  }

    const estimated_fare = calculateFare(vehicle_type || 'mini_truck', distanceKm);

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_id: req.user.id,
        vehicle_id, cargo_type_id,
        pickup_address, pickup_lat, pickup_lng,
        drop_address,   drop_lat,   drop_lng,
        distance_km: distanceKm,
        duration_min: durationMin,
        estimated_fare,
        payment_method,
        status: 'pending',
        scheduled_at, notes
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ order, message: 'Booking confirmed! Driver will be assigned shortly.' });
  } catch (err) { next(err); }
});


router.patch('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const { data: existing } = await supabase
      .from('orders').select('status,customer_id').eq('id', req.params.id).single();

    if (!existing || existing.customer_id !== req.user.id)
      return res.status(404).json({ error: 'Order not found' });
    if (['in_transit','delivered'].includes(existing.status))
      return res.status(400).json({ error: 'Cannot cancel order in transit or delivered' });

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancelled_reason: reason })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ order: data });
  } catch (err) { next(err); }
});

module.exports = router;
