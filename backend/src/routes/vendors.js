import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT id, name, contact_name, email, phone, created_at
      FROM vendors
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, contact_name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Vendor name is required.' });
    }

    const result = await query(
      `
      INSERT INTO vendors (name, contact_name, email, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [name, contact_name || null, email || null, phone || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
