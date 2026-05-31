import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        ic.id,
        ic.count_date,
        ic.notes,
        COUNT(icl.id)::int AS line_count,
        COALESCE(SUM(ABS(icl.variance)), 0)::int AS total_absolute_variance
      FROM inventory_counts ic
      LEFT JOIN inventory_count_lines icl ON icl.inventory_count_id = ic.id
      GROUP BY ic.id
      ORDER BY ic.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { notes, lines = [] } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'At least one inventory count line is required.' });
    }

    await client.query('BEGIN');

    const countResult = await client.query(
      `
      INSERT INTO inventory_counts (notes)
      VALUES ($1)
      RETURNING *
      `,
      [notes || null]
    );

    const count = countResult.rows[0];

    for (const line of lines) {
      const productResult = await client.query(
        'SELECT quantity_on_hand FROM products WHERE id = $1 FOR UPDATE',
        [line.product_id]
      );

      if (productResult.rowCount === 0) {
        throw new Error(`Product ${line.product_id} does not exist.`);
      }

      const systemQuantity = Number(productResult.rows[0].quantity_on_hand);
      const countedQuantity = Number(line.counted_quantity);
      const variance = countedQuantity - systemQuantity;

      await client.query(
        `
        INSERT INTO inventory_count_lines
          (inventory_count_id, product_id, system_quantity, counted_quantity, variance)
        VALUES
          ($1, $2, $3, $4, $5)
        `,
        [count.id, line.product_id, systemQuantity, countedQuantity, variance]
      );

      await client.query(
        `
        UPDATE products
        SET quantity_on_hand = $1
        WHERE id = $2
        `,
        [countedQuantity, line.product_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      ...count,
      message: 'Inventory count saved and product quantities adjusted.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
