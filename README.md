 🚚Cargo Booking

HaulGo is a modern cargo and logistics booking platform designed to seamlessly connect customers with drivers. Built with a React frontend and a Node.js/Express backend powered by Supabase, the platform offers real-time order tracking, interactive maps, and dynamic vehicle management.

## 🚀 Features

- **Role-Based Access Control**: Tailored dashboards and features for Customers, Drivers, and Administrators.
- **Interactive Maps**: Real-time pickup and drop-off selection utilizing Leaflet.
- **Dynamic Pricing & Vehicles**: Supports various cargo types and vehicle categories (e.g., Bikes, Mini Trucks, Heavy Freight) with dynamic fare calculation.
- **Secure Backend**: Leveraging Supabase for PostgreSQL database management, authentication, and Row Level Security (RLS).
- **Simultaneous Development**: Easily run both frontend and backend development servers concurrently with a single command.

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 (Vite)
- React Router DOM
- Leaflet (Maps Integration)
- Vanilla CSS / Modern UI Design

**Backend:**
- Node.js & Express.js
- Supabase JS Client (Database & Auth)
- CORS, Helmet & Morgan for security and logging

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16.x or higher recommended)
- A [Supabase](https://supabase.com/) account and project.

### 1. Installation

Clone the repository and install dependencies for both the frontend and backend using the root command:

```bash
# This will install both frontend and backend dependencies
npm run install:all
```

### 2. Supabase Setup

1. Go to your Supabase Dashboard and navigate to the **SQL Editor**.
2. Copy the contents of `supabase_schema.sql` found in the root directory.
3. Paste and run the query to generate all required tables, profiles, roles, and RLS policies.

### 3. Environment Variables

Navigate to the `backend` directory and create an environment file:

```bash
cd backend
cp .env.example .env # Create .env file based on the provided example
```

Update your `backend/.env` file with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=4000
FRONTEND_URL=http://localhost:5173
```
*(Note: Never commit your `.env` file to version control. It is already included in `.gitignore`.)*

---

## 🏃‍♂️ Running the Application

You can start both the frontend and backend development servers simultaneously from the root directory:

```bash
npm run dev
```

Alternatively, you can run them individually:
- **Backend Only**: `npm run dev:backend`
- **Frontend Only**: `npm run dev:frontend`

The application will be accessible at:
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:4000`

---

## 📁 Project Structure

```text
/
├── backend/               # Express API and Supabase Integration
│   ├── src/               # Routes, Middleware, and Services
│   ├── .env               # Backend Environment variables
│   └── package.json
├── frontend/              # React Vite Application
│   ├── src/               # React Components, Pages, and API configs
│   ├── index.html
│   └── package.json
├── supabase_schema.sql    # Database schema, tables, and RLS policies
├── package.json           # Root package file for concurrent commands
└── README.md              # Project documentation
```

---
