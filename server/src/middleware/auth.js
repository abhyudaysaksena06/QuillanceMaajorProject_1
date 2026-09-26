import { firebaseAuth } from '../config/firebase.js';
import { supabase } from '../config/supabase.js';

const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Verifies the Firebase ID token from the Authorization header, then loads
 * (or creates on first sign-in) the matching user row in Supabase.
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  let decoded;
  try {
    decoded = await firebaseAuth.verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const { data: existing, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', decoded.uid)
      .maybeSingle();
    if (error) throw error;

    let user = existing;
    const isAdminEmail = adminEmails.includes((decoded.email || '').toLowerCase());

    if (!user) {
      const { data, error: insertError } = await supabase
        .from('users')
        .insert({
          firebase_uid: decoded.uid,
          email: decoded.email,
          name: decoded.name || decoded.email?.split('@')[0],
          avatar_url: decoded.picture || null,
          role: isAdminEmail ? 'admin' : 'student',
          onboarded: isAdminEmail,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      user = data;
    } else if (isAdminEmail && user.role !== 'admin') {
      const { data } = await supabase
        .from('users')
        .update({ role: 'admin', onboarded: true })
        .eq('id', user.id)
        .select()
        .single();
      user = data;
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Your account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission for this action' });
  }
  next();
};
