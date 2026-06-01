# Manshu Finance & Invoice Management System

A production-ready, SaaS-grade **MERN Stack Invoice & Finance Management Web Application** designed for modern businesses. Built with high-fidelity components, custom visual templates, and robust financial engines.

---

## Technical Stack

*   **Frontend**: React.js + Vite + Tailwind CSS
*   **Backend**: Node.js + Express.js
*   **Database**: MongoDB (Mongoose ODM)
*   **State Management**: Redux Toolkit
*   **Real-time Alerts**: Socket.io
*   **PDF Compiler**: PDFKit
*   **Email System**: Nodemailer
*   **Spreadsheet Exporter**: XLSX (SheetJS)
*   **Charts & Visualizations**: Recharts

---

## Key Features

1.  **SaaS Finance Dashboard**: Top cards (Total Revenue, Pending, Expenses, Profit Margin %) with interactive Recharts trends (Line, Bar, Area, and Donut charts).
2.  **Modular Invoices**: Live preview templates (Classic, Modern, Corporate, Minimal) featuring automated GST (Taxes), Discount rates, and TDS deductions.
3.  **Client Portal**: Secure, unauthenticated public view for client bill downloads, timeline tracking, and simulation of online checkouts.
4.  **Client Directories**: CRUD, lifetime revenue aggregates, outstanding balances, and historical timeline logs.
5.  **Operating Expenditures**: Category logs (Salaries, Marketing, Software, Office, Travel, Utilities, Other) with receipt attachments.
6.  **Admin User Management**: Super Admin controls to toggle user status (Active/Deactivated) and promote/demote roles.
7.  **System Audit logs**: Compliance tracking for deletions, edits, record creations, and login sessions.
8.  **Nodemailer Direct Emailing**: Renders clean transaction emails and compiles invoice PDFs to send to clients as attachments.
9.  **Spreadsheet Exports**: Generates downloadable Excel (.xlsx) and CSV reports for Revenue, Expenses, Taxes, and Outstanding Accounts.
10. **Database Maintenance**: Super Admin controls to download full database backups and restore from backup files.

---

## Project Structure

```text
Invoice_System/
├── server/                    # Node.js Express Backend
│   ├── config/                # DB Connection Settings
│   ├── controllers/           # REST API Business Logic
│   ├── middleware/            # Security (Helmet, Limiter) and Auth (RBAC)
│   ├── models/                # MongoDB Database Schemas
│   ├── routes/                # Express API Enrouters
│   ├── services/              # PDF Compiler, Emailer, Sockets
│   ├── utils/                 # Finance Math Calculations
│   ├── uploads/               # Receipt attachments storage
│   ├── .env                   # Local Configuration Settings
│   ├── server.js              # Entry File
│   └── package.json           # Dependencies & Scripts
│
├── client/                    # React Vite Frontend
│   ├── src/
│   │   ├── components/        # ThemeToggler, NotificationDropdown, Templates
│   │   ├── layouts/           # Dashboard Shell Sidebar/Navbar Layout
│   │   ├── pages/             # Auth, Dashboard, Invoices, Clients, Expenses
│   │   ├── redux/             # Redux Store and Auth Slices
│   │   ├── routes/            # React Router and Auth route guards
│   │   ├── services/          # API Axios Client instance with interceptors
│   │   ├── index.css          # Tailwind Directives & custom scrollbars
│   │   ├── main.jsx           # App Bootstrap
│   │   └── App.jsx            # Redux & Router Binder
│   ├── vite.config.js         # Proxy configurations
│   ├── tailwind.config.js     # Dark Mode and theme palettes
│   ├── postcss.config.js      # PostCSS parsers
│   └── package.json           # Dependencies & Scripts
│
└── README.md                  # Setup Instructions
```

---

## Setup & Running Instructions

### Prerequisites
Make sure you have Node.js (v18+) and MongoDB installed on your system.

### 1. Database & Server Configuration
1.  Navigate into the `server/` directory:
    ```bash
    cd server
    ```
2.  Create your `.env` configuration file (already pre-created with local defaults):
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/manshu_finance
    JWT_SECRET=manshu_finance_secret_jwt_access_2026_key_99
    JWT_REFRESH_SECRET=manshu_finance_secret_jwt_refresh_2026_key_88
    CLIENT_URL=http://localhost:5173
    ```
3.  Install backend dependencies:
    ```bash
    npm install
    ```
4.  Start the Express Backend server:
    ```bash
    npm start
    ```
    *(For development mode with live reloading, run `npm run dev` after installing `nodemon` globally).*

### 2. Frontend Configuration
1.  Open a new terminal session and navigate to the `client/` directory:
    ```bash
    cd client
    ```
2.  Install frontend dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite React client dev server:
    ```bash
    npm run dev
    ```
4.  Vite will launch the local client at `http://localhost:5173`. 
    *(All requests to `/api` are automatically proxied to the backend port `5000` via `vite.config.js`).*

---

## Getting Started

1.  Open the application at `http://localhost:5173/register` to register the first account. **The first user registered is automatically assigned the role of Super Admin**.
2.  Proceed to `Settings` to input your company details, tax registration numbers, and bank account information.
3.  Proceed to `Clients` to add contact profiles.
4.  Draft a new invoice in the `Invoices` ledger, toggle themes, download PDFs, or simulate client checkout payments.
