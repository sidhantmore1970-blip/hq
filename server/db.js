import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'hqtech.db');

export const db = new DatabaseSync(dbPath);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      short_desc TEXT,
      full_desc TEXT,
      icon TEXT NOT NULL,
      badge TEXT,
      tech_stack TEXT, -- JSON array
      deliverables TEXT, -- JSON array
      starting_price REAL DEFAULT 0,
      featured INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_plans (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      billing_cycle TEXT DEFAULT 'Project',
      delivery_days INTEGER DEFAULT 7,
      revisions TEXT DEFAULT '3 Revisions',
      features TEXT, -- JSON array
      is_popular INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio_items (
      id TEXT PRIMARY KEY,
      service_id TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      client_name TEXT,
      summary TEXT,
      metrics TEXT,
      tags TEXT, -- JSON array
      image_gradient TEXT,
      demo_link TEXT,
      featured INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders_transactions (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT,
      company_name TEXT,
      project_brief TEXT,
      service_id TEXT NOT NULL,
      service_title TEXT NOT NULL,
      plan_id TEXT,
      plan_name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      gateway TEXT NOT NULL, -- Razorpay, PhonePe, Paytm
      payment_method TEXT DEFAULT 'UPI', -- UPI, Card, Netbanking, QR, Wallet
      transaction_id TEXT NOT NULL,
      status TEXT DEFAULT 'SUCCESS', -- SUCCESS, PENDING, FAILED, REFUNDED
      order_status TEXT DEFAULT 'IN_PROGRESS', -- NEW, IN_PROGRESS, IN_REVIEW, COMPLETED, CANCELLED
      payment_details TEXT, -- JSON string
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT,
      service_id TEXT,
      budget_range TEXT,
      timeline TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'NEW', -- NEW, CONTACTED, PROPOSAL_SENT, WON, CLOSED
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default settings if not exists
  const existingSettings = db.prepare('SELECT count(*) as count FROM settings').get();
  if (existingSettings.count === 0) {
    const defaultSettings = [
      ['site_name', 'HQTech Studio & Solutions'],
      ['site_tagline', 'High-Impact Digital Engineering & Freelancing Services'],
      ['admin_password', 'hqtech2026'],
      ['payment_mode', 'sandbox'], // 'sandbox' | 'production'
      ['currency_symbol', '₹'],
      ['currency_code', 'INR'],
      ['contact_email', 'founder@hqtech.dev'],
      ['contact_phone', '+91 98765 43210'],
      ['whatsapp_number', '+919876543210'],
      ['razorpay_enabled', 'true'],
      ['razorpay_key_id', 'rzp_test_hqtech_98412a'],
      ['razorpay_key_secret', 'rzp_sec_live_948194'],
      ['phonepe_enabled', 'true'],
      ['phonepe_merchant_id', 'PHONEPE_MERC_HQTECH'],
      ['phonepe_salt_key', 'ppe_salt_key_841029140'],
      ['paytm_enabled', 'true'],
      ['paytm_mid', 'PAYTM_MID_HQTECH_9148'],
      ['paytm_merchant_key', 'ptm_key_test_9041285'],
      ['social_youtube', 'https://youtube.com/@HQTechStudio'],
      ['social_instagram', 'https://instagram.com/hqtech.studio'],
      ['social_github', 'https://github.com/hqtech'],
      ['social_twitter', 'https://x.com/hqtech'],
      ['social_linkedin', 'https://linkedin.com/company/hqtech'],
      ['social_discord', 'https://discord.gg/hqtech']
    ];

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of defaultSettings) {
      insertSetting.run(k, v);
    }
  } else {
    // Ensure any newly added settings exist
    const socialDefaults = [
      ['social_youtube', 'https://youtube.com/@HQTechStudio'],
      ['social_instagram', 'https://instagram.com/hqtech.studio'],
      ['social_github', 'https://github.com/hqtech'],
      ['social_twitter', 'https://x.com/hqtech'],
      ['social_linkedin', 'https://linkedin.com/company/hqtech'],
      ['social_discord', 'https://discord.gg/hqtech']
    ];
    const checkStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const insertStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of socialDefaults) {
      if (!checkStmt.get(k)) {
        insertStmt.run(k, v);
      }
    }
  }

  // Seed default services if empty
  const existingServices = db.prepare('SELECT count(*) as count FROM services').get();
  if (existingServices.count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  const services = [
    {
      id: 'srv-video-editing',
      title: 'Cinematic Video Editing & Post-Production',
      category: 'Video Editing',
      short_desc: '4K High-retention YouTube videos, commercial reels, podcasts, sound design & dynamic After Effects motion graphics.',
      full_desc: 'Professional post-production pipeline built for creators, brands, and agencies. We transform raw footage into captivating visual narratives with frame-perfect pacing, color grading, sound design, and viral retention hooks.',
      icon: 'Video',
      badge: 'Bestseller',
      tech_stack: JSON.stringify(['Premiere Pro', 'After Effects', 'DaVinci Resolve Studio', 'Blender 3D', 'Izotope RX']),
      deliverables: JSON.stringify(['4K 60FPS Masters', 'Social Cuts (9:16 & 1:1)', 'Multi-track Audio Mix', 'Source Project Files', 'Subtitles & Captions']),
      starting_price: 3499,
      featured: 1,
      order_index: 1
    },
    {
      id: 'srv-web-dev',
      title: 'Full-Stack Web Development & SaaS Apps',
      category: 'Web Development',
      short_desc: 'Ultra-fast Next.js / React web applications, custom SaaS dashboards, responsive landing pages, and API integrations.',
      full_desc: 'End-to-end web engineering engineered for performance, SEO, and conversions. From MVP dashboards to high-scale enterprise platforms, we craft sleek, interactive experiences with bulletproof architecture.',
      icon: 'Globe',
      badge: 'Featured',
      tech_stack: JSON.stringify(['React', 'Next.js', 'Node.js', 'TypeScript', 'Tailwind/CSS', 'PostgreSQL', 'SQLite', 'Docker']),
      deliverables: JSON.stringify(['Clean Source Code', 'Responsive UI for All Devices', 'REST/GraphQL APIs', 'Deployment & CI/CD Setup', 'SEO Optimization']),
      starting_price: 9999,
      featured: 1,
      order_index: 2
    },
    {
      id: 'srv-desktop-app',
      title: 'High-Performance Desktop Applications',
      category: 'Desktop Apps',
      short_desc: 'Native and cross-platform desktop software for Windows, macOS, and Linux built for speed, offline reliability, and utility.',
      full_desc: 'Robust desktop applications built with Electron, Tauri, and C++/.NET. Ideal for internal enterprise tools, media managers, hardware monitors, trading terminals, and batch automation utilities.',
      icon: 'Monitor',
      badge: 'Enterprise',
      tech_stack: JSON.stringify(['Electron', 'Tauri', 'Rust', 'C# / .NET', 'Node.js', 'SQLite', 'Native APIs']),
      deliverables: JSON.stringify(['Signed Installers (.exe, .dmg, .deb)', 'Auto-update Pipeline', 'Low Memory Footprint', 'Offline Local Storage', 'Full Documentation']),
      starting_price: 14999,
      featured: 1,
      order_index: 3
    },
    {
      id: 'srv-mobile-app',
      title: 'Cross-Platform Mobile Apps (iOS & Android)',
      category: 'Mobile Apps',
      short_desc: 'Fluid, high-performance mobile applications with native animations, push notifications, offline sync, and payment integrations.',
      full_desc: 'We engineer intuitive mobile apps for smartphones and tablets using React Native and Flutter. Fast startup times, 60fps gesture animations, biometric authentication, and seamless store submission support.',
      icon: 'Smartphone',
      badge: 'Popular',
      tech_stack: JSON.stringify(['React Native', 'Flutter', 'Expo', 'Swift', 'Kotlin', 'Firebase', 'Supabase']),
      deliverables: JSON.stringify(['App Store & Play Store Builds', 'Biometrics & Push Notifications', 'Payment SDK Integrations', 'Offline Sync Engine', 'Admin Backend API']),
      starting_price: 19999,
      featured: 1,
      order_index: 4
    },
    {
      id: 'srv-game-dev',
      title: 'Indie Game Development & 3D Interactive',
      category: 'Game Development',
      short_desc: 'Engaging 2D/3D games for PC, Mobile, and Web using Unity and Unreal Engine with physics, multiplayer, and custom shaders.',
      full_desc: 'From concept to polished game release. We develop hypercasual mobile games, 2D indie pixel platformers, 3D action titles, web interactive games, and VR simulations with sound effects and custom particle effects.',
      icon: 'Gamepad2',
      badge: 'Trending',
      tech_stack: JSON.stringify(['Unity 3D', 'Unreal Engine 5', 'C#', 'C++', 'Blender', 'FMOD Audio', 'Photon Engine']),
      deliverables: JSON.stringify(['Playable Game Builds (PC/Web/Mobile)', 'Custom Shaders & Mechanics', 'Game Design Document', 'Audio & Particle Assets', 'Steam / Play Store Ready']),
      starting_price: 24999,
      featured: 1,
      order_index: 5
    }
  ];

  const insertService = db.prepare(`
    INSERT INTO services (id, title, category, short_desc, full_desc, icon, badge, tech_stack, deliverables, starting_price, featured, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of services) {
    insertService.run(s.id, s.title, s.category, s.short_desc, s.full_desc, s.icon, s.badge, s.tech_stack, s.deliverables, s.starting_price, s.featured, s.order_index);
  }

  // Seed plans for each service
  const plans = [
    // Video Editing Plans
    {
      id: 'plan-ve-basic',
      service_id: 'srv-video-editing',
      name: 'Starter Cut (Short-Form / Reels)',
      price: 3499,
      currency: 'INR',
      billing_cycle: 'Per Video',
      delivery_days: 2,
      revisions: '2 Revisions',
      features: JSON.stringify([
        'Up to 90 seconds edited video',
        'Dynamic viral hook & captions',
        'Sound effects & royalty-free music',
        'Color correction & framing for 9:16',
        '1080p / 4K export'
      ]),
      is_popular: 0
    },
    {
      id: 'plan-ve-pro',
      service_id: 'srv-video-editing',
      name: 'Creator Pro (Long-Form / YouTube)',
      price: 7999,
      currency: 'INR',
      billing_cycle: 'Per Video',
      delivery_days: 4,
      revisions: 'Unlimited Revisions',
      features: JSON.stringify([
        'Up to 15 minutes long-form YouTube edit',
        'Custom After Effects motion graphics',
        'Multi-camera syncing & b-roll insertion',
        'High-end color grading (DaVinci LUTs)',
        '3 Viral Shorts/Reels extracted included',
        'Click-optimized YouTube thumbnail'
      ]),
      is_popular: 1
    },
    {
      id: 'plan-ve-ent',
      service_id: 'srv-video-editing',
      name: 'Brand Commercial & VFX Studio',
      price: 18999,
      currency: 'INR',
      billing_cycle: 'Per Campaign',
      delivery_days: 7,
      revisions: 'Priority Unlimited',
      features: JSON.stringify([
        'Full 4K Cinematic Commercial / Promo video',
        '3D motion design & VFX compositing',
        'Dolby Atmos / 5.1 spatial sound mastering',
        'Storyboarding & creative direction consultation',
        'Full raw source project archive delivery',
        'Expedited 48h emergency turnarounds available'
      ]),
      is_popular: 0
    },

    // Web Dev Plans
    {
      id: 'plan-wd-basic',
      service_id: 'srv-web-dev',
      name: 'Landing Page & Launchpad',
      price: 9999,
      currency: 'INR',
      billing_cycle: 'One-Time',
      delivery_days: 5,
      revisions: '3 Revisions',
      features: JSON.stringify([
        'High-converting 1-page modern landing site',
        'Dark-Tech or custom tailored aesthetics',
        'Mobile responsive & lightning fast (95+ score)',
        'Contact & lead capture form with email alerts',
        'Free deployment setup on Vercel / Netlify'
      ]),
      is_popular: 0
    },
    {
      id: 'plan-wd-pro',
      service_id: 'srv-web-dev',
      name: 'Full Web App & MVP SaaS',
      price: 24999,
      currency: 'INR',
      billing_cycle: 'Project',
      delivery_days: 14,
      revisions: 'Unlimited during build',
      features: JSON.stringify([
        'Multi-page full-stack app (React/Node.js)',
        'User authentication & Role-based dashboard',
        'Database setup (SQLite / PostgreSQL)',
        'Payment gateway integration (Razorpay/PhonePe)',
        'Admin panel for content & user management',
        '30 days free post-launch support'
      ]),
      is_popular: 1
    },
    {
      id: 'plan-wd-ent',
      service_id: 'srv-web-dev',
      name: 'Enterprise Custom Architecture',
      price: 59999,
      currency: 'INR',
      billing_cycle: 'Custom',
      delivery_days: 28,
      revisions: 'Full Dedicated Scope',
      features: JSON.stringify([
        'Microservices or high-throughput API backend',
        'Custom interactive 3D / canvas UI elements',
        'Multi-tenant architecture & RBAC permissions',
        'Real-time WebSockets & event streaming',
        'Automated CI/CD testing & Dockerized deployment',
        '6 months maintenance & SLA guarantee'
      ]),
      is_popular: 0
    },

    // Desktop App Plans
    {
      id: 'plan-da-basic',
      service_id: 'srv-desktop-app',
      name: 'Utility & Automation Tool',
      price: 14999,
      currency: 'INR',
      billing_cycle: 'One-Time',
      delivery_days: 7,
      revisions: '2 Revisions',
      features: JSON.stringify([
        'Single OS target (Windows or macOS)',
        'File converter, batch processor, or scrapers',
        'Clean system tray integration',
        'Local SQLite data persistence',
        'Portable standalone executable'
      ]),
      is_popular: 0
    },
    {
      id: 'plan-da-pro',
      service_id: 'srv-desktop-app',
      name: 'Cross-Platform Native Suite',
      price: 32999,
      currency: 'INR',
      billing_cycle: 'Project',
      delivery_days: 18,
      revisions: 'Unlimited Revisions',
      features: JSON.stringify([
        'Cross-platform builds (Windows, macOS, Linux)',
        'High-speed Tauri / Electron framework',
        'Offline-first with cloud data synchronizer',
        'Hardware acceleration & dark-tech UI',
        'Automated in-app updater pipeline',
        'Code signing guidance & installer packages'
      ]),
      is_popular: 1
    },
    {
      id: 'plan-da-ent',
      service_id: 'srv-desktop-app',
      name: 'Enterprise Client Suite',
      price: 69999,
      currency: 'INR',
      billing_cycle: 'Enterprise',
      delivery_days: 35,
      revisions: 'Dedicated Sprint',
      features: JSON.stringify([
        'High-frequency data visualization & charting',
        'Native OS hardware driver / serial port hooks',
        'Encrypted local vault & enterprise SSO',
        'Automated crash reporting & analytics',
        'Dedicated SLA & custom enterprise installer'
      ]),
      is_popular: 0
    },

    // Mobile App Plans
    {
      id: 'plan-ma-basic',
      service_id: 'srv-mobile-app',
      name: 'Mobile MVP Starter',
      price: 19999,
      currency: 'INR',
      billing_cycle: 'Project',
      delivery_days: 12,
      revisions: '3 Revisions',
      features: JSON.stringify([
        'React Native / Expo mobile app (iOS & Android)',
        'Up to 6 core screens with modern UI',
        'User login, signup & profile setup',
        'API integration with your existing backend',
        'Ready for TestFlight & Play Internal testing'
      ]),
      is_popular: 0
    },
    {
      id: 'plan-ma-pro',
      service_id: 'srv-mobile-app',
      name: 'Full Production App',
      price: 44999,
      currency: 'INR',
      billing_cycle: 'Project',
      delivery_days: 21,
      revisions: 'Unlimited Revisions',
      features: JSON.stringify([
        'Native performance with 60 FPS animations',
        'Push notifications (OneSignal / FCM)',
        'Payment gateways (Razorpay, In-App purchases)',
        'Camera, GPS, Media & Biometric permissions',
        'Store submission assistance (App Store & Play Store)',
        '60 days bug fix guarantee'
      ]),
      is_popular: 1
    },
    {
      id: 'plan-ma-ent',
      service_id: 'srv-mobile-app',
      name: 'Scale & FinTech Grade Mobile App',
      price: 89999,
      currency: 'INR',
      billing_cycle: 'Enterprise',
      delivery_days: 45,
      revisions: 'Full Dedicated Team',
      features: JSON.stringify([
        'Complex real-time messaging / audio-video calls',
        'End-to-end encryption & FinTech security compliance',
        'Offline background sync queue',
        'Deep linking, analytics & conversion funnels',
        'Comprehensive automated testing suite'
      ]),
      is_popular: 0
    },

    // Game Development Plans
    {
      id: 'plan-gd-basic',
      service_id: 'srv-game-dev',
      name: '2D Hypercasual / Web Game',
      price: 24999,
      currency: 'INR',
      billing_cycle: 'Project',
      delivery_days: 14,
      revisions: '3 Revisions',
      features: JSON.stringify([
        'Addictive 2D mechanic (Platformer, Runner, Puzzle)',
        'Playable in Web browser (WebGL) & Android APK',
        'Engaging SFX, music & particle explosions',
        'Leaderboard & score tracking',
        'Complete Unity / Godot source code'
      ]),
      is_popular: 0
    },
    {
      id: 'plan-gd-pro',
      service_id: 'srv-game-dev',
      name: '3D Action / Indie Prototype',
      price: 54999,
      currency: 'INR',
      billing_cycle: 'Project',
      delivery_days: 30,
      revisions: 'Milestone-based',
      features: JSON.stringify([
        'Full 3D character controller, animations & combat',
        'Custom environment, lighting & shader art',
        'Inventory, quests, and game save system',
        'Gamepad / Controller support + Key remapping',
        'Optimized for Steam PC and Console specs',
        'Steamworks integration (Achievements & Cloud)'
      ]),
      is_popular: 1
    },
    {
      id: 'plan-gd-ent',
      service_id: 'srv-game-dev',
      name: 'Full Commercial Game & Multiplayer',
      price: 119999,
      currency: 'INR',
      billing_cycle: 'Production',
      delivery_days: 60,
      revisions: 'Full Lifecycle',
      features: JSON.stringify([
        'Multiplayer networking (P2P or Dedicated Server)',
        'High-fidelity Unreal Engine 5 or Unity HDRP visuals',
        'Cinematic cutscenes, voice acting sync & sound mix',
        'Monetization setup (Battle pass, skins, in-game store)',
        'Full publishing support and Steam store page setup'
      ]),
      is_popular: 0
    }
  ];

  const insertPlan = db.prepare(`
    INSERT INTO service_plans (id, service_id, name, price, currency, billing_cycle, delivery_days, revisions, features, is_popular, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of plans) {
    insertPlan.run(p.id, p.service_id, p.name, p.price, p.currency, p.billing_cycle, p.delivery_days, p.revisions, p.features, p.is_popular, 1);
  }

  // Seed Portfolio projects
  const portfolio = [
    {
      id: 'port-1',
      service_id: 'srv-video-editing',
      title: 'Apex Legends Masterclass Montage',
      category: 'Video Editing',
      client_name: 'VortexGaming (650k Subs)',
      summary: 'High-octane gaming montage featuring 3D camera tracking, sync beats, 3D title intros and color grading.',
      metrics: '1.2M Views · +42k Subscribers',
      tags: JSON.stringify(['Premiere Pro', 'After Effects', '3D Tracking', 'Sound FX']),
      image_gradient: 'linear-gradient(135deg, #3b0764, #1e1b4b)',
      demo_link: 'https://youtube.com',
      featured: 1
    },
    {
      id: 'port-2',
      service_id: 'srv-web-dev',
      title: 'OmniTrade Crypto & Forex Terminal',
      category: 'Web Development',
      client_name: 'OmniFin Global',
      summary: 'High-frequency trading analytics dashboard with TradingView charts, instant trade execution, and dark-tech HUD.',
      metrics: '$4.2M Daily Vol · <80ms Latency',
      tags: JSON.stringify(['Next.js', 'WebSockets', 'Tailwind', 'Node.js']),
      image_gradient: 'linear-gradient(135deg, #064e3b, #0f172a)',
      demo_link: 'https://github.com',
      featured: 1
    },
    {
      id: 'port-3',
      service_id: 'srv-desktop-app',
      title: 'NeuroRender Batch Media Transcoder',
      category: 'Desktop Apps',
      client_name: 'StudioX Studios',
      summary: 'GPU-accelerated desktop video transcoder and AI upscaling utility for Windows and macOS.',
      metrics: '15,000+ Active Users · 4.9★',
      tags: JSON.stringify(['Tauri', 'Rust', 'FFmpeg', 'C++']),
      image_gradient: 'linear-gradient(135deg, #172554, #0f172a)',
      demo_link: 'https://github.com',
      featured: 1
    },
    {
      id: 'port-4',
      service_id: 'srv-mobile-app',
      title: 'PulseFit Real-time AI Workout Coach',
      category: 'Mobile Apps',
      client_name: 'Pulse Technologies',
      summary: 'Computer vision camera mobile app that counts reps, corrects form in real-time, and logs biometric progress.',
      metrics: '50k+ Downloads · 4.8★ App Store',
      tags: JSON.stringify(['React Native', 'TensorFlow Lite', 'Node.js']),
      image_gradient: 'linear-gradient(135deg, #701a75, #1e1b4b)',
      demo_link: 'https://apple.com',
      featured: 1
    },
    {
      id: 'port-5',
      service_id: 'srv-game-dev',
      title: 'CyberVanguard: Roguelike Extraction',
      category: 'Game Development',
      client_name: 'Indie Spark Interactive',
      summary: 'Fast-paced top-down cyberpunk shooter with procedurally generated labs, boss battles, and synthwave soundtrack.',
      metrics: 'Very Positive on Steam · 22k Units',
      tags: JSON.stringify(['Unity 3D', 'C#', 'Procedural Gen', 'FMOD']),
      image_gradient: 'linear-gradient(135deg, #4c0519, #0f172a)',
      demo_link: 'https://steampowered.com',
      featured: 1
    }
  ];

  const insertPort = db.prepare(`
    INSERT INTO portfolio_items (id, service_id, title, category, client_name, summary, metrics, tags, image_gradient, demo_link, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of portfolio) {
    insertPort.run(item.id, item.service_id, item.title, item.category, item.client_name, item.summary, item.metrics, item.tags, item.image_gradient, item.demo_link, item.featured);
  }

  // Seed sample transactions so Admin Panel has immediate rich data
  const sampleTransactions = [
    {
      id: 'txn-101',
      order_number: 'HQT-2026-9041',
      client_name: 'Aarav Sharma',
      client_email: 'aarav.sharma@techgrowth.in',
      client_phone: '+91 98230 11223',
      company_name: 'TechGrowth Media',
      project_brief: 'Need 10 YouTube short-form videos edited with captions, sound effects, and retention cuts.',
      service_id: 'srv-video-editing',
      service_title: 'Cinematic Video Editing & Post-Production',
      plan_id: 'plan-ve-pro',
      plan_name: 'Creator Pro (Long-Form / YouTube)',
      amount: 7999,
      currency: 'INR',
      gateway: 'Razorpay',
      payment_method: 'UPI',
      transaction_id: 'pay_rzp_test_84019284',
      status: 'SUCCESS',
      order_status: 'IN_PROGRESS',
      payment_details: JSON.stringify({ rzp_payment_id: 'pay_rzp_test_84019284', vpa: 'aarav@okaxis', method: 'upi' })
    },
    {
      id: 'txn-102',
      order_number: 'HQT-2026-9042',
      client_name: 'Rohan Mehta',
      client_email: 'rohan@finflow.co',
      client_phone: '+91 97112 33445',
      company_name: 'FinFlow SaaS',
      project_brief: 'Full-stack MVP SaaS build with React, Node.js and Razorpay billing.',
      service_id: 'srv-web-dev',
      service_title: 'Full-Stack Web Development & SaaS Apps',
      plan_id: 'plan-wd-pro',
      plan_name: 'Full Web App & MVP SaaS',
      amount: 24999,
      currency: 'INR',
      gateway: 'PhonePe',
      payment_method: 'UPI Intent',
      transaction_id: 'TXN_PPE_901847120',
      status: 'SUCCESS',
      order_status: 'IN_PROGRESS',
      payment_details: JSON.stringify({ ppe_txn: 'TXN_PPE_901847120', bank_ref_no: '30491823901' })
    },
    {
      id: 'txn-103',
      order_number: 'HQT-2026-9043',
      client_name: 'Devika Patel',
      client_email: 'devika@pixelforge.gg',
      client_phone: '+91 99881 77665',
      company_name: 'PixelForge Games',
      project_brief: '2D indie mobile puzzle game development with 30 levels and sound integration.',
      service_id: 'srv-game-dev',
      service_title: 'Indie Game Development & 3D Interactive',
      plan_id: 'plan-gd-basic',
      plan_name: '2D Hypercasual / Web Game',
      amount: 24999,
      currency: 'INR',
      gateway: 'Paytm',
      payment_method: 'Paytm Wallet',
      transaction_id: 'PTM_9318491029',
      status: 'SUCCESS',
      order_status: 'NEW',
      payment_details: JSON.stringify({ ptm_order_id: 'PTM_9318491029', bank: 'PAYTM_PAYMENTS_BANK' })
    },
    {
      id: 'txn-104',
      order_number: 'HQT-2026-9044',
      client_name: 'Vikramaditya Rao',
      client_email: 'vikram@quantlab.io',
      client_phone: '+91 96540 88990',
      company_name: 'QuantLab Systems',
      project_brief: 'Windows and macOS desktop app for real-time sensor logs and hardware telemetry.',
      service_id: 'srv-desktop-app',
      service_title: 'High-Performance Desktop Applications',
      plan_id: 'plan-da-pro',
      plan_name: 'Cross-Platform Native Suite',
      amount: 32999,
      currency: 'INR',
      gateway: 'Razorpay',
      payment_method: 'Netbanking (HDFC)',
      transaction_id: 'pay_rzp_test_10948194',
      status: 'SUCCESS',
      order_status: 'COMPLETED',
      payment_details: JSON.stringify({ rzp_payment_id: 'pay_rzp_test_10948194', bank: 'HDFC' })
    }
  ];

  const insertTxn = db.prepare(`
    INSERT INTO orders_transactions (id, order_number, client_name, client_email, client_phone, company_name, project_brief, service_id, service_title, plan_id, plan_name, amount, currency, gateway, payment_method, transaction_id, status, order_status, payment_details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of sampleTransactions) {
    insertTxn.run(t.id, t.order_number, t.client_name, t.client_email, t.client_phone, t.company_name, t.project_brief, t.service_id, t.service_title, t.plan_id, t.plan_name, t.amount, t.currency, t.gateway, t.payment_method, t.transaction_id, t.status, t.order_status, t.payment_details);
  }

  // Seed sample inquiries
  const sampleInquiries = [
    {
      id: 'inq-1',
      client_name: 'Siddharth Roy',
      client_email: 'siddharth@nexusecom.com',
      client_phone: '+91 99100 22334',
      service_id: 'srv-web-dev',
      budget_range: '₹50,000 - ₹1,00,000',
      timeline: '3 - 4 Weeks',
      message: 'Looking to rebuild our marketplace store with custom checkout, Razorpay automated refunds, and inventory sync.',
      status: 'NEW'
    },
    {
      id: 'inq-2',
      client_name: 'Neha Kapoor',
      client_email: 'neha@vloghub.tv',
      client_phone: '+91 98711 44556',
      service_id: 'srv-video-editing',
      budget_range: '₹20,000 - ₹40,000',
      timeline: 'Immediate / Ongoing',
      message: 'Need a monthly retainer editor for 8 podcast episodes and 20 Instagram reels per month.',
      status: 'CONTACTED'
    }
  ];

  const insertInq = db.prepare(`
    INSERT INTO inquiries (id, client_name, client_email, client_phone, service_id, budget_range, timeline, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const inq of sampleInquiries) {
    insertInq.run(inq.id, inq.client_name, inq.client_email, inq.client_phone, inq.service_id, inq.budget_range, inq.timeline, inq.message, inq.status);
  }
}
