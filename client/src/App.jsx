import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import PricingSection from './components/PricingSection';
import PortfolioSection from './components/PortfolioSection';
import InquirySection from './components/InquirySection';
import Footer from './components/Footer';
import CheckoutModal from './components/CheckoutModal';
import AdminDashboard from './components/admin/AdminDashboard';
import './App.css';

export default function App() {
  // Check URL hash for admin view
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') return 'admin';
    }
    return 'client';
  });

  // Listen for hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      setActiveView(hash === '#admin' ? 'admin' : 'client');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [settings, setSettings] = useState({
    currency_symbol: '₹',
    payment_mode: 'sandbox'
  });
  const [activeCategory, setActiveCategory] = useState('All');

  // Checkout Modal State
  const [checkoutModal, setCheckoutModal] = useState({
    isOpen: false,
    service: null,
    plan: null
  });

  // Fetch public data on mount
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.error('Error fetching services:', err));

    fetch('/api/portfolio')
      .then(res => res.json())
      .then(data => setPortfolio(data))
      .catch(err => console.error('Error fetching portfolio:', err));

    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error fetching public settings:', err));
  }, []);

  const handleOpenCheckout = (service, plan) => {
    setCheckoutModal({ isOpen: true, service, plan });
  };

  const handleCloseCheckout = () => {
    setCheckoutModal({ isOpen: false, service: null, plan: null });
  };

  // Filter services by category
  const filteredServices = activeCategory === 'All'
    ? services
    : services.filter(s => s.category.toLowerCase() === activeCategory.toLowerCase());

  // ─── Admin View ─────────────────────────────────────────────────
  if (activeView === 'admin') {
    return (
      <AdminDashboard
        onExitAdmin={() => {
          window.location.hash = '';
          setActiveView('client');
        }}
        currencySymbol={settings.currency_symbol || '₹'}
      />
    );
  }

  // ─── Client View ────────────────────────────────────────────────
  return (
    <div className="app-wrapper">
      <Navbar settings={settings} />

      <Hero
        onExploreServices={() => {
          const el = document.getElementById('services');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('services');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        activeCategory={activeCategory}
      />

      <ServicesSection
        services={filteredServices.length > 0 ? filteredServices : services}
        onSelectPlan={handleOpenCheckout}
        currencySymbol={settings.currency_symbol || '₹'}
      />

      <PricingSection
        services={services}
        onSelectPlan={handleOpenCheckout}
        currencySymbol={settings.currency_symbol || '₹'}
      />

      <PortfolioSection portfolio={portfolio} />

      <InquirySection services={services} />

      <Footer
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('services');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {checkoutModal.isOpen && checkoutModal.service && (
        <CheckoutModal
          service={checkoutModal.service}
          plan={checkoutModal.plan}
          onClose={handleCloseCheckout}
          currencySymbol={settings.currency_symbol || '₹'}
        />
      )}
    </div>
  );
}
