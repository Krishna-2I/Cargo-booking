const supabase = require('../services/supabase');

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  req.user    = user;
  req.profile = profile;
  next();
}

async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  if (profile?.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });

  req.user    = user;
  req.profile = profile;
  next();
}

module.exports = { requireAuth, requireAdmin };
