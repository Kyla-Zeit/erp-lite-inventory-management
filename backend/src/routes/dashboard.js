import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const totals = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM products) AS total_products,
        (SELECT COUNT(*)::int FROM vendors) AS total_vendors,
        (SELECT COUNT(*)::int FROM purchase_orders) AS total_purchase_orders,
        (SELECT COUNT(*)::int FROM sales_orders) AS total_sales_orders,
        COALESCE((SELECT SUM(quantity_on_hand * unit_cost) FROM products), 0)::numeric(10,2) AS inventory_value,
        (SELECT COUNT(*)::int FROM products WHERE quantity_on_hand <= reorder_level) AS low_stock_count
    `);

    const lowStock = await query(`
      SELECT
        p.id,
        p.sku,
        p.name,
        p.quantity_on_hand,
        p.reorder_level,
        v.name AS vendor_name
      FROM products p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      WHERE p.quantity_on_hand <= p.reorder_level
      ORDER BY (p.quantity_on_hand - p.reorder_level) ASC, p.name ASC
    `);

    const recentSales = await query(`
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
      LIMIT 5
    `);

    const recentPurchases = await query(`
      SELECT
        po.id,
        v.name AS vendor_name,
        po.status,
        po.order_date,
        COALESCE(SUM(poi.quantity * poi.unit_cost), 0)::numeric(10,2) AS total
      FROM purchase_orders po
      LEFT JOIN vendors v ON v.id = po.vendor_id
      LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
      GROUP BY po.id, v.name
      ORDER BY po.created_at DESC
      LIMIT 5
    `);

    res.json({
      totals: totals.rows[0],
      low_stock: lowStock.rows,
      recent_sales_orders: recentSales.rows,
      recent_purchase_orders: recentPurchases.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
