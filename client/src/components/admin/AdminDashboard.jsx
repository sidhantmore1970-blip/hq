import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Receipt, Layers, Inbox, Settings, LogOut, 
  Menu, X, Search, Filter, Plus, Edit2, Trash2, CheckCircle2, 
  Clock, AlertCircle, ArrowUpRight, Shield, CreditCard, QrCode, 
  Smartphone, ChevronRight, RefreshCw, Eye, Save, DollarSign 
} from 'lucide-react';

export default function AdminDashboard({ onExitAdmin, currencySymbol = '₹' }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('hqt_admin_auth') === 'true';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Tab: 'overview' | 'orders' | 'services' | 'inquiries' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [services, setServices] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [adminSettings, setAdminSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [isNewService, setIsNewService] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [targetServiceIdForPlan, setTargetServiceIdForPlan] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('hqt_admin_auth', 'true');
      } else {
        setLoginError(data.error || 'Invalid administrator password');
      }
    } catch (err) {
      setLoginError('Could not verify credentials with backend.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('hqt_admin_auth');
  };

  // Fetch all admin data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, txnsRes, srvRes, inqRes, setRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/transactions'),
        fetch('/api/services'),
        fetch('/api/admin/inquiries'),
        fetch('/api/admin/settings')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (txnsRes.ok) setTransactions(await txnsRes.json());
      if (srvRes.ok) setServices(await srvRes.json());
      if (inqRes.ok) setInquiries(await inqRes.json());
      if (setRes.ok) setAdminSettings(await setRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Order status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/transactions/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus })
      });
      if (res.ok) {
        showToast(`Order marked as ${newStatus}`);
        fetchAllData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, order_status: newStatus });
        }
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Inquiry status update
  const handleUpdateInquiryStatus = async (inqId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${inqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast('Inquiry status updated');
        fetchAllData();
      }
    } catch (err) {
      alert('Failed to update inquiry status');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminSettings)
      });
      if (res.ok) {
        showToast('Settings saved successfully!');
        fetchAllData();
      }
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  // Save Service
  const handleSaveService = async (serviceData) => {
    try {
      const url = isNewService ? '/api/admin/services' : `/api/admin/services/${serviceData.id}`;
      const method = isNewService ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      if (res.ok) {
        showToast(isNewService ? 'New service added!' : 'Service updated!');
        setEditingService(null);
        setIsNewService(false);
        fetchAllData();
      }
    } catch (err) {
      alert('Failed to save service');
    }
  };

  // Delete Service
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service and its plans?')) return;
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Service deleted');
        fetchAllData();
      }
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  // Save Plan
  const handleSavePlan = async (planData) => {
    try {
      const isNew = !planData.id;
      const url = isNew ? '/api/admin/plans' : `/api/admin/plans/${planData.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planData,
          service_id: targetServiceIdForPlan
        })
      });
      if (res.ok) {
        showToast('Service plan updated!');
        setEditingPlan(null);
        fetchAllData();
      }
    } catch (err) {
      alert('Failed to save plan');
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this plan tier?')) return;
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Plan removed');
        fetchAllData();
      }
    } catch (err) {
      alert('Failed to delete plan');
    }
  };

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#06080d'
      }}>
        <div style={{
          maxWidth: '420px',
          width: '100%',
          padding: '36px',
          background: '#0d1321',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 'var(--radius-md)',
              background: 'var(--tech-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#fff'
            }}>
              <Shield size={26} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>HQTech Admin Portal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Service Plans & Payment Transaction Control
            </p>
          </div>

          {loginError && (
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Admin Security Passcode</label>
              <input 
                type="password" 
                required 
                placeholder="Enter password (default: hqtech2026)"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '14px' }}>
              <span>Unlock Admin Panel</span>
              <ChevronRight size={16} />
            </button>

            <button 
              type="button" 
              className="btn btn-glass" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onExitAdmin}
            >
              Return to Client Site
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchGateway = gatewayFilter === 'All' || t.gateway.toLowerCase() === gatewayFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || t.order_status === statusFilter;
    const matchSearch = !searchQuery || 
      t.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGateway && matchStatus && matchSearch;
  });

  return (
    <div className="admin-layout">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          background: 'var(--primary-gradient)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="admin-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon" style={{ width: 34, height: 34 }}>
            <Shield size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>HQTech<span className="text-cyan">Admin</span></div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent)' }}>Mobile-Ready Console</div>
          </div>
        </div>

        <nav className="admin-nav-list">
          <div 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>

          <div 
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Receipt size={18} />
            <span>Orders & Txns</span>
            {transactions.length > 0 && (
              <span className="badge badge-accent" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                {transactions.length}
              </span>
            )}
          </div>

          <div 
            className={`admin-nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Layers size={18} />
            <span>Services & Plans</span>
          </div>

          <div 
            className={`admin-nav-item ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('inquiries')}
          >
            <Inbox size={18} />
            <span>Client Inquiries</span>
            {inquiries.length > 0 && (
              <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                {inquiries.length}
              </span>
            )}
          </div>

          <div 
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            <span>Payment Gateways</span>
          </div>
        </nav>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className="btn btn-glass btn-sm"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={onExitAdmin}
          >
            <ArrowUpRight size={14} />
            <span>Switch to Client Site</span>
          </button>
          <button 
            className="btn btn-glass btn-sm"
            style={{ width: '100%', justifyContent: 'flex-start', color: '#f87171' }}
            onClick={handleLogout}
          >
            <LogOut size={14} />
            <span>Lock Admin</span>
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileDrawerOpen && (
        <div className="mobile-admin-backdrop" onClick={() => setMobileDrawerOpen(false)} />
      )}
      <div className={`mobile-admin-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>HQTech<span className="text-cyan">Admin</span></div>
          <button onClick={() => setMobileDrawerOpen(false)} style={{ color: '#fff' }}>
            <X size={22} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          <div 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setMobileDrawerOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setMobileDrawerOpen(false); }}
          >
            <Receipt size={18} />
            <span>Orders & Txns</span>
          </div>
          <div 
            className={`admin-nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => { setActiveTab('services'); setMobileDrawerOpen(false); }}
          >
            <Layers size={18} />
            <span>Services & Plans</span>
          </div>
          <div 
            className={`admin-nav-item ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => { setActiveTab('inquiries'); setMobileDrawerOpen(false); }}
          >
            <Inbox size={18} />
            <span>Client Inquiries</span>
          </div>
          <div 
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setMobileDrawerOpen(false); }}
          >
            <Settings size={18} />
            <span>Payment Gateways</span>
          </div>
        </nav>

        <button 
          className="btn btn-glass btn-sm"
          style={{ width: '100%', justifyContent: 'center', marginBottom: '8px' }}
          onClick={() => { setMobileDrawerOpen(false); onExitAdmin(); }}
        >
          View Client Site
        </button>
        <button 
          className="btn btn-glass btn-sm"
          style={{ width: '100%', justifyContent: 'center', color: '#f87171' }}
          onClick={handleLogout}
        >
          Lock Admin
        </button>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="mobile-bottom-bar">
        <div 
          className={`mobile-bottom-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={18} />
          <span>Stats</span>
        </div>
        <div 
          className={`mobile-bottom-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Receipt size={18} />
          <span>Orders</span>
        </div>
        <div 
          className={`mobile-bottom-tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Layers size={18} />
          <span>Services</span>
        </div>
        <div 
          className={`mobile-bottom-tab ${activeTab === 'inquiries' ? 'active' : ''}`}
          onClick={() => setActiveTab('inquiries')}
        >
          <Inbox size={18} />
          <span>Leads</span>
        </div>
        <div 
          className={`mobile-bottom-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          <span>Keys</span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main-container">
        
        {/* TOP BAR */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open sidebar drawer"
            >
              <Menu size={20} />
            </button>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, textTransform: 'capitalize' }}>
              {activeTab === 'overview' && 'Operational Command Center'}
              {activeTab === 'orders' && 'Orders & Gateway Transactions'}
              {activeTab === 'services' && 'Freelance Services & Plan Architecture'}
              {activeTab === 'inquiries' && 'Inbound Inquiries & Quotes'}
              {activeTab === 'settings' && 'Payment Gateways & API Credentials'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-accent" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              <span>{adminSettings.payment_mode === 'production' ? 'LIVE MODE' : 'SANDBOX SIMULATOR'}</span>
            </span>
            <button 
              className="btn btn-glass btn-sm"
              onClick={fetchAllData}
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
              <span style={{ display: 'none', '@media (min-width: 600px)': { display: 'inline' } }}>Refresh</span>
            </button>
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="admin-content-area">
            {/* KPI Cards */}
            <div className="admin-stats-grid">
              <div className="admin-kpi-card">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-title">Gross Revenue</span>
                  <div className="admin-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                    <DollarSign size={20} />
                  </div>
                </div>
                <div className="admin-kpi-value text-cyan">
                  {currencySymbol}{Number(stats?.totalRevenue || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Across Razorpay, PhonePe & Paytm
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-title">Active Orders</span>
                  <div className="admin-kpi-icon" style={{ background: 'rgba(79, 70, 229, 0.15)', color: 'var(--primary-light)' }}>
                    <Receipt size={20} />
                  </div>
                </div>
                <div className="admin-kpi-value">
                  {stats?.pendingOrders || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Total Orders: {stats?.totalOrders || 0}
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-title">Inbound Leads</span>
                  <div className="admin-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                    <Inbox size={20} />
                  </div>
                </div>
                <div className="admin-kpi-value">
                  {stats?.totalInquiries || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Potential commissions
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-title">Live Services</span>
                  <div className="admin-kpi-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent)' }}>
                    <Layers size={20} />
                  </div>
                </div>
                <div className="admin-kpi-value">
                  {stats?.totalServices || 5}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Configured disciplines
                </div>
              </div>
            </div>

            {/* Gateway Revenue Split */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                Payment Gateway Revenue Distribution
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {['Razorpay', 'PhonePe', 'Paytm'].map(gName => {
                  const match = stats?.gatewayBreakdown?.find(g => g.gateway.toLowerCase() === gName.toLowerCase());
                  const rev = match ? match.revenue : 0;
                  const count = match ? match.count : 0;

                  return (
                    <div key={gName} style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700 }}>{gName}</span>
                        <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>{count} Txns</span>
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent)' }}>
                        {currencySymbol}{Number(rev).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Project Commissions</h3>
                <button className="btn btn-glass btn-sm" onClick={() => setActiveTab('orders')}>
                  <span>View All Orders →</span>
                </button>
              </div>

              {/* Desktop Table View */}
              <div className="desktop-table-view">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Client</th>
                      <th>Service & Plan</th>
                      <th>Gateway</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map(t => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                          {t.order_number}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.client_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t.client_email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{t.service_title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{t.plan_name}</div>
                        </td>
                        <td>
                          <span className={`badge ${t.gateway === 'Razorpay' ? 'badge-primary' : 'badge-accent'}`}>
                            {t.gateway}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {currencySymbol}{Number(t.amount).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${
                            t.order_status === 'COMPLETED' ? 'badge-success' :
                            t.order_status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-primary'
                          }`}>
                            {t.order_status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-glass btn-sm"
                            onClick={() => setSelectedOrder(t)}
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View for Phones */}
              <div className="mobile-card-list">
                {transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="mobile-data-card">
                    <div className="mobile-data-card-header">
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>
                        {t.order_number}
                      </span>
                      <span className={`badge ${
                        t.order_status === 'COMPLETED' ? 'badge-success' :
                        t.order_status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-primary'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {t.order_status}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{t.client_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {t.service_title} ({t.plan_name})
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--success)' }}>
                        {currencySymbol}{Number(t.amount).toLocaleString()} via {t.gateway}
                      </span>
                      <button 
                        className="btn btn-glass btn-sm"
                        onClick={() => setSelectedOrder(t)}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ORDERS & TRANSACTIONS */}
        {activeTab === 'orders' && (
          <div className="admin-content-area">
            <div className="admin-table-container">
              {/* Filter & Search Bar */}
              <div className="admin-table-header">
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flexGrow: 1 }}>
                  <div className="admin-search-bar" style={{ minWidth: '220px' }}>
                    <input 
                      type="text"
                      placeholder="Search by client, ID, txn..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Gateway filter */}
                  <select 
                    style={{ width: 'auto' }}
                    value={gatewayFilter}
                    onChange={e => setGatewayFilter(e.target.value)}
                  >
                    <option value="All">All Gateways</option>
                    <option value="Razorpay">Razorpay</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                  </select>

                  {/* Status filter */}
                  <select 
                    style={{ width: 'auto' }}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="NEW">NEW</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Showing {filteredTransactions.length} of {transactions.length} records
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="desktop-table-view">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Client Name</th>
                      <th>Service & Plan</th>
                      <th>Gateway</th>
                      <th>Txn ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                          {t.order_number}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.client_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t.client_email}</div>
                        </td>
                        <td>
                          <div>{t.service_title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{t.plan_name}</div>
                        </td>
                        <td>
                          <span className={`badge ${t.gateway === 'Razorpay' ? 'badge-primary' : 'badge-accent'}`}>
                            {t.gateway}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t.transaction_id}
                        </td>
                        <td style={{ fontWeight: 800 }}>
                          {currencySymbol}{Number(t.amount).toLocaleString()}
                        </td>
                        <td>
                          <select 
                            value={t.order_status}
                            onChange={e => handleUpdateOrderStatus(t.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4, width: 'auto' }}
                          >
                            <option value="NEW">NEW</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                        <td>
                          <button 
                            className="btn btn-glass btn-sm"
                            onClick={() => setSelectedOrder(t)}
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View for Phones */}
              <div className="mobile-card-list">
                {filteredTransactions.map(t => (
                  <div key={t.id} className="mobile-data-card">
                    <div className="mobile-data-card-header">
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                        {t.order_number}
                      </span>
                      <span className={`badge ${t.gateway === 'Razorpay' ? 'badge-primary' : 'badge-accent'}`} style={{ fontSize: '0.65rem' }}>
                        {t.gateway}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700 }}>{t.client_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.client_email} · {t.client_phone || 'No phone'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary-light)', marginTop: '4px' }}>
                      {t.service_title} — <strong>{t.plan_name}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Txn: {t.transaction_id}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>
                          {currencySymbol}{Number(t.amount).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select 
                          value={t.order_status}
                          onChange={e => handleUpdateOrderStatus(t.id, e.target.value)}
                          style={{ padding: '6px 8px', fontSize: '0.75rem', width: 'auto' }}
                        >
                          <option value="NEW">NEW</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                        <button className="btn btn-glass btn-sm" onClick={() => setSelectedOrder(t)}>
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SERVICES & PLANS */}
        {activeTab === 'services' && (
          <div className="admin-content-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Manage Services & Pricing Tiers</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Edit descriptions, icons, tech stacks, and configure pricing plans for checkout.
                </p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setIsNewService(true);
                  setEditingService({
                    id: '',
                    title: '',
                    category: 'Custom Service',
                    short_desc: '',
                    full_desc: '',
                    icon: 'Code',
                    badge: 'New',
                    starting_price: 4999,
                    tech_stack: ['React', 'Node.js'],
                    deliverables: ['Source Code', 'Deployment']
                  });
                }}
              >
                <Plus size={16} />
                <span>Add New Service</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {services.map(service => (
                <div key={service.id} className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge badge-accent">{service.category}</span>
                        {service.badge && <span className="badge badge-primary">{service.badge}</span>}
                      </div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '6px' }}>{service.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '680px', marginTop: '4px' }}>
                        {service.short_desc}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-glass btn-sm"
                        onClick={() => {
                          setIsNewService(false);
                          setEditingService(service);
                        }}
                      >
                        <Edit2 size={13} />
                        <span>Edit Service</span>
                      </button>
                      <button 
                        className="btn btn-glass btn-sm"
                        style={{ color: '#f87171' }}
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Plan Tiers for this service */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        Tiered Plans ({service.plans?.length || 0})
                      </span>
                      <button 
                        className="btn btn-glass btn-sm"
                        onClick={() => {
                          setTargetServiceIdForPlan(service.id);
                          setEditingPlan({
                            name: '',
                            price: 5999,
                            currency: 'INR',
                            billing_cycle: 'Project',
                            delivery_days: 7,
                            revisions: '3 Revisions',
                            features: ['Feature 1', 'Feature 2'],
                            is_popular: 0
                          });
                        }}
                      >
                        <Plus size={13} />
                        <span>Add Tier</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                      {service.plans?.map(p => (
                        <div key={p.id} style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</span>
                              {p.is_popular === 1 && <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>Popular</span>}
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', margin: '6px 0' }}>
                              {currencySymbol}{Number(p.price).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                              {p.delivery_days} days · {p.revisions}
                            </div>
                            <ul style={{ listStyle: 'none', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {p.features?.slice(0, 3).map((f, i) => (
                                <li key={i} style={{ marginBottom: '2px' }}>• {f}</li>
                              ))}
                            </ul>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                            <button 
                              className="btn btn-glass btn-sm"
                              onClick={() => {
                                setTargetServiceIdForPlan(service.id);
                                setEditingPlan(p);
                              }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              className="btn btn-glass btn-sm"
                              style={{ color: '#f87171' }}
                              onClick={() => handleDeletePlan(p.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: INQUIRIES & LEADS */}
        {activeTab === 'inquiries' && (
          <div className="admin-content-area">
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Inbound Client Leads</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Total {inquiries.length} inquiries received
                </div>
              </div>

              <div className="desktop-table-view">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client Name</th>
                      <th>Contact</th>
                      <th>Budget & Timeline</th>
                      <th>Message / Scope</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map(inq => (
                      <tr key={inq.id}>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {new Date(inq.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight: 700 }}>{inq.client_name}</td>
                        <td>
                          <div>{inq.client_email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{inq.client_phone || 'No phone'}</div>
                        </td>
                        <td>
                          <div>{inq.budget_range}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{inq.timeline}</div>
                        </td>
                        <td style={{ maxWidth: '300px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {inq.message}
                        </td>
                        <td>
                          <select 
                            value={inq.status}
                            onChange={e => handleUpdateInquiryStatus(inq.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="PROPOSAL_SENT">PROPOSAL_SENT</option>
                            <option value="WON">WON</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View for Inquiries */}
              <div className="mobile-card-list">
                {inquiries.map(inq => (
                  <div key={inq.id} className="mobile-data-card">
                    <div className="mobile-data-card-header">
                      <div style={{ fontWeight: 800 }}>{inq.client_name}</div>
                      <select 
                        value={inq.status}
                        onChange={e => handleUpdateInquiryStatus(inq.id, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="PROPOSAL_SENT">PROPOSAL_SENT</option>
                        <option value="WON">WON</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {inq.client_email} · {inq.client_phone}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '6px' }}>
                      Budget: {inq.budget_range} · {inq.timeline}
                    </div>

                    <p style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 6 }}>
                      {inq.message}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <a href={`mailto:${inq.client_email}`} className="btn btn-glass btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                        Email Client
                      </a>
                      {inq.client_phone && (
                        <a href={`https://wa.me/${inq.client_phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-accent btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENT GATEWAY SETTINGS */}
        {activeTab === 'settings' && (
          <div className="admin-content-area">
            <form onSubmit={handleSaveSettings} style={{ maxWidth: '800px' }}>
              
              {/* Payment Mode Setting */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
                  Gateway Environment Mode
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  Toggle between interactive test sandbox and live production transactions.
                </p>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="payment_mode"
                      value="sandbox"
                      checked={adminSettings.payment_mode === 'sandbox'}
                      onChange={e => setAdminSettings({ ...adminSettings, payment_mode: e.target.value })}
                    />
                    <span>Interactive Sandbox Mode (Recommended for testing)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="payment_mode"
                      value="production"
                      checked={adminSettings.payment_mode === 'production'}
                      onChange={e => setAdminSettings({ ...adminSettings, payment_mode: e.target.value })}
                    />
                    <span>Live Production Mode</span>
                  </label>
                </div>
              </div>

              {/* Razorpay Credentials */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={20} style={{ color: '#3399cc' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Razorpay Integration</h3>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={adminSettings.razorpay_enabled === 'true'}
                      onChange={e => setAdminSettings({ ...adminSettings, razorpay_enabled: e.target.checked ? 'true' : 'false' })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>Enable Razorpay</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Razorpay Key ID</label>
                  <input 
                    type="text"
                    value={adminSettings.razorpay_key_id || ''}
                    onChange={e => setAdminSettings({ ...adminSettings, razorpay_key_id: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Razorpay Key Secret</label>
                  <input 
                    type="password"
                    value={adminSettings.razorpay_key_secret || ''}
                    onChange={e => setAdminSettings({ ...adminSettings, razorpay_key_secret: e.target.value })}
                  />
                </div>
              </div>

              {/* PhonePe Credentials */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <QrCode size={20} style={{ color: '#a855f7' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>PhonePe Integration</h3>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={adminSettings.phonepe_enabled === 'true'}
                      onChange={e => setAdminSettings({ ...adminSettings, phonepe_enabled: e.target.checked ? 'true' : 'false' })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>Enable PhonePe</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">PhonePe Merchant ID</label>
                  <input 
                    type="text"
                    value={adminSettings.phonepe_merchant_id || ''}
                    onChange={e => setAdminSettings({ ...adminSettings, phonepe_merchant_id: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">PhonePe Salt Key / Secret</label>
                  <input 
                    type="password"
                    value={adminSettings.phonepe_salt_key || ''}
                    onChange={e => setAdminSettings({ ...adminSettings, phonepe_salt_key: e.target.value })}
                  />
                </div>
              </div>

              {/* Paytm Credentials */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Smartphone size={20} style={{ color: '#00b9f5' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Paytm Integration</h3>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={adminSettings.paytm_enabled === 'true'}
                      onChange={e => setAdminSettings({ ...adminSettings, paytm_enabled: e.target.checked ? 'true' : 'false' })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>Enable Paytm</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Paytm Merchant ID (MID)</label>
                  <input 
                    type="text"
                    value={adminSettings.paytm_mid || ''}
                    onChange={e => setAdminSettings({ ...adminSettings, paytm_mid: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Paytm Merchant Key</label>
                  <input 
                    type="password"
                    value={adminSettings.paytm_merchant_key || ''}
                    onChange={e => setAdminSettings({ ...adminSettings, paytm_merchant_key: e.target.value })}
                  />
                </div>
              </div>

              {/* Studio Contact Settings */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>
                  Brand & Contact Settings
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Studio Title</label>
                    <input 
                      type="text"
                      value={adminSettings.site_name || ''}
                      onChange={e => setAdminSettings({ ...adminSettings, site_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Passcode</label>
                    <input 
                      type="text"
                      value={adminSettings.admin_password || ''}
                      onChange={e => setAdminSettings({ ...adminSettings, admin_password: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input 
                      type="email"
                      value={adminSettings.contact_email || ''}
                      onChange={e => setAdminSettings({ ...adminSettings, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp Number</label>
                    <input 
                      type="text"
                      value={adminSettings.whatsapp_number || ''}
                      onChange={e => setAdminSettings({ ...adminSettings, whatsapp_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                <Save size={18} />
                <span>Save All Settings</span>
              </button>
            </form>
          </div>
        )}

      </main>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="checkout-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Order #{selectedOrder.order_number}
              </h3>
              <button onClick={() => setSelectedOrder(null)} style={{ color: '#fff' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Client Name</div>
                  <div style={{ fontWeight: 700 }}>{selectedOrder.client_name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Email</div>
                  <div>{selectedOrder.client_email}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Phone</div>
                  <div>{selectedOrder.client_phone || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Company</div>
                  <div>{selectedOrder.company_name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Gateway</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{selectedOrder.gateway}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Transaction ID</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{selectedOrder.transaction_id}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Amount</div>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--success)' }}>
                    {currencySymbol}{Number(selectedOrder.amount).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Status</div>
                  <div style={{ fontWeight: 700 }}>{selectedOrder.order_status}</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '4px' }}>Project Brief & Scope</div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: 8, fontSize: '0.88rem', lineHeight: 1.5 }}>
                  {selectedOrder.project_brief || 'No special instructions provided.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-glass"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
                {selectedOrder.order_status !== 'COMPLETED' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'COMPLETED')}
                  >
                    <CheckCircle2 size={16} />
                    <span>Mark as Completed</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE EDIT / CREATE MODAL */}
      {editingService && (
        <div className="modal-backdrop" onClick={() => setEditingService(null)}>
          <div className="checkout-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {isNewService ? 'Create Freelance Service' : 'Edit Service Details'}
              </h3>
              <button onClick={() => setEditingService(null)} style={{ color: '#fff' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={e => { e.preventDefault(); handleSaveService(editingService); }}>
                <div className="form-group">
                  <label className="form-label">Service Title</label>
                  <input 
                    type="text" 
                    required 
                    value={editingService.title} 
                    onChange={e => setEditingService({ ...editingService, title: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input 
                      type="text" 
                      required 
                      value={editingService.category} 
                      onChange={e => setEditingService({ ...editingService, category: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Icon Name (Video, Globe, Monitor, Smartphone, Gamepad2, Code)</label>
                    <input 
                      type="text" 
                      required 
                      value={editingService.icon} 
                      onChange={e => setEditingService({ ...editingService, icon: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Starting Price ({currencySymbol})</label>
                    <input 
                      type="number" 
                      required 
                      value={editingService.starting_price} 
                      onChange={e => setEditingService({ ...editingService, starting_price: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Highlight Badge (e.g. Bestseller, Featured)</label>
                    <input 
                      type="text" 
                      value={editingService.badge || ''} 
                      onChange={e => setEditingService({ ...editingService, badge: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Short Description</label>
                  <textarea 
                    rows={2} 
                    required 
                    value={editingService.short_desc} 
                    onChange={e => setEditingService({ ...editingService, short_desc: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tech Stack (comma separated)</label>
                  <input 
                    type="text" 
                    value={Array.isArray(editingService.tech_stack) ? editingService.tech_stack.join(', ') : ''} 
                    onChange={e => setEditingService({ ...editingService, tech_stack: e.target.value.split(',').map(s => s.trim()) })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Key Deliverables (comma separated)</label>
                  <input 
                    type="text" 
                    value={Array.isArray(editingService.deliverables) ? editingService.deliverables.join(', ') : ''} 
                    onChange={e => setEditingService({ ...editingService, deliverables: e.target.value.split(',').map(s => s.trim()) })} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" className="btn btn-glass" onClick={() => setEditingService(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PLAN EDIT / CREATE MODAL */}
      {editingPlan && (
        <div className="modal-backdrop" onClick={() => setEditingPlan(null)}>
          <div className="checkout-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingPlan.id ? 'Edit Plan Tier' : 'Add New Plan Tier'}
              </h3>
              <button onClick={() => setEditingPlan(null)} style={{ color: '#fff' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={e => { e.preventDefault(); handleSavePlan(editingPlan); }}>
                <div className="form-group">
                  <label className="form-label">Plan Tier Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Starter Cut or Growth SaaS"
                    value={editingPlan.name} 
                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Price ({currencySymbol})</label>
                    <input 
                      type="number" 
                      required 
                      value={editingPlan.price} 
                      onChange={e => setEditingPlan({ ...editingPlan, price: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Billing Cycle (e.g. Project, Monthly)</label>
                    <input 
                      type="text" 
                      value={editingPlan.billing_cycle} 
                      onChange={e => setEditingPlan({ ...editingPlan, billing_cycle: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Delivery Timeline (Days)</label>
                    <input 
                      type="number" 
                      value={editingPlan.delivery_days} 
                      onChange={e => setEditingPlan({ ...editingPlan, delivery_days: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Revisions (e.g. 3 Revisions, Unlimited)</label>
                    <input 
                      type="text" 
                      value={editingPlan.revisions} 
                      onChange={e => setEditingPlan({ ...editingPlan, revisions: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Features Included (1 per line)</label>
                  <textarea 
                    rows={4}
                    value={Array.isArray(editingPlan.features) ? editingPlan.features.join('\n') : ''}
                    onChange={e => setEditingPlan({ ...editingPlan, features: e.target.value.split('\n').filter(Boolean) })}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={editingPlan.is_popular === 1}
                      onChange={e => setEditingPlan({ ...editingPlan, is_popular: e.target.checked ? 1 : 0 })}
                    />
                    <span>Highlight as "Most Popular" / Recommended Tier</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-glass" onClick={() => setEditingPlan(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Tier
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM APP NAVIGATION BAR */}
      <nav className="admin-mobile-bottom-bar">
        <button 
          className={`mobile-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </button>

        <button 
          className={`mobile-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Receipt size={20} />
          <span>Orders</span>
        </button>

        <button 
          className={`mobile-nav-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Layers size={20} />
          <span>Services</span>
        </button>

        <button 
          className={`mobile-nav-btn ${activeTab === 'inquiries' ? 'active' : ''}`}
          onClick={() => setActiveTab('inquiries')}
        >
          <Inbox size={20} />
          <span>Inquiries</span>
        </button>

        <button 
          className={`mobile-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </nav>

    </div>
  );
}
