const router   = require('express').Router();
const supabase = require('../services/supabase');

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('vehicles').select('*').eq('is_active', true).order('capacity_kg');
    if (error) throw error;
    res.json({ vehicles: data });
  } catch (err) { next(err); }
});

router.get('/cargo-types', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('cargo_types').select('*');
    if (error) throw error;
    res.json({ cargo_types: data });
  } catch (err) { next(err); }
});

module.exports = router;
