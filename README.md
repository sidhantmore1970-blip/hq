# HQTechHUB — Freelancing Services Showcase & Management Platform

A high-impact, full-stack web application designed for creative and software engineering freelancing services with integrated payment transaction processing via **Razorpay**, **PhonePe**, and **Paytm**, plus a mobile-optimized **Admin Control Panel**.

---

## 🚀 Key Features

### 1. Client-Facing Showcase
- **Core Freelance Disciplines**:
  - 🎬 **Video Editing & Post-Production**: 4K YouTube edits, commercial reels, VFX & sound design.
  - 🌐 **Full-Stack Web Development**: Next.js/React SaaS apps, custom APIs, high-converting landing pages.
  - 🖥️ **Desktop Applications**: High-performance Windows & macOS utilities with Electron/Tauri.
  - 📱 **Cross-Platform Mobile Apps**: Native 60fps iOS & Android applications with React Native.
  - 🎮 **Indie Game Development**: 2D/3D games for Web, Steam & Mobile with Unity & Unreal Engine.
- **Tiered Pricing Matrix**:
  - Interactive plans (Starter, Creator / Pro, Enterprise) with delivery turnaround & revisions guarantee.
- **Portfolio & Case Studies**:
  - Real deliverables showcase with engagement metrics, tags, and client attributions.
- **Direct Lead & Custom Scope Builder**:
  - Inbound consultation form with budget picker and timeline estimation.

### 2. Triple Payment Gateway Integration
- **Razorpay**: UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa/Mastercard), Netbanking.
- **PhonePe**: Dynamic Bharat QR Code generation, UPI Intent simulation, and transaction tracking.
- **Paytm**: Paytm Payments Bank, Paytm Wallet, and Fast Checkout.
- **Dual Environment**: Interactive Sandbox Test Mode & Live Production Mode.
- **Automated Verification**: Generates invoice summaries, assigns unique Order IDs (`HQT-2026-XXXX`), and records directly into SQLite.

### 3. Mobile-First Admin Control Center
- **User Constraint**: *"Make Sure The Admin Pannel Mobile Layout"*
  - **Responsive Mobile Navigation**: Touch drawer + sticky bottom navigation bar (`Stats`, `Orders`, `Services`, `Leads`, `Keys`).
  - **Mobile Card View**: Responsive card list replacing wide tables on mobile devices with 1-click status actions.
- **Operations Dashboard**:
  - Real-time Gross Revenue, Active Orders, Lead count, and Gateway Revenue breakdown.
- **Orders & Transactions Management**:
  - Search by order number, client name, or transaction ID.
  - Gateway and status filters (`NEW`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
  - Order details modal with client contact and project scope brief.
- **Services & Plan Architecture**:
  - Add, edit, or remove services, tech stacks, deliverables, and tiered pricing plans.
- **Gateway & API Credentials**:
  - Configure Razorpay Key ID/Secret, PhonePe Merchant ID/Salt Key, and Paytm MID directly from the UI.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite + Lucide Icons + Modular Vanilla CSS (Dark-Tech design system with tokens)
- **Backend**: Node.js 24 + Express REST API
- **Database**: SQLite (via Node 24 native `node:sqlite` synchronous engine, zero external C++ build issues)
- **Styling**: Dark-Tech theme with `#4f46e5` (Electric Indigo) and `#06b6d4` (Cyan Accent)

---

## ⚡ Quick Start

### 1. Start Backend Server
```powershell
cd server
npm start
# Runs on http://localhost:5000
```

### 2. Start Frontend Dev Server
```powershell
cd client
npm run dev
# Runs on http://localhost:5173
```

---

## 🔑 Admin Credentials
- **Access URL**: Open the site and click **Admin Panel** in the top navigation bar or footer.
- **Default Passcode**: `hqtech2026` (can be changed in Payment & System Settings)
# hq
