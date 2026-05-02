const router = require('express').Router();
const { geocode, reverseGeocode, getRoute, calculateFare } = require('../services/maps');


router.post('/route', async (req, res, next) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, vehicle_type } = req.body;
    const route = await getRoute(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const fare  = calculateFare(vehicle_type || 'mini_truck', route.distanceKm);
    res.json({ ...route, estimatedFare: fare });
  } catch (err) { next(err); }
});


router.get('/geocode', async (req, res, next) => {
  try {
    const result = await geocode(req.query.q);
    res.json(result);
  } catch (err) { next(err); }
});


router.get('/reverse', async (req, res, next) => {
  try {
    const address = await reverseGeocode(req.query.lat, req.query.lng);
    res.json({ address });
  } catch (err) { next(err); }
});

module.exports = router;
