import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './db.js';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

// ── Razorpay SDK instance (real keys from .env) ──
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID || 'rzp_test_Th0vr3ypNCVomW',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'S877uFyES8rbzOeQDqy1Z9wS'
});

// Initialize SQLite Schema & Seed Data
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to get all settings as an object
function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

// -------------------------------------------------------------
// PUBLIC ENDPOINTS
// -------------------------------------------------------------

// Public Settings (safe keys only)
app.get('/api/settings/public', (req, res) => {
  const settings = getAllSettings();
  res.json({
    site_name: settings.site_name || 'HQTech Studio',
    site_tagline: settings.site_tagline || 'High-Impact Digital Engineering',
    payment_mode: settings.payment_mode || 'sandbox',
    currency_symbol: settings.currency_symbol || '₹',
    currency_code: settings.currency_code || 'INR',
    contact_email: settings.contact_email || 'founder@hqtech.dev',
    contact_phone: settings.contact_phone || '+91 98765 43210',
    whatsapp_number: settings.whatsapp_number || '+919876543210',
    gateways: {
      razorpay: {
        enabled: settings.razorpay_enabled === 'true',
        key_id: settings.razorpay_key_id
      },
      phonepe: {
        enabled: settings.phonepe_enabled === 'true',
        merchant_id: settings.phonepe_merchant_id
      },
      paytm: {
        enabled: settings.paytm_enabled === 'true',
        mid: settings.paytm_mid
      }
    }
  });
});

// Get all services with their plans
app.get('/api/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY order_index ASC').all();
    const plans = db.prepare('SELECT * FROM service_plans WHERE is_active = 1 ORDER BY price ASC').all();

    const result = services.map(s => {
      return {
        ...s,
        tech_stack: s.tech_stack ? JSON.parse(s.tech_stack) : [],
        deliverables: s.deliverables ? JSON.parse(s.deliverables) : [],
        plans: plans.filter(p => p.service_id === s.id).map(p => ({
          ...p,
          features: p.features ? JSON.parse(p.features) : []
        }))
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get single service by ID
app.get('/api/services/:id', (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const plans = db.prepare('SELECT * FROM service_plans WHERE service_id = ? AND is_active = 1 ORDER BY price ASC').all(req.params.id);

    res.json({
      ...service,
      tech_stack: service.tech_stack ? JSON.parse(service.tech_stack) : [],
      deliverables: service.deliverables ? JSON.parse(service.deliverables) : [],
      plans: plans.map(p => ({
        ...p,
        features: p.features ? JSON.parse(p.features) : []
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Get portfolio showcase items
app.get('/api/portfolio', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM portfolio_items ORDER BY created_at DESC').all();
    res.json(items.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : []
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Client Inquiries / Contact Form
app.post('/api/inquiries', (req, res) => {
  try {
    const { client_name, client_email, client_phone, service_id, budget_range, timeline, message } = req.body;
    if (!client_name || !client_email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const id = 'inq-' + Date.now();
    db.prepare(`
      INSERT INTO inquiries (id, client_name, client_email, client_phone, service_id, budget_range, timeline, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
    `).run(id, client_name, client_email, client_phone || '', service_id || '', budget_range || '', timeline || '', message);

    res.json({ success: true, inquiry_id: id, message: 'Inquiry received. Our team will contact you within 24 hours!' });
  } catch (err) {
    console.error('Error creating inquiry:', err);
    res.status(500).json({ error: 'Failed to save inquiry' });
  }
});

// ─── Checkout: Create Real Razorpay Order ─────────────────────────────────
app.post('/api/checkout/create-order', async (req, res) => {
  try {
    const { service_id, plan_id, client_name, client_email, client_phone, company_name, project_brief, gateway } = req.body;

    if (!client_name || !client_email || !service_id || !gateway) {
      return res.status(400).json({ error: 'Missing mandatory order fields' });
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
    let plan = null;
    let amount = service ? service.starting_price : 9999;
    let plan_name = 'Custom Request';

    if (plan_id) {
      plan = db.prepare('SELECT * FROM service_plans WHERE id = ?').get(plan_id);
      if (plan) { amount = plan.price; plan_name = plan.name; }
    }

    const order_number = 'HQT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    // ── Real Razorpay order ──────────────────────────────────────
    if (gateway.toLowerCase() === 'razorpay') {
      const rzpOrder = await razorpay.orders.create({
        amount:   Math.round(amount * 100), // paise
        currency: 'INR',
        receipt:  order_number,
        notes: {
          service:  service?.title || 'HQTech Service',
          plan:     plan_name,
          client:   client_name,
          email:    client_email
        }
      });

      return res.json({
        success:       true,
        order_id:      rzpOrder.id,          // Razorpay order id  e.g. order_XXXXXX
        order_number,
        amount,
        currency:      'INR',
        service_title: service?.title || 'HQTech Service',
        plan_name,
        gateway:       'Razorpay',
        key_id:        process.env.RAZORPAY_KEY_ID,
        rzp_order:     rzpOrder
      });
    }

    // ── PhonePe (UPI deep-link / QR — manual flow) ────────────────
    if (gateway.toLowerCase() === 'phonepe') {
      const transaction_id = 'TXN_PPE_' + Date.now();
      return res.json({
        success: true,
        order_id: 'ord-' + Date.now(),
        order_number,
        amount,
        currency: 'INR',
        service_title: service?.title || 'HQTech Service',
        plan_name,
        gateway: 'PhonePe',
        transaction_id,
        upi_link: `upi://pay?pa=hqtech@ybl&pn=HQTechStudio&am=${amount}&tr=${transaction_id}&cu=INR`
      });
    }

    // ── Paytm (manual QR flow) ────────────────────────────────────
    if (gateway.toLowerCase() === 'paytm') {
      const transaction_id = 'PTM_' + Date.now();
      return res.json({
        success: true,
        order_id: 'ord-' + Date.now(),
        order_number,
        amount,
        currency: 'INR',
        service_title: service?.title || 'HQTech Service',
        plan_name,
        gateway: 'Paytm',
        transaction_id
      });
    }

    res.status(400).json({ error: 'Unknown gateway' });
  } catch (err) {
    console.error('Error creating checkout order:', err);
    res.status(500).json({ error: err.message || 'Failed to initialize order checkout' });
  }
});

// ─── Checkout: Verify Razorpay Signature ──────────────────────────────────
app.post('/api/checkout/verify-razorpay', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // metadata to store
      order_number, client_name, client_email, client_phone,
      company_name, project_brief, service_id, service_title,
      plan_id, plan_name, amount
    } = req.body;

    // ── HMAC-SHA256 signature check ──────────────────────────────
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment signature mismatch — possible tamper attempt.' });
    }

    // ── Signature valid → save order to DB ───────────────────────
    const id  = 'ord-' + Date.now();
    const final_order_num = order_number || ('HQT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));

    db.prepare(`
      INSERT INTO orders_transactions (
        id, order_number, client_name, client_email, client_phone, company_name,
        project_brief, service_id, service_title, plan_id, plan_name, amount,
        currency, gateway, payment_method, transaction_id, status, order_status, payment_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'Razorpay', 'UPI/Card', ?, 'SUCCESS', 'IN_PROGRESS', ?)
    `).run(
      id, final_order_num, client_name, client_email, client_phone || '',
      company_name || '', project_brief || '', service_id, service_title || 'Digital Service',
      plan_id || '', plan_name || 'Standard Package', Number(amount) || 0,
      razorpay_payment_id,
      JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
    );

    res.json({
      success:        true,
      order_number:   final_order_num,
      transaction_id: razorpay_payment_id,
      message:        'Payment verified and order created successfully!'
    });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ success: false, error: 'Failed to verify Razorpay payment' });
  }
});

// Checkout - Verify & Record Transaction
app.post('/api/checkout/verify', (req, res) => {
  try {
    const {
      order_id,
      order_number,
      client_name,
      client_email,
      client_phone,
      company_name,
      project_brief,
      service_id,
      service_title,
      plan_id,
      plan_name,
      amount,
      gateway,
      payment_method,
      transaction_id,
      payment_details
    } = req.body;

    const id = order_id || 'ord-' + Date.now();
    const final_order_num = order_number || ('HQT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
    const final_txn_id = transaction_id || ('TXN_' + Date.now());

    db.prepare(`
      INSERT INTO orders_transactions (
        id, order_number, client_name, client_email, client_phone, company_name,
        project_brief, service_id, service_title, plan_id, plan_name, amount,
        currency, gateway, payment_method, transaction_id, status, order_status, payment_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, 'SUCCESS', 'IN_PROGRESS', ?)
    `).run(
      id,
      final_order_num,
      client_name,
      client_email,
      client_phone || '',
      company_name || '',
      project_brief || '',
      service_id,
      service_title || 'Digital Service',
      plan_id || '',
      plan_name || 'Standard Package',
      Number(amount) || 0,
      gateway || 'Razorpay',
      payment_method || 'UPI',
      final_txn_id,
      JSON.stringify(payment_details || {})
    );

    res.json({
      success: true,
      order_number: final_order_num,
      transaction_id: final_txn_id,
      message: 'Payment verified and project order created successfully!'
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
});

// -------------------------------------------------------------
// ADMIN PANEL ENDPOINTS
// -------------------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const settings = getAllSettings();
  const adminPassword = settings.admin_password || 'hqtech2026';

  if (password === adminPassword) {
    const token = 'hqt_admin_' + Buffer.from(Date.now().toString()).toString('base64');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

// Admin Stats & Dashboard KPI
app.get('/api/admin/stats', (req, res) => {
  try {
    const totalRevenueRow = db.prepare("SELECT SUM(amount) as total FROM orders_transactions WHERE status = 'SUCCESS'").get();
    const totalOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders_transactions").get();
    const pendingOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders_transactions WHERE order_status = 'IN_PROGRESS' OR order_status = 'NEW'").get();
    const completedOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders_transactions WHERE order_status = 'COMPLETED'").get();
    const totalInquiriesRow = db.prepare("SELECT COUNT(*) as count FROM inquiries").get();
    const totalServicesRow = db.prepare("SELECT COUNT(*) as count FROM services").get();

    // Gateway breakdown
    const gatewayStats = db.prepare(`
      SELECT gateway, COUNT(*) as count, SUM(amount) as revenue
      FROM orders_transactions
      WHERE status = 'SUCCESS'
      GROUP BY gateway
    `).all();

    // Recent 5 transactions
    const recentTransactions = db.prepare(`
      SELECT * FROM orders_transactions ORDER BY created_at DESC LIMIT 5
    `).all();

    res.json({
      totalRevenue: totalRevenueRow.total || 0,
      totalOrders: totalOrdersRow.count || 0,
      pendingOrders: pendingOrdersRow.count || 0,
      completedOrders: completedOrdersRow.count || 0,
      totalInquiries: totalInquiriesRow.count || 0,
      totalServices: totalServicesRow.count || 0,
      gatewayBreakdown: gatewayStats,
      recentTransactions
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Admin Orders & Transactions List
app.get('/api/admin/transactions', (req, res) => {
  try {
    const { status, gateway, search } = req.query;
    let query = 'SELECT * FROM orders_transactions WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND order_status = ?';
      params.push(status);
    }
    if (gateway) {
      query += ' AND gateway = ?';
      params.push(gateway);
    }
    if (search) {
      query += ' AND (client_name LIKE ? OR order_number LIKE ? OR client_email LIKE ? OR transaction_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Update Order Status (e.g. IN_PROGRESS -> COMPLETED)
app.patch('/api/admin/transactions/:id', (req, res) => {
  try {
    const { order_status } = req.body;
    db.prepare('UPDATE orders_transactions SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(order_status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Admin Inquiries List
app.get('/api/admin/inquiries', (req, res) => {
  try {
    const inquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// Update Inquiry Status
app.patch('/api/admin/inquiries/:id', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// Admin Settings: Get All
app.get('/api/admin/settings', (req, res) => {
  try {
    res.json(getAllSettings());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Admin Settings: Save
app.post('/api/admin/settings', (req, res) => {
  try {
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(req.body)) {
      upsert.run(key, String(value));
    }
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Admin Services: Create
app.post('/api/admin/services', (req, res) => {
  try {
    const { id, title, category, short_desc, full_desc, icon, badge, tech_stack, deliverables, starting_price, featured, order_index } = req.body;
    const sId = id || ('srv-' + title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));

    db.prepare(`
      INSERT INTO services (id, title, category, short_desc, full_desc, icon, badge, tech_stack, deliverables, starting_price, featured, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sId,
      title,
      category || 'Development',
      short_desc || '',
      full_desc || '',
      icon || 'Code',
      badge || '',
      JSON.stringify(tech_stack || []),
      JSON.stringify(deliverables || []),
      Number(starting_price) || 0,
      featured ? 1 : 0,
      order_index || 0
    );

    res.json({ success: true, id: sId });
  } catch (err) {
    console.error('Error adding service:', err);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// Admin Services: Update
app.put('/api/admin/services/:id', (req, res) => {
  try {
    const { title, category, short_desc, full_desc, icon, badge, tech_stack, deliverables, starting_price, featured, order_index } = req.body;

    db.prepare(`
      UPDATE services SET
        title = ?, category = ?, short_desc = ?, full_desc = ?, icon = ?,
        badge = ?, tech_stack = ?, deliverables = ?, starting_price = ?,
        featured = ?, order_index = ?
      WHERE id = ?
    `).run(
      title,
      category,
      short_desc,
      full_desc,
      icon,
      badge,
      JSON.stringify(tech_stack || []),
      JSON.stringify(deliverables || []),
      Number(starting_price) || 0,
      featured ? 1 : 0,
      order_index || 0,
      req.params.id
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Admin Services: Delete
app.delete('/api/admin/services/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM service_plans WHERE service_id = ?').run(req.params.id);
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Admin Plans: Create
app.post('/api/admin/plans', (req, res) => {
  try {
    const { service_id, name, price, currency, billing_cycle, delivery_days, revisions, features, is_popular } = req.body;
    const planId = 'plan-' + Date.now();

    db.prepare(`
      INSERT INTO service_plans (id, service_id, name, price, currency, billing_cycle, delivery_days, revisions, features, is_popular, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      planId,
      service_id,
      name,
      Number(price),
      currency || 'INR',
      billing_cycle || 'Project',
      Number(delivery_days) || 7,
      revisions || '3 Revisions',
      JSON.stringify(features || []),
      is_popular ? 1 : 0
    );

    res.json({ success: true, id: planId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Admin Plans: Update
app.put('/api/admin/plans/:id', (req, res) => {
  try {
    const { name, price, currency, billing_cycle, delivery_days, revisions, features, is_popular, is_active } = req.body;

    db.prepare(`
      UPDATE service_plans SET
        name = ?, price = ?, currency = ?, billing_cycle = ?,
        delivery_days = ?, revisions = ?, features = ?, is_popular = ?, is_active = ?
      WHERE id = ?
    `).run(
      name,
      Number(price),
      currency || 'INR',
      billing_cycle || 'Project',
      Number(delivery_days) || 7,
      revisions || '3 Revisions',
      JSON.stringify(features || []),
      is_popular ? 1 : 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      req.params.id
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Admin Plans: Delete
app.delete('/api/admin/plans/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM service_plans WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// Serve static production client assets
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// SPA fallback for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`[HQTech Application] Running on http://localhost:${PORT}`);
});
