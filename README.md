# CareGrid — Integrated Healthcare Operations Platform

CareGrid is a full-stack healthcare management system that handles doctors, patients, and appointments through a role-based interface. It integrates Razorpay for payment collection, Gemini AI for symptom-to-specialist routing, and nodemailer for automated email notifications.

---

## Features

### Role-based Access Control
Three distinct roles — Admin, Doctor, and Patient — each with a dedicated dashboard and protected routes.

### Admin
- Register and remove doctors
- View all appointments across the system
- Live statistics dashboard (total doctors, patients, appointments, pending counts)

### Doctor
- View and manage incoming appointment requests (approve / cancel)
- Write clinical prescriptions for approved appointments (marks appointment as completed)
- View profile and appointment statistics

### Patient
- Browse available doctors with specialization and fee details
- AI Symptom Checker — describe symptoms and get routed to the right specialist using Gemini AI
- Book appointments with Razorpay payment integration
- Cancel pending appointments
- View and download prescriptions as PDF (jsPDF)

### Email Notifications
Patients receive automated emails when a doctor approves or cancels their appointment.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Backend | Node.js, Express 5 |
| Database | MySQL (mysql2) |
| Authentication | Session-based via localStorage (role stored server-side) |
| Payments | Razorpay (test mode) |
| AI Routing | Google Gemini 2.5 Flash API |
| Email | Nodemailer (Gmail SMTP) |
| PDF Generation | jsPDF |

---

## Project Structure

```
CareGrid/
├── hms-backend/          # Express API server
│   ├── server.js         # All routes and business logic
│   ├── .env              # Local credentials (not committed)
│   └── .env.example      # Template for environment setup
│
├── hms-frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── pages/        # AdminDashboard, DoctorDashboard, DoctorsList, Login
│   │   ├── components/   # Sidebar, DoctorCard, BookingModal, ProtectedRoute
│   │   └── services/     # api.js (Axios client)
│   ├── .env              # Local env vars (not committed)
│   └── .env.example      # Template for environment setup
│
└── Hospital management system.sql   # Complete database schema with seed data
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8+
- A Razorpay test account ([dashboard.razorpay.com](https://dashboard.razorpay.com))
- A Gmail account with an App Password enabled
- A Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com))

---

### 1. Database Setup

Import the SQL file into MySQL:

```bash
mysql -u root -p < "Hospital management system.sql"
```

This creates the `Hospital_HMS` database with all tables, indexes, views, stored procedures, triggers, and seed data.

**Default demo accounts** (from seed data):

| Role | Email | Password |
|---|---|---|
| Admin | admin@hms.com | admin123 |
| Doctor | ramesh@hms.com | doc123 |
| Patient | rahul@hms.com | pat123 |

> **Security note:** Passwords are stored as plaintext in this version. Production deployments must implement bcrypt hashing.

---

### 2. Backend Setup

```bash
cd hms-backend
npm install
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=Hospital_HMS
PORT=5000

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

GEMINI_API_KEY=your_gemini_api_key

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Start the server:

```bash
npm start
```

The API will be available at `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd hms-frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

Start the dev server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Security Notes

- **Never commit `.env` files.** Both `.gitignore` files are configured to exclude them.
- **Plaintext passwords:** This project stores passwords without hashing. This is a known limitation. Before deploying to any public environment, implement `bcrypt` for password hashing in the registration and login routes.
- **Razorpay `key_id`** is a publishable key (client-facing by Razorpay's design). The `key_secret` is backend-only and is never exposed to the browser.
- **AI routing** sends symptom descriptions to the Gemini API. Do not send sensitive patient data in the symptom field.

---

## Database Design Highlights

- **4 tables:** `users`, `doctors`, `appointments`, `prescriptions`
- **Audit log table** (`appointment_audit_log`) with a trigger that logs every appointment status change
- **7 indexes** for query performance
- **4 views** for common reporting queries (`vw_appointments_full`, `vw_doctor_stats`, `vw_patient_history`, `vw_todays_appointments`)
- **4 stored procedures** for booking, doctor creation, dashboard data, and auto-completion of past appointments
- **3 triggers** for audit logging, past-date booking prevention, and timestamp management

---

## Known Limitations & Future Improvements

- Passwords are stored as plaintext — needs bcrypt
- No JWT or server-side session management; auth state is stored in localStorage
- Self-registration is restricted to patients only; doctors must be added by admin
- No pagination on appointment lists
- Single-prescription-per-appointment constraint not enforced at DB level
- Razorpay is in test mode; go-live requires KYC approval with Razorpay
