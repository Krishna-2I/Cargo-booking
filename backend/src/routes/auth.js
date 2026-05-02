const router   = require('express').Router();
const supabase = require('../services/supabase');


router.post('/register', async (req, res, next) => {
  try {
    const { email, password, full_name, phone } = req.body;
    if (!email || !password || !full_name)
      return res.status(400).json({ error: 'email, password and full_name are required' });

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name, phone } }
    });
    if (error) throw error;
    res.status(201).json({ user: data.user, message: 'Account created! Check your email to verify.' });
  } catch (err) { next(err); }
});


router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid credentials' });

    
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', data.user.id).single();

    res.json({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      user:          data.user,
      profile
    });
  } catch (err) { next(err); }
});


router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: 'Invalid refresh token' });
    res.json({ access_token: data.session.access_token });
  } catch (err) { next(err); }
});


router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: 'Invalid token' });
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    res.json({ user, profile });
  } catch (err) { next(err); }
});

module.exports = router;
