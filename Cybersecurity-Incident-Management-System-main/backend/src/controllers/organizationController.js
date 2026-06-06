const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const createOrganization = async (req, res) => {
    const { name, industry, country, website, location, contact_email, phone } = req.body;

    const result = await db.query(
        `INSERT INTO organizations (name, industry, country, website, location, contact_email, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, industry, country, website, location, contact_email, phone]
    );

    res.status(201).json(result.rows[0]);
};

const getOrganizations = async (req, res) => {
    const result = await db.query('SELECT * FROM organizations ORDER BY name');
    res.json(result.rows);
};

const getOrganizationById = async (req, res) => {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM organizations WHERE org_id = $1', [id]);

    if (result.rows.length === 0) {
        throw new ApiError(404, 'Organization not found');
    }

    res.json(result.rows[0]);
};

const updateOrganization = async (req, res) => {
    const { id } = req.params;
    const { name, industry, country, website, location, contact_email, phone } = req.body;

    const result = await db.query(
        `UPDATE organizations 
     SET name = COALESCE($1, name), 
         industry = COALESCE($2, industry), 
         country = COALESCE($3, country), 
         website = COALESCE($4, website), 
         location = COALESCE($5, location), 
         contact_email = COALESCE($6, contact_email), 
         phone = COALESCE($7, phone),
         updated_at = CURRENT_TIMESTAMP
     WHERE org_id = $8 RETURNING *`,
        [name, industry, country, website, location, contact_email, phone, id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, 'Organization not found');
    }

    res.json(result.rows[0]);
};

module.exports = {
    createOrganization,
    getOrganizations,
    getOrganizationById,
    updateOrganization
};
