const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { revokeToken } = require('../middleware/auth');

async function login(req, res) {
  const { email, password } = req.body;
  const { rows } = await db.query(
    'SELECT analyst_id, name, email, role, password_hash FROM analysts WHERE email = $1 LIMIT 1',
    [email]
  );

  const analyst = rows[0];
  if (!analyst) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, analyst.password_hash);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = jwt.sign(
    {
      id: analyst.analyst_id,
      email: analyst.email,
      role: analyst.role,
      name: analyst.name
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: analyst.analyst_id,
      name: analyst.name,
      email: analyst.email,
      role: analyst.role
    }
  });

}

async function logout(req, res) {
  revokeToken(req.token);
  res.status(200).json({ message: 'Logout successful' });
}

module.exports = {
  login,
  logout
};
