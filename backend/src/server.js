import express from 'express';
import cors from 'cors';

import dashboardRoutes from './routes/dashboard.js';
import vendorRoutes from './routes/vendors.js';
import productRoutes from './routes/products.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';
import salesOrderRoutes from './routes/salesOrders.js';
import inventoryCountRoutes from './routes/inventoryCounts.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'ERP-Lite API is running.',
    endpoints: [
      '/api/dashboard',
      '/api/products',
      '/api/vendors',
      '/api/purchase-orders',
      '/api/sales-orders',
      '/api/inventory-counts',
    ],
  });
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/inventory-counts', inventoryCountRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || 'Something went wrong.',
  });
});

app.listen(port, () => {
  console.log(`ERP-Lite API running on http://localhost:${port}`);
});
