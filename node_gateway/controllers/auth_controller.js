/**
 * Authentication Controller
 * Handles user authentication, credential validation, signup, and JWT token issuance.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../utils/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'oceanembed-super-secret-jwt-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export async function loginHandler(req, res) {
  const { email, password } = req.body || {};
  const traceId = req.traceId;

  if (!email || !password) {
    return res.status(400).json({
      error_code: 'INVALID_CREDENTIALS_PAYLOAD',
      message: 'Both email and password fields are required.',
      trace_id: traceId,
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // HARDCODED TESTING CREDENTIALS (Bypass DB entirely for local demonstration)
  if (normalizedEmail === 'admin@oceanembed.com' && password === 'password123') {
    const tokenPayload = {
      userId: 1,
      email: normalizedEmail,
      role: 'admin',
      name: 'Admin Tester',
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      status: 'success',
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: 1,
        email: normalizedEmail,
        name: 'Admin Tester',
        role: 'admin',
      },
      trace_id: traceId,
    });
  }

  try {
    // Validate user against database
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error_code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password provided.',
        trace_id: traceId,
      });
    }

    const user = result.rows[0];

    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error_code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password provided.',
        trace_id: traceId,
      });
    }

    // Issue signed JWT
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      status: 'success',
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400, // 24 hours in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
      },
      trace_id: traceId,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error_code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred during authentication.',
      trace_id: traceId,
    });
  }
}

export async function signupHandler(req, res) {
  const { email, password, full_name } = req.body || {};
  const traceId = req.traceId;

  // --- Input Validation ---
  if (!email || !password || !full_name) {
    return res.status(400).json({
      error_code: 'INVALID_SIGNUP_PAYLOAD',
      message: 'Full name, email, and password are all required.',
      trace_id: traceId,
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedName = String(full_name).trim();

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({
      error_code: 'INVALID_EMAIL_FORMAT',
      message: 'Please provide a valid email address.',
      trace_id: traceId,
    });
  }

  // Password strength check: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error_code: 'WEAK_PASSWORD',
      message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
      trace_id: traceId,
    });
  }

  try {
    // --- Duplicate Email Check ---
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error_code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.',
        trace_id: traceId,
      });
    }

    // --- Hash Password ---
    const SALT_ROUNDS = 10;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // --- Insert New User ---
    const insertResult = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, full_name, role, created_at`,
      [normalizedEmail, passwordHash, trimmedName]
    );

    const newUser = insertResult.rows[0];

    // --- Issue JWT (auto-login after signup) ---
    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.full_name,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      status: 'success',
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.full_name,
        role: newUser.role,
      },
      trace_id: traceId,
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error_code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred during registration.',
      trace_id: traceId,
    });
  }
}
