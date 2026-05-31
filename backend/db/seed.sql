INSERT INTO vendors (name, contact_name, email, phone) VALUES
('Maple Office Supply', 'Dana Lee', 'dana@mapleoffice.example', '905-555-1100'),
('Northstar Packaging', 'Owen Patel', 'owen@northstar.example', '416-555-2200'),
('Harbour Tech Parts', 'Mira Chen', 'mira@harbourtech.example', '647-555-3300');

INSERT INTO products (sku, name, vendor_id, unit_cost, sell_price, reorder_level, quantity_on_hand) VALUES
('PEN-BLK-001', 'Black Ballpoint Pens - Box of 50', 1, 6.50, 12.99, 20, 17),
('PAPER-LTR-500', 'Letter Printer Paper - 500 Sheets', 1, 4.25, 8.99, 30, 45),
('BOX-SM-100', 'Small Shipping Boxes - Pack of 100', 2, 22.00, 39.99, 10, 8),
('LABEL-THERM-250', 'Thermal Shipping Labels - Roll of 250', 2, 9.75, 18.99, 15, 28),
('USB-C-HUB-7', '7-Port USB-C Hub', 3, 27.50, 54.99, 5, 4);

INSERT INTO purchase_orders (vendor_id, status, order_date, received_date) VALUES
(1, 'Received', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days'),
(2, 'Draft', CURRENT_DATE - INTERVAL '2 days', NULL);

INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost) VALUES
(1, 1, 25, 6.50),
(1, 2, 40, 4.25),
(2, 3, 20, 22.00);

INSERT INTO sales_orders (customer_name, status, order_date) VALUES
('Green Valley Clinic', 'Fulfilled', CURRENT_DATE - INTERVAL '3 days'),
('Riverside Legal Office', 'Open', CURRENT_DATE - INTERVAL '1 day');

INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price) VALUES
(1, 1, 8, 12.99),
(1, 2, 5, 8.99),
(2, 5, 2, 54.99);
