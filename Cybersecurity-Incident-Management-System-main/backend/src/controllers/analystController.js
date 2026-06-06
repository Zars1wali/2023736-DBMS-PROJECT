const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcrypt');

const createAnalyst = async (req, res) => {
  const { org_id, name, email, role, password, department, phone } = req.body;

  // Basic validation for role
  const validRoles = ['Junior', 'Senior', 'Lead', 'Manager', 'Admin'];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, `Role must be one of: ${validRoles.join(', ')}`);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  try {
    const result = await db.query(
      `INSERT INTO analysts (org_id, name, email, role, password_hash, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING analyst_id, org_id, name, email, role, department, phone`,
      [org_id, name, email, role, passwordHash, department, phone]
    );


    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      throw new ApiError(409, 'Email already exists');
    }
    throw error;
  }
};

const getAnalysts = async (req, res) => {
  const result = await db.query(
    'SELECT analyst_id, org_id, name, email, role, department, phone, is_active FROM analysts ORDER BY name'
  );
  res.json(result.rows);
};

const updateAnalyst = async (req, res) => {
  const { id } = req.params;
  const { role, department, is_active } = req.body;

  const result = await db.query(
    `UPDATE analysts 
     SET role = COALESCE($1, role), 
         department = COALESCE($2, department), 
         is_active = COALESCE($3, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE analyst_id = $4 RETURNING analyst_id, name, role, department, is_active`,
    [role, department, is_active, id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Analyst not found');
  }

  res.json(result.rows[0]);
};

const deleteAnalyst = async (req, res) => {
  const { id } = req.params;
  
  // Soft delete instead of hard delete to maintain audit logs
  const result = await db.query(
    'UPDATE analysts SET is_active = FALSE WHERE analyst_id = $1 RETURNING analyst_id',
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Analyst not found');
  }

  res.json({ message: 'Analyst deactivated successfully' });
};

module.exports = {
  createAnalyst,
  getAnalysts,
  updateAnalyst,
  deleteAnalyst
};
