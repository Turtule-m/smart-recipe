import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';

const buildUserPayload = (user) => ({
  id: user.id,
  email: user.email,
  createdAt: user.created_at,
});

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
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

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, created_at`,
        [email, passwordHash],
      );

      const user = rows[0];

      await client.query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);
      await client.query('INSERT INTO dietary_prefs (user_id) VALUES ($1)', [user.id]);
      await client.query('COMMIT');

      const token = signToken(user);

      res.status(201).json({ token, user: buildUserPayload(user) });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email is already registered' });
    }

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
      `SELECT id, email, password_hash, created_at
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

    const token = signToken(user);

    res.json({ token, user: buildUserPayload(user) });
  } catch (error) {
    next(error);
  }
};
