import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        so.id,
        so.customer_name,
        so.status,
        so.order_date,
        COALESCE(SUM(soi.quantity * soi.unit_price), 0)::numeric(10,2) AS total
      FROM sales_orders so
      LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id
      GROUP BY so.id
      ORDER BY so.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { customer_name, status = 'Fulfilled', items = [] } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one sales order item is required.' });
    }

    await client.query('BEGIN');

    for (const item of items) {
      const productResult = await client.query(
        'SELECT name, quantity_on_hand, sell_price FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );

      if (productResult.rowCount === 0) {
        throw new Error(`Product ${item.product_id} does not exist.`);
      }

      const product = productResult.rows[0];

      if (status === 'Fulfilled' && product.quantity_on_hand < Number(item.quantity)) {
        const error = new Error(
          `Not enough stock for ${product.name}. Available: ${product.quantity_on_hand}. Requested: ${item.quantity}.`
        );
        error.status = 400;
        throw error;
      }
    }

    const soResult = await client.query(
      `
      INSERT INTO sales_orders (customer_name, status)
      VALUES ($1, $2)
      RETURNING *
      `,
      [customer_name, status]
    );

    const salesOrder = soResult.rows[0];

    for (const item of items) {
      const priceResult = await client.query(
        'SELECT sell_price FROM products WHERE id = $1',
        [item.product_id]
      );

      const unitPrice = Number(item.unit_price ?? priceResult.rows[0].sell_price);

      await client.query(
        `
        INSERT INTO sales_order_items
          (sales_order_id, product_id, quantity, unit_price)
        VALUES
          ($1, $2, $3, $4)
        `,
        [salesOrder.id, item.product_id, Number(item.quantity), unitPrice]
      );

      if (status === 'Fulfilled') {
        await client.query(
          `
          UPDATE products
          SET quantity_on_hand = quantity_on_hand - $1
          WHERE id = $2
          `,
          [Number(item.quantity), item.product_id]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      ...salesOrder,
      message:
        status === 'Fulfilled'
          ? 'Sales order created and stock deducted.'
          : 'Sales order created without stock deduction.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
