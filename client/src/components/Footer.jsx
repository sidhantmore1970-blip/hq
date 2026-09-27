import React from 'react';
import { Terminal } from 'lucide-react';

export default function Footer({ onSelectCategory }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div className="brand-icon" style={{ width: 34, height: 34 }}>
              <Terminal size={18} />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              HQTech<span className="text-cyan">HUB</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '320px', marginBottom: '16px' }}>
            Full-spectrum freelancing studio engineering cinematic video post-production,
            cutting-edge web applications, desktop software, mobile platforms, and indie games.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-accent">Razorpay Verified</span>
            <span className="badge badge-primary">PhonePe Merchant</span>
            <span className="badge badge-accent">Paytm Verified</span>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>Services</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <a href="#services" onClick={() => onSelectCategory('Video Editing')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseOver={e => e.target.style.color='var(--primary)'} onMouseOut={e => e.target.style.color=''}>Video Editing</a>
            <a href="#services" onClick={() => onSelectCategory('Web Development')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseOver={e => e.target.style.color='var(--primary)'} onMouseOut={e => e.target.style.color=''}>Web Development</a>
            <a href="#services" onClick={() => onSelectCategory('Desktop Apps')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseOver={e => e.target.style.color='var(--primary)'} onMouseOut={e => e.target.style.color=''}>Desktop Apps</a>
            <a href="#services" onClick={() => onSelectCategory('Mobile Apps')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseOver={e => e.target.style.color='var(--primary)'} onMouseOut={e => e.target.style.color=''}>Mobile Apps</a>
            <a href="#services" onClick={() => onSelectCategory('Game Development')} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseOver={e => e.target.style.color='var(--primary)'} onMouseOut={e => e.target.style.color=''}>Indie Games</a>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>Security &amp; Payments</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Razorpay Gateway</span>
            <span>PhonePe Bharat QR</span>
            <span>Paytm Wallet &amp; UPI</span>
            <span>Milestone Release</span>
            <span>Invoice Generation</span>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>Direct Operations</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Email: founder@hqtech.dev</span>
            <span>WhatsApp: +91 98765 43210</span>
            <span>Location: Bangalore / Mumbai (Remote)</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          © {new Date().getFullYear()} HQTech Studio. All rights reserved. Built with React, Node.js &amp; SQLite.
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>Terms of Commission</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>Refund Guarantee</span>
        </div>
      </div>
    </footer>
  );
}
