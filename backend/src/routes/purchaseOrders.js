import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        po.id,
        po.vendor_id,
        v.name AS vendor_name,
        po.status,
        po.order_date,
        po.received_date,
        COALESCE(SUM(poi.quantity * poi.unit_cost), 0)::numeric(10,2) AS total
      FROM purchase_orders po
      LEFT JOIN vendors v ON v.id = po.vendor_id
      LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
      GROUP BY po.id, v.name
      ORDER BY po.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { vendor_id, status = 'Draft', items = [] } = req.body;

    if (!vendor_id) {
      return res.status(400).json({ error: 'Vendor is required.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one purchase order item is required.' });
    }

    await client.query('BEGIN');

    const poResult = await client.query(
      `
      INSERT INTO purchase_orders (vendor_id, status, received_date)
      VALUES ($1, $2, CASE WHEN $2 = 'Received' THEN CURRENT_DATE ELSE NULL END)
      RETURNING *
      `,
      [vendor_id, status]
    );

    const purchaseOrder = poResult.rows[0];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT unit_cost FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rowCount === 0) {
        throw new Error(`Product ${item.product_id} does not exist.`);
      }

      const unitCost = Number(item.unit_cost ?? productResult.rows[0].unit_cost);

      await client.query(
        `
        INSERT INTO purchase_order_items
          (purchase_order_id, product_id, quantity, unit_cost)
        VALUES
          ($1, $2, $3, $4)
        `,
        [purchaseOrder.id, item.product_id, Number(item.quantity), unitCost]
      );

      if (status === 'Received') {
        await client.query(
          `
          UPDATE products
          SET quantity_on_hand = quantity_on_hand + $1
          WHERE id = $2
          `,
          [Number(item.quantity), item.product_id]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      ...purchaseOrder,
      message:
        status === 'Received'
          ? 'Purchase order created and stock received.'
          : 'Purchase order created as draft.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
