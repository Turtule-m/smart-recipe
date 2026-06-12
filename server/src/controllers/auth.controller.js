import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db/pool.js';
import { sendVerificationEmail } from '../services/email.service.js';

const buildUserPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  isVerified: user.is_verified,
  createdAt: user.created_at,
});

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ sub: user.id, email: user.email }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const register = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate random verification token and set 24h expiration
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, verification_token, verification_expires)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, is_verified, created_at`,
        [name, email, passwordHash, token, expires],
      );

      const user = rows[0];

      await client.query('INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)', [user.id, user.name]);
      await client.query('INSERT INTO dietary_prefs (user_id) VALUES ($1)', [user.id]);
      await client.query('COMMIT');

      // Asynchronously send the email (non-blocking)
      sendVerificationEmail(user.email, user.name, token).catch((emailErr) => {
        console.error('Failed to send verification email during registration:', emailErr);
      });

      res.status(201).json({
        message: 'Onboarding email sent! Head over to your inbox to activate your profile before signing in.',
        user: buildUserPayload(user)
      });
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = String(req.query.token || '').trim();

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Verification Error</title>
            <style>
              body { font-family: sans-serif; background-color: #fff7ed; color: #1c1917; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #fca5a5; text-align: center; max-width: 400px; }
              h1 { color: #dc2626; margin-top: 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>❌ Invalid Link</h1>
              <p>Missing verification token.</p>
            </div>
          </body>
        </html>
      `);
    }

    const { rows } = await pool.query(
      `SELECT id, verification_expires FROM users WHERE verification_token = $1`,
      [token]
    );

    const user = rows[0];

    if (!user) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Verification Failed</title>
            <style>
              body { font-family: sans-serif; background-color: #fff7ed; color: #1c1917; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #fca5a5; text-align: center; max-width: 400px; }
              h1 { color: #dc2626; margin-top: 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>❌ Verification Failed</h1>
              <p>The verification token is invalid or has expired.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Check expiration
    if (new Date() > new Date(user.verification_expires)) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Link Expired</title>
            <style>
              body { font-family: sans-serif; background-color: #fff7ed; color: #1c1917; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #fca5a5; text-align: center; max-width: 400px; }
              h1 { color: #dc2626; margin-top: 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>❌ Link Expired</h1>
              <p>The verification link has expired. Please sign up again to receive a new link.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Mark as verified and clear tokens
    await pool.query(
      `UPDATE users 
       SET is_verified = TRUE, verification_token = NULL, verification_expires = NULL 
       WHERE id = $1`,
      [user.id]
    );

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email Verified - Smart Recipe Hub</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #fff7ed;
              color: #1c1917;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 4px 12px rgba(28, 25, 23, 0.05);
              border: 1px solid #fed7aa;
              text-align: center;
              max-width: 400px;
              width: 100%;
            }
            h1 {
              color: #15803d;
              margin-top: 0;
            }
            p {
              line-height: 1.6;
              margin-bottom: 24px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🎉 Verified!</h1>
            <p>Email verified successfully! You can now close this tab and log in.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, is_verified, created_at
       FROM users
       WHERE email = $1`,
      [email],
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email address first.' });
    }

    const token = signToken(user);

    res.json({ token, user: buildUserPayload(user) });
  } catch (error) {
    next(error);
  }
};
