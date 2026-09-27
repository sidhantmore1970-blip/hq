import React, { useState } from 'react';
import {
  X, CheckCircle, ShieldCheck, CreditCard, QrCode, Smartphone,
  ArrowRight, Lock, Loader2, Sparkles, Download, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Load Razorpay checkout.js lazily
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id  = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutModal({ service, plan, onClose, currencySymbol = '₹' }) {
  const [step, setStep]                 = useState(1); // 1: Info, 2: Gateway UI, 3: Success
  const [gateway, setGateway]           = useState('Razorpay');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');

  // Client details
  const [clientName,    setClientName]    = useState('');
  const [clientEmail,   setClientEmail]   = useState('');
  const [clientPhone,   setClientPhone]   = useState('');
  const [companyName,   setCompanyName]   = useState('');
  const [projectBrief,  setProjectBrief]  = useState('');

  const [orderResult, setOrderResult] = useState(null);

  const price = plan ? plan.price : (service?.starting_price || 9999);

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!clientName || !clientEmail) {
      setErrorMsg('Please enter your name and email to proceed.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  // ─── RAZORPAY REAL PAYMENT ───────────────────────────────────────
  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Load Razorpay checkout.js
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Could not load Razorpay SDK. Check your internet connection.');

      // 2. Create real order on server
      const initRes = await fetch('/api/checkout/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:    service.id,
          plan_id:       plan?.id,
          client_name:   clientName,
          client_email:  clientEmail,
          client_phone:  clientPhone,
          company_name:  companyName,
          project_brief: projectBrief,
          gateway:       'Razorpay'
        })
      });

      const initData = await initRes.json();
      if (!initData.success) throw new Error(initData.error || 'Failed to create order');

      // 3. Open Razorpay popup
      await new Promise((resolve, reject) => {
        const options = {
          key:         initData.key_id,
          amount:      initData.rzp_order.amount,     // paise (already in paise from server)
          currency:    'INR',
          name:        'HQTechHUB Studio',
          description: `${service.title} — ${initData.plan_name}`,
          order_id:    initData.order_id,
          prefill: {
            name:    clientName,
            email:   clientEmail,
            contact: clientPhone
          },
          notes: {
            project_brief: projectBrief,
            company:       companyName
          },
          theme: { color: '#4f46e5' },

          handler: async (response) => {
            // 4. Verify payment signature on server
            try {
              const verifyRes = await fetch('/api/checkout/verify-razorpay', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  order_number:        initData.order_number,
                  client_name:         clientName,
                  client_email:        clientEmail,
                  client_phone:        clientPhone,
                  company_name:        companyName,
                  project_brief:       projectBrief,
                  service_id:          service.id,
                  service_title:       service.title,
                  plan_id:             plan?.id,
                  plan_name:           initData.plan_name,
                  amount:              price
                })
              });

              const verifyData = await verifyRes.json();
              if (!verifyData.success) throw new Error(verifyData.error || 'Signature verification failed');

              setOrderResult({
                orderNumber:   verifyData.order_number,
                transactionId: verifyData.transaction_id,
                amount:        price,
                gateway:       'Razorpay',
                service:       service.title,
                plan:          plan?.name || 'Custom Order'
              });

              setIsProcessing(false);
              setStep(3);

              try {
                confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
              } catch (_) {}

              resolve();
            } catch (err) {
              reject(err);
            }
          },

          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setErrorMsg('Payment was cancelled. You can try again.');
              resolve(); // don't reject; user just closed
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          setIsProcessing(false);
          setErrorMsg(`Payment failed: ${resp.error.description}`);
          resolve();
        });
        rzp.open();
      });

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setErrorMsg(err.message || 'Payment failed. Please try again.');
    }
  };

  // ─── MANUAL UPI FLOW (PhonePe / Paytm) ─────────────────────────
  const handleManualPayment = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const initRes = await fetch('/api/checkout/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:    service.id,
          plan_id:       plan?.id,
          client_name:   clientName,
          client_email:  clientEmail,
          client_phone:  clientPhone,
          company_name:  companyName,
          project_brief: projectBrief,
          gateway
        })
      });

      const initData = await initRes.json();
      if (!initData.success) throw new Error(initData.error || 'Failed to initialize order');

      // Record in DB via the old verify endpoint
      const verifyRes = await fetch('/api/checkout/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id:      initData.order_id,
          order_number:  initData.order_number,
          client_name:   clientName,
          client_email:  clientEmail,
          client_phone:  clientPhone,
          company_name:  companyName,
          project_brief: projectBrief,
          service_id:    service.id,
          service_title: service.title,
          plan_id:       plan?.id,
          plan_name:     plan?.name || 'Custom Plan',
          amount:        price,
          gateway,
          payment_method: paymentMethod,
          transaction_id: initData.transaction_id,
          payment_details: {}
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error(verifyData.error || 'Failed to record payment');

      setOrderResult({
        orderNumber:   verifyData.order_number,
        transactionId: verifyData.transaction_id,
        amount:        price,
        gateway,
        service:       service.title,
        plan:          plan?.name || 'Custom Order'
      });

      setIsProcessing(false);
      setStep(3);
      try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (_) {}

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setErrorMsg(err.message || 'Payment failed. Please try again.');
    }
  };

  const handlePayNow = () => {
    if (gateway === 'Razorpay') {
      handleRazorpayPayment();
    } else {
      handleManualPayment();
    }
  };

  const handleDownloadReceipt = () => {
    const text = `
========================================
HQTechHUB — ORDER CONFIRMATION & INVOICE
========================================
Order Number:    ${orderResult?.orderNumber}
Transaction ID:  ${orderResult?.transactionId}
Date:            ${new Date().toLocaleString()}
Status:          PAID (Verified via ${orderResult?.gateway})

CLIENT DETAILS:
Name:            ${clientName}
Email:           ${clientEmail}
Phone:           ${clientPhone || 'N/A'}
Company:         ${companyName || 'N/A'}

COMMISSION DETAILS:
Service:         ${orderResult?.service}
Plan:            ${orderResult?.plan}
Total Amount:    ${currencySymbol}${Number(orderResult?.amount).toLocaleString()}

PROJECT BRIEF:
${projectBrief || 'Standard service scope.'}

Support: founder@hqtech.dev | +91 98765 43210
========================================
Thank you for choosing HQTechHUB!
    `;
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Invoice_${orderResult?.orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal-content" onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {step === 3 ? 'Order Confirmed!' : 'Secure Commission Checkout'}
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {step === 1 && 'Step 1 of 2: Client & Project Details'}
                {step === 2 && `Step 2 of 2: Complete via ${gateway}`}
                {step === 3 && 'Payment Verified & Recorded'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', padding: '6px', cursor: 'pointer' }} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">

          {/* Order Summary */}
          <div className="order-summary-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-accent" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>{service.category}</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>{service.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Tier: <strong style={{ color: 'var(--accent)' }}>{plan?.name || 'Standard Package'}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  {currencySymbol}{Number(price).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taxes included</div>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px' }}>
              {errorMsg}
            </div>
          )}

          {/* STEP 1: CLIENT DETAILS */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" required placeholder="e.g. John Doe or Studio Brand"
                  value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Work Email *</label>
                  <input type="email" required placeholder="john@example.com"
                    value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone / WhatsApp</label>
                  <input type="tel" placeholder="+91 98765 43210"
                    value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company / Brand (Optional)</label>
                <input type="text" placeholder="e.g. Acme Media Corp"
                  value={companyName} onChange={e => setCompanyName(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Project Brief / Specific Goals</label>
                <textarea rows={3} placeholder="Share footage links, design inspirations, tech constraints, or deadlines..."
                  value={projectBrief} onChange={e => setProjectBrief(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-glass" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <span>Continue to Payment</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: GATEWAY SELECTOR */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Choose Payment Gateway
              </div>

              <div className="gateway-selector-grid">
                <div
                  className={`gateway-option-card ${gateway === 'Razorpay' ? 'selected rzp' : ''}`}
                  onClick={() => { setGateway('Razorpay'); setPaymentMethod('UPI'); }}
                >
                  <CreditCard size={24} style={{ color: '#3399cc', margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Razorpay</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>UPI / Cards / Netbanking</div>
                  {gateway === 'Razorpay' && (
                    <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>✓ Live Checkout</div>
                  )}
                </div>

                <div
                  className={`gateway-option-card ${gateway === 'PhonePe' ? 'selected ppe' : ''}`}
                  onClick={() => { setGateway('PhonePe'); setPaymentMethod('QR'); }}
                >
                  <QrCode size={24} style={{ color: '#a855f7', margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>PhonePe</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>UPI QR Intent</div>
                </div>

                <div
                  className={`gateway-option-card ${gateway === 'Paytm' ? 'selected ptm' : ''}`}
                  onClick={() => { setGateway('Paytm'); setPaymentMethod('Wallet'); }}
                >
                  <Smartphone size={24} style={{ color: '#00b9f5', margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Paytm</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Wallet / Payments Bank</div>
                </div>
              </div>

              {/* Info box per gateway */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                marginBottom: '20px',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                {gateway === 'Razorpay' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#3399cc', fontSize: '1rem' }}>Razorpay</span>
                      <span className="badge badge-accent" style={{ fontSize: '0.62rem' }}>LIVE</span>
                    </div>
                    Clicking <strong>"Pay Now"</strong> will open the official Razorpay checkout window.
                    You can pay via <strong>UPI, Credit/Debit Card, or Netbanking</strong>.
                    The payment is encrypted end-to-end with 256-bit SSL.
                  </div>
                )}
                {gateway === 'PhonePe' && (
                  <div>
                    <div style={{ fontWeight: 700, color: '#a855f7', marginBottom: '6px' }}>PhonePe UPI</div>
                    We will record your order and provide you a UPI link. Open your PhonePe / GPay / BHIM app and scan or click the link.
                    After payment, share the UTR number with us at <strong>founder@hqtech.dev</strong>.
                  </div>
                )}
                {gateway === 'Paytm' && (
                  <div>
                    <div style={{ fontWeight: 700, color: '#00b9f5', marginBottom: '6px' }}>Paytm Wallet / UPI</div>
                    We will register your order. Pay via Paytm Wallet or UPI to our merchant handle and share the transaction ID at <strong>founder@hqtech.dev</strong>.
                  </div>
                )}
              </div>

              {/* Pay Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={isProcessing}
                  onClick={handlePayNow}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Connecting to {gateway}...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Pay {currencySymbol}{Number(price).toLocaleString()} via {gateway}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-glass btn-sm"
                  onClick={() => setStep(1)}
                  disabled={isProcessing}
                >
                  ← Back to Details
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && orderResult && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)', border: '2px solid var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: 'var(--success)'
              }}>
                <Check size={32} />
              </div>

              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
                Commission Initiated Successfully!
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 24px' }}>
                Your payment was processed via <strong>{orderResult.gateway}</strong> and recorded in the HQTech system.
              </p>

              <div style={{
                background: 'var(--bg-surface)', border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'left', marginBottom: '24px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '12px', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Order Number</div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{orderResult.orderNumber}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Payment ID</div>
                    <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', wordBreak: 'break-all' }}>{orderResult.transactionId}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Service</div>
                    <div style={{ fontWeight: 600 }}>{orderResult.service}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Amount Paid</div>
                    <div style={{ fontWeight: 800, color: 'var(--success)' }}>{currencySymbol}{Number(orderResult.amount).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-glass" onClick={handleDownloadReceipt}>
                  <Download size={16} />
                  <span>Download Invoice</span>
                </button>
                <button className="btn btn-primary" onClick={onClose}>
                  <span>Done / Back to Hub</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
