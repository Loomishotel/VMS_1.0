# 🏢 Visitor Management System (VMS 1.0)

[![Live App on Vercel](https://img.shields.io/badge/Vercel-Live--Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vms-1-0.vercel.app)
[![Android Native App](https://img.shields.io/badge/Android-Capacitor%20Native-3DDC84?style=for-the-badge&logo=android&logoColor=white)](./android-app)
[![Supabase Realtime](https://img.shields.io/badge/Supabase-Realtime%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

An enterprise-grade, mobile-optimized **Visitor Management System (VMS)** built with React, Vite, TypeScript, Supabase Realtime, and Capacitor Native Android. Designed for seamless lobby gate security, host notifications, real-time blacklist management, and cross-role approvals.

---

## 🌐 Live Demo & Deployment

* **Live Web Application (Vercel):** [https://vms-1-0.vercel.app](https://vms-1-0-dashboard-ui.vercel.app)
* **GitHub Repository:** [https://github.com/Loomishotel/VMS_1.0.git](https://github.com/Loomishotel/VMS_1.0.git)

---

## ✨ Key Features & Mobile Security Workflows

### 📱 1. Native Mobile-First Security Experience
* **Pull-to-Refresh Gesture:** Native swipe-down pull-to-refresh on mobile queue screens with live touch tracking and animated refresh indicators.
* **Swipe Back Navigation:** Edge-swipe gesture support allowing seamless navigation back through previous screens.
* **Live Camera Access & Switching:** Live photo capture during visitor arrival with front and environment (back) camera toggle.

### 🔔 2. App-Themed Notifications & System Tray Push Alerts
* **Dark-Themed Popup Overlay:** Customized in-app notification card modals with status badges (`Security Alert`, `System Notification`, `Gate Advisory`).
* **Android System Tray Push Notifications:** Integrated `@capacitor/local-notifications` to trigger real high-priority push alerts (`importance: 5`) on Android devices even when the app is running in the background.

### 🛡️ 3. Real-Time Blacklist & Admin Unblock Approval Flow
* **"Notify Host" Action:** When a blacklisted visitor arrives at gate security, security officers can trigger an instant **Notify Host** alert.
* **Host Unblock Request:** Hosts receive instant alerts with a **Request Admin to Unblock** action button.
* **Admin Realtime Decisioning:** Admins receive broadcast requests in real time to **Approve & Unblock** or **Deny Request**, instantly syncing status across Security and Host interfaces via Supabase Realtime channels.

---

## 🛠️ Technology Stack

* **Frontend Dashboard:** React 18, TypeScript, Vite, Lucide Icons, Recharts
* **Mobile Container:** Capacitor 6 Android Native App (`@capacitor/local-notifications`, `@capacitor/android`, `@capacitor/core`)
* **Backend Database & Realtime:** Supabase (PostgreSQL, Row Level Security, Realtime Broadcast Channels)
* **Styling & Design System:** Custom CSS Design Tokens, Glassmorphism Dark Mode, Responsive Mobile Breakpoints
* **Deployment:** Vercel

---

## 🚀 Getting Started & Local Setup

### Workspace Structure
```text
VMS_1.0/
├── apps/
│   └── dashboard-ui/       # Primary React + Vite web dashboard application
├── android-app/            # Native Capacitor Android container
└── package.json            # Monorepo workspace configuration
```

### 1. Installation
```bash
npm install
```

### 2. Run Web App Locally
```bash
npm run dev --workspace=dashboard-ui
```

### 3. Build Production Web Bundle
```bash
npm run build --workspace=dashboard-ui
```

### 4. Sync Web Build to Native Android Container
```bash
cd android-app
npm run android:sync
```

---

## 🔒 Security & RBAC Roles

| Role | Primary Functions |
| :--- | :--- |
| **Admin** | Full system oversight, employee directory management, blacklist review, and final approval for unblock requests. |
| **Security Officer** | Live queue monitoring, visitor check-in/check-out, arrival photo verification, gate alerts, and host notifications. |
| **Host Employee** | Pre-registering visitors, receiving real-time arrival notifications, viewing full-screen visitor photos, and submitting unblock requests. |
| **Visitor** | Kiosk pre-registration and printed pass verification. |

---

## 📄 License
This repository is maintained for Visitor Management System. All rights reserved.
