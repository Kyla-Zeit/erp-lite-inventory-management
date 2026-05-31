import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT
        p.id,
        p.sku,
        p.name,
        p.vendor_id,
        v.name AS vendor_name,
        p.unit_cost,
        p.sell_price,
        p.reorder_level,
        p.quantity_on_hand,
        (p.quantity_on_hand <= p.reorder_level) AS is_low_stock,
        p.created_at
      FROM products p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      ORDER BY p.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      sku,
      name,
      vendor_id,
      unit_cost,
      sell_price,
      reorder_level,
      quantity_on_hand,
    } = req.body;

    if (!sku || !name) {
      return res.status(400).json({ error: 'SKU and product name are required.' });
    }

    const result = await query(
      `
      INSERT INTO products
        (sku, name, vendor_id, unit_cost, sell_price, reorder_level, quantity_on_hand)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        sku,
        name,
        vendor_id || null,
        Number(unit_cost || 0),
        Number(sell_price || 0),
        Number(reorder_level || 0),
        Number(quantity_on_hand || 0),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A product with that SKU already exists.' });
    }
    next(error);
  }
});

export default router;
