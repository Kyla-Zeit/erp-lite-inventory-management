import React, { useEffect, useState } from "react";

const API_BASE = 'http://localhost:4000/api';

const tabs = [
  'Dashboard',
  'Products',
  'Vendors',
  'Purchase Orders',
  'Sales Orders',
  'Inventory Count',
];

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data;
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [inventoryCounts, setInventoryCounts] = useState([]);
  const [message, setMessage] = useState('');

  async function loadAll() {
    const [
      dashboardData,
      productData,
      vendorData,
      purchaseOrderData,
      salesOrderData,
      inventoryCountData,
    ] = await Promise.all([
      api('/dashboard'),
      api('/products'),
      api('/vendors'),
      api('/purchase-orders'),
      api('/sales-orders'),
      api('/inventory-counts'),
    ]);

    setDashboard(dashboardData);
    setProducts(productData);
    setVendors(vendorData);
    setPurchaseOrders(purchaseOrderData);
    setSalesOrders(salesOrderData);
    setInventoryCounts(inventoryCountData);
  }

  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message));
  }, []);

  async function afterSave(text) {
    await loadAll();
    setMessage(text);
    setTimeout(() => setMessage(''), 3500);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">ERP-lite project</p>
          <h1>Inventory & Order Management</h1>
          <p>
            A small ERP-inspired system for products, vendors, purchase orders,
            sales orders, inventory counts, and low-stock reporting.
          </p>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {message && <div className="message">{message}</div>}

      {activeTab === 'Dashboard' && <Dashboard dashboard={dashboard} />}
      {activeTab === 'Products' && (
        <Products
          products={products}
          vendors={vendors}
          onSaved={() => afterSave('Product saved.')}
        />
      )}
      {activeTab === 'Vendors' && (
        <Vendors vendors={vendors} onSaved={() => afterSave('Vendor saved.')} />
      )}
      {activeTab === 'Purchase Orders' && (
        <PurchaseOrders
          products={products}
          vendors={vendors}
          purchaseOrders={purchaseOrders}
          onSaved={() => afterSave('Purchase order created.')}
        />
      )}
      {activeTab === 'Sales Orders' && (
        <SalesOrders
          products={products}
          salesOrders={salesOrders}
          onSaved={() => afterSave('Sales order created.')}
        />
      )}
      {activeTab === 'Inventory Count' && (
        <InventoryCount
          products={products}
          inventoryCounts={inventoryCounts}
          onSaved={() => afterSave('Inventory count saved.')}
        />
      )}
    </main>
  );
}

function Dashboard({ dashboard }) {
  if (!dashboard) {
    return <section className="card">Loading dashboard...</section>;
  }

  const totals = dashboard.totals;

  return (
    <section className="grid">
      <div className="metric">
        <span>Products</span>
        <strong>{totals.total_products}</strong>
      </div>
      <div className="metric">
        <span>Vendors</span>
        <strong>{totals.total_vendors}</strong>
      </div>
      <div className="metric danger">
        <span>Low Stock</span>
        <strong>{totals.low_stock_count}</strong>
      </div>
      <div className="metric">
        <span>Inventory Value</span>
        <strong>{money(totals.inventory_value)}</strong>
      </div>

      <div className="card wide">
        <h2>Low-stock products</h2>
        <Table
          columns={['SKU', 'Product', 'On Hand', 'Reorder Level', 'Vendor']}
          rows={dashboard.low_stock.map((item) => [
            item.sku,
            item.name,
            item.quantity_on_hand,
            item.reorder_level,
            item.vendor_name || 'No vendor',
          ])}
          empty="No low-stock products. Miracles apparently happen."
        />
      </div>

      <div className="card">
        <h2>Recent purchase orders</h2>
        <SimpleList
          items={dashboard.recent_purchase_orders.map(
            (po) => `PO #${po.id} · ${po.vendor_name || 'Unknown vendor'} · ${po.status} · ${money(po.total)}`
          )}
        />
      </div>

      <div className="card">
        <h2>Recent sales orders</h2>
        <SimpleList
          items={dashboard.recent_sales_orders.map(
            (so) => `SO #${so.id} · ${so.customer_name} · ${so.status} · ${money(so.total)}`
          )}
        />
      </div>
    </section>
  );
}

function Products({ products, vendors, onSaved }) {
  const [form, setForm] = useState({
    sku: '',
    name: '',
    vendor_id: '',
    unit_cost: '',
    sell_price: '',
    reorder_level: '',
    quantity_on_hand: '',
  });

  async function submit(event) {
    event.preventDefault();
    await api('/products', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setForm({
      sku: '',
      name: '',
      vendor_id: '',
      unit_cost: '',
      sell_price: '',
      reorder_level: '',
      quantity_on_hand: '',
    });
    onSaved();
  }

  return (
    <section className="grid">
      <div className="card">
        <h2>Add product</h2>
        <Form onSubmit={submit}>
          <Input label="SKU" value={form.sku} onChange={(sku) => setForm({ ...form, sku })} />
          <Input label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <Select
            label="Vendor"
            value={form.vendor_id}
            onChange={(vendor_id) => setForm({ ...form, vendor_id })}
            options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
          />
          <Input label="Unit cost" type="number" value={form.unit_cost} onChange={(unit_cost) => setForm({ ...form, unit_cost })} />
          <Input label="Sell price" type="number" value={form.sell_price} onChange={(sell_price) => setForm({ ...form, sell_price })} />
          <Input label="Reorder level" type="number" value={form.reorder_level} onChange={(reorder_level) => setForm({ ...form, reorder_level })} />
          <Input label="Quantity on hand" type="number" value={form.quantity_on_hand} onChange={(quantity_on_hand) => setForm({ ...form, quantity_on_hand })} />
          <button className="primary">Save Product</button>
        </Form>
      </div>

      <div className="card wide">
        <h2>Products</h2>
        <Table
          columns={['SKU', 'Name', 'Vendor', 'Cost', 'Price', 'On Hand', 'Reorder', 'Status']}
          rows={products.map((product) => [
            product.sku,
            product.name,
            product.vendor_name || 'No vendor',
            money(product.unit_cost),
            money(product.sell_price),
            product.quantity_on_hand,
            product.reorder_level,
            product.is_low_stock ? 'Low stock' : 'OK',
          ])}
        />
      </div>
    </section>
  );
}

function Vendors({ vendors, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
  });

  async function submit(event) {
    event.preventDefault();
    await api('/vendors', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setForm({ name: '', contact_name: '', email: '', phone: '' });
    onSaved();
  }

  return (
    <section className="grid">
      <div className="card">
        <h2>Add vendor</h2>
        <Form onSubmit={submit}>
          <Input label="Vendor name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <Input label="Contact name" value={form.contact_name} onChange={(contact_name) => setForm({ ...form, contact_name })} />
          <Input label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <Input label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
          <button className="primary">Save Vendor</button>
        </Form>
      </div>

      <div className="card wide">
        <h2>Vendors</h2>
        <Table
          columns={['Name', 'Contact', 'Email', 'Phone']}
          rows={vendors.map((vendor) => [
            vendor.name,
            vendor.contact_name || '',
            vendor.email || '',
            vendor.phone || '',
          ])}
        />
      </div>
    </section>
  );
}

function PurchaseOrders({ products, vendors, purchaseOrders, onSaved }) {
  const [form, setForm] = useState({
    vendor_id: '',
    product_id: '',
    quantity: 1,
    status: 'Received',
  });

  async function submit(event) {
    event.preventDefault();

    const product = products.find((item) => Number(item.id) === Number(form.product_id));

    await api('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        vendor_id: form.vendor_id,
        status: form.status,
        items: [
          {
            product_id: Number(form.product_id),
            quantity: Number(form.quantity),
            unit_cost: Number(product?.unit_cost || 0),
          },
        ],
      }),
    });

    setForm({ vendor_id: '', product_id: '', quantity: 1, status: 'Received' });
    onSaved();
  }

  const productOptions = useMemo(
    () => products.map((product) => ({ value: product.id, label: `${product.sku} · ${product.name}` })),
    [products]
  );

  return (
    <section className="grid">
      <div className="card">
        <h2>Create purchase order</h2>
        <p className="small">When status is Received, quantity is added to inventory.</p>
        <Form onSubmit={submit}>
          <Select
            label="Vendor"
            value={form.vendor_id}
            onChange={(vendor_id) => setForm({ ...form, vendor_id })}
            options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
          />
          <Select
            label="Product"
            value={form.product_id}
            onChange={(product_id) => setForm({ ...form, product_id })}
            options={productOptions}
          />
          <Input label="Quantity" type="number" value={form.quantity} onChange={(quantity) => setForm({ ...form, quantity })} />
          <Select
            label="Status"
            value={form.status}
            onChange={(status) => setForm({ ...form, status })}
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Received', label: 'Received' },
            ]}
          />
          <button className="primary">Create PO</button>
        </Form>
      </div>

      <div className="card wide">
        <h2>Purchase orders</h2>
        <Table
          columns={['PO #', 'Vendor', 'Status', 'Order Date', 'Total']}
          rows={purchaseOrders.map((po) => [
            po.id,
            po.vendor_name || 'Unknown vendor',
            po.status,
            po.order_date?.slice(0, 10),
            money(po.total),
          ])}
        />
      </div>
    </section>
  );
}

function SalesOrders({ products, salesOrders, onSaved }) {
  const [form, setForm] = useState({
    customer_name: '',
    product_id: '',
    quantity: 1,
    status: 'Fulfilled',
  });

  async function submit(event) {
    event.preventDefault();

    const product = products.find((item) => Number(item.id) === Number(form.product_id));

    await api('/sales-orders', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: form.customer_name,
        status: form.status,
        items: [
          {
            product_id: Number(form.product_id),
            quantity: Number(form.quantity),
            unit_price: Number(product?.sell_price || 0),
          },
        ],
      }),
    });

    setForm({ customer_name: '', product_id: '', quantity: 1, status: 'Fulfilled' });
    onSaved();
  }

  return (
    <section className="grid">
      <div className="card">
        <h2>Create sales order</h2>
        <p className="small">When status is Fulfilled, quantity is deducted from inventory.</p>
        <Form onSubmit={submit}>
          <Input label="Customer name" value={form.customer_name} onChange={(customer_name) => setForm({ ...form, customer_name })} />
          <Select
            label="Product"
            value={form.product_id}
            onChange={(product_id) => setForm({ ...form, product_id })}
            options={products.map((product) => ({
              value: product.id,
              label: `${product.sku} · ${product.name} · ${product.quantity_on_hand} on hand`,
            }))}
          />
          <Input label="Quantity" type="number" value={form.quantity} onChange={(quantity) => setForm({ ...form, quantity })} />
          <Select
            label="Status"
            value={form.status}
            onChange={(status) => setForm({ ...form, status })}
            options={[
              { value: 'Open', label: 'Open' },
              { value: 'Fulfilled', label: 'Fulfilled' },
            ]}
          />
          <button className="primary">Create SO</button>
        </Form>
      </div>

      <div className="card wide">
        <h2>Sales orders</h2>
        <Table
          columns={['SO #', 'Customer', 'Status', 'Order Date', 'Total']}
          rows={salesOrders.map((so) => [
            so.id,
            so.customer_name,
            so.status,
            so.order_date?.slice(0, 10),
            money(so.total),
          ])}
        />
      </div>
    </section>
  );
}

function InventoryCount({ products, inventoryCounts, onSaved }) {
  const [form, setForm] = useState({
    product_id: '',
    counted_quantity: '',
    notes: '',
  });

  async function submit(event) {
    event.preventDefault();

    await api('/inventory-counts', {
      method: 'POST',
      body: JSON.stringify({
        notes: form.notes,
        lines: [
          {
            product_id: Number(form.product_id),
            counted_quantity: Number(form.counted_quantity),
          },
        ],
      }),
    });

    setForm({ product_id: '', counted_quantity: '', notes: '' });
    onSaved();
  }

  return (
    <section className="grid">
      <div className="card">
        <h2>Record inventory count</h2>
        <p className="small">
          This compares the system quantity to the physical counted quantity and
          adjusts inventory.
        </p>
        <Form onSubmit={submit}>
          <Select
            label="Product"
            value={form.product_id}
            onChange={(product_id) => setForm({ ...form, product_id })}
            options={products.map((product) => ({
              value: product.id,
              label: `${product.sku} · ${product.name} · system qty ${product.quantity_on_hand}`,
            }))}
          />
          <Input label="Counted quantity" type="number" value={form.counted_quantity} onChange={(counted_quantity) => setForm({ ...form, counted_quantity })} />
          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Cycle count, shelf audit, correction, etc."
            />
          </label>
          <button className="primary">Save Count</button>
        </Form>
      </div>

      <div className="card wide">
        <h2>Inventory counts</h2>
        <Table
          columns={['Count #', 'Date', 'Lines', 'Absolute Variance', 'Notes']}
          rows={inventoryCounts.map((count) => [
            count.id,
            count.count_date?.slice(0, 10),
            count.line_count,
            count.total_absolute_variance,
            count.notes || '',
          ])}
        />
      </div>
    </section>
  );
}

function Form({ children, onSubmit }) {
  return (
    <form className="form" onSubmit={onSubmit}>
      {children}
    </form>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Table({ columns, rows, empty = 'No records yet.' }) {
  if (!rows.length) {
    return <p className="small">{empty}</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleList({ items }) {
  if (!items.length) {
    return <p className="small">Nothing here yet.</p>;
  }

  return (
    <ul className="simple-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default App;
