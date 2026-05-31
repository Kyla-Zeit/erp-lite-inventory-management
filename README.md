# ERP-Lite Inventory & Order Management

A small full-stack project inspired by core ERP workflows: vendors, products, purchase orders, inventory counts, sales orders, and a low-stock dashboard.

## What this project demonstrates

- Product master data
- Vendor master data
- Purchase order creation and receiving
- Sales order creation and stock deduction
- Inventory counts and quantity adjustments
- Low-stock dashboard
- Basic inventory value calculation
- REST API design
- PostgreSQL relational data modelling
- React front-end consuming an Express API

## Tech stack

- PostgreSQL
- Express
- React
- Node.js
- Vite
- Docker Compose for the database

## Project structure

```txt
erp-lite/
  backend/
    db/schema.sql
    db/seed.sql
    src/
      db.js
      server.js
      routes/
  frontend/
    src/
      App.jsx
      main.jsx
      styles.css
  docker-compose.yml
```

## How to run locally

### 1. Start PostgreSQL

From the root folder:

```bash
docker compose up -d
```

### 2. Set up the backend

```bash
cd backend
npm install
npm run db:setup
npm run dev
```

The API runs at:

```txt
http://localhost:4000
```

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at:

```txt
http://localhost:5173
```

## Useful API endpoints

```txt
GET    /api/dashboard
GET    /api/products
POST   /api/products
GET    /api/vendors
POST   /api/vendors
GET    /api/purchase-orders
POST   /api/purchase-orders
GET    /api/sales-orders
POST   /api/sales-orders
GET    /api/inventory-counts
POST   /api/inventory-counts
```

## Interview wording

I have not worked directly in a production ERP system yet, but I studied the core workflows and built a small ERP-inspired inventory/order management project. It covers product and vendor data, purchase orders, sales orders, inventory counts, and low-stock reporting, which helped me understand how ERP systems connect operational data across purchasing, inventory, and sales.
