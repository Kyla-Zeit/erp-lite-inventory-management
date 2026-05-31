# API Examples

## Create a vendor

```bash
curl -X POST http://localhost:4000/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Vendor",
    "contact_name": "Alex Morgan",
    "email": "alex@example.com",
    "phone": "555-1234"
  }'
```

## Create a product

```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "CHAIR-ERG-001",
    "name": "Ergonomic Office Chair",
    "vendor_id": 1,
    "unit_cost": 120,
    "sell_price": 199,
    "reorder_level": 5,
    "quantity_on_hand": 7
  }'
```

## Create a received purchase order

This adds quantity to stock.

```bash
curl -X POST http://localhost:4000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": 1,
    "status": "Received",
    "items": [
      {
        "product_id": 1,
        "quantity": 10,
        "unit_cost": 6.50
      }
    ]
  }'
```

## Create a fulfilled sales order

This deducts quantity from stock.

```bash
curl -X POST http://localhost:4000/api/sales-orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Example Customer",
    "status": "Fulfilled",
    "items": [
      {
        "product_id": 1,
        "quantity": 3,
        "unit_price": 12.99
      }
    ]
  }'
```

## Record an inventory count

This adjusts the product quantity to match the counted quantity.

```bash
curl -X POST http://localhost:4000/api/inventory-counts \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Cycle count",
    "lines": [
      {
        "product_id": 1,
        "counted_quantity": 22
      }
    ]
  }'
```
