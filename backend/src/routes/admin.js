const router   = require('express').Router();
const supabase = require('../services/supabase');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);


router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      { count: totalOrders },
      { count: activeOrders },
      { count: activeDrivers },
      { data: delivered }
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true })
        .in('status', ['pending','driver_assigned','picked_up','in_transit']),
      supabase.from('driver_details').select('*', { count: 'exact', head: true }).eq('is_available', true),
      supabase.from('orders').select('final_fare,estimated_fare').eq('status', 'delivered')
    ]);

    const totalRevenue = (delivered || []).reduce((s, o) => s + (o.final_fare || o.estimated_fare || 0), 0);

    res.json({ stats: { totalOrders, activeOrders, activeDrivers, totalRevenue } });
  } catch (err) { next(err); }
});


router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const from = (page - 1) * limit;
    const to   = from + Number(limit) - 1;

    let q = supabase
      .from('admin_orders_view')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) q = q.eq('status', status);
    if (search) q = q.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%`
    );

    const { data, error, count } = await q;
    if (error) throw error;
    res.json({ orders: data, pagination: { total: count, page: +page, limit: +limit } });
  } catch (err) { next(err); }
});


router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status, driver_id } = req.body;
    const validStatuses = ['pending','driver_assigned','picked_up','in_transit','delivered','cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const update = { status };
    if (driver_id)              update.driver_id    = driver_id;
    if (status === 'picked_up') update.picked_up_at = new Date().toISOString();
    if (status === 'delivered') update.delivered_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders').update(update).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ order: data });
  } catch (err) { next(err); }
});


router.get('/orders/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, vehicle:vehicles(*), cargo_type:cargo_types(*),
        customer:profiles!customer_id(full_name,phone),
        driver:profiles!driver_id(full_name,phone),
        status_history:order_status_history(*)`)
      .eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json({ order: data });
  } catch (err) { next(err); }
});


router.get('/drivers', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles').select('*, driver_details(*)').eq('role', 'driver');
    if (error) throw error;
    res.json({ drivers: data });
  } catch (err) { next(err); }
});


router.get('/customers', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ customers: data });
  } catch (err) { next(err); }
});

module.exports = router;
