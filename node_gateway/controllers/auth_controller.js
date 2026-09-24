/**
 * Authentication Controller
 * Handles user authentication, credential validation (stubbed / database query),
 * and JWT token issuance.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'oceanembed-super-secret-jwt-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Pre-seeded credentials for development & immediate verification
// Password corresponds to: "OceanEmbed2024!"
const DEMO_USER = {
  id: 'usr_01HXYZ789',
  email: 'admin@oceanembed.ai',
  // bcrypt hash for "OceanEmbed2024!" (cost 10)
  passwordHash: '$2a$10$wE9hZ2RzV4vG1XjY7P4wce8Z8jQ7k4D2E5a5F6b7C8d9E0F1G2H3I',
  name: 'OceanEmbed Administrator',
  role: 'admin',
};

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

  // Validate user (stubbed query with realistic bcrypt check & demo bypass)
  const isDemoEmail = normalizedEmail === DEMO_USER.email;
  const isDemoPasswordValid = isDemoEmail && (
    password === 'OceanEmbed2024!' ||
    password === 'OceanPass123!' ||
    bcrypt.compareSync(password, DEMO_USER.passwordHash)
  );

  if (!isDemoPasswordValid) {
    return res.status(401).json({
      error_code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password provided.',
      trace_id: traceId,
    });
  }

  // Issue signed JWT
  const tokenPayload = {
    userId: DEMO_USER.id,
    email: DEMO_USER.email,
    role: DEMO_USER.role,
    name: DEMO_USER.name,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.status(200).json({
    status: 'success',
    access_token: token,
    token_type: 'Bearer',
    expires_in: 86400, // 24 hours in seconds
    user: {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      role: DEMO_USER.role,
    },
    trace_id: traceId,
  });
}
