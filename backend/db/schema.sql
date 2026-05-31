DROP TABLE IF EXISTS inventory_count_lines;
DROP TABLE IF EXISTS inventory_counts;
DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS vendors;

CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_name VARCHAR(150),
  email VARCHAR(150),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE sales_orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Open',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sales_order_items (
  id SERIAL PRIMARY KEY,
  sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE inventory_counts (
  id SERIAL PRIMARY KEY,
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_count_lines (
  id SERIAL PRIMARY KEY,
  inventory_count_id INTEGER NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  system_quantity INTEGER NOT NULL,
  counted_quantity INTEGER NOT NULL,
  variance INTEGER NOT NULL
);
