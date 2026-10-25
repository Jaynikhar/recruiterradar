# RecruiterRadar 🎯 | Recruiter Outreach & Intelligence CRM

A high-performance **MERN** (MongoDB, Express.js, React, Node.js) web application designed for active job seekers, engineers, and outreach specialists to systematically track, organize, and manage recruiter connections.

Built to import recruiter spreadsheets (Excel `.xlsx`, `.xls`, and `.csv`) with strict **Role-Based Access Control (`role = 'owner'`)**, render recruiter profile cards with **direct clickable social icons only**, toggle connection/message progress, maintain **persistent notes across page refreshes**, and provide fast multi-criteria sorting and filtering.

---

## ✨ Features

- 🔒 **Authentication & Role Authorization**:
  - Full JWT authentication (Register, Login, Session validation, Logout).
  - Two distinct roles:
    - **`owner`**: Can upload new Excel/CSV sheets, bulk-clear records, trigger database reseeding, and manage all outreach data.
    - **`user` (Member)**: Can view all recruiter intelligence cards, toggle requested/messaged checkboxes, and write custom status notes.
  - Optional **Owner Passkey** during registration (default: `admin123`).
  - Pre-configured 1-click Demo logins on the sign-in page.

- 📊 **Excel / Spreadsheet Management (Owner Only)**:
  - Drag-and-drop or file upload for `.xlsx`, `.xls`, and `.csv` files.
  - Intelligent header normalizer mapping columns automatically (e.g. `Linkd. Request` -> `requested`, `Company Niche` -> `niche`, `Location` -> `location`, etc.).
  - Append mode or full Replace mode.
  - Built-in one-click restore/seed button for the provided Google Spreadsheet (1,837+ recruiters).

- 📇 **Tactile Recruiter Cards**:
  - **Recruiter Profile**: Full Name, Job Title / Designation, Company Name, Location (City, Country), Industry Niche.
  - **Recruiter Social Media**: Displayed as **clean direct clickable icons only** (LinkedIn profile).
  - **Company Social Media**: Direct clickable icons for Company Website (`Globe`), Company LinkedIn, Company Twitter/X, and Company Social (`Facebook`).
  - **Interactive Checkboxes**: "Requested" and "Messaged" toggles with instant optimistic UI and MongoDB persistence.
  - **Auto-Saving Status & Notes**: Custom text area for follow-up notes, interview dates, or custom remarks. Auto-saves to MongoDB with inline visual indicators (`Saving...` / `Saved`). All notes persist on page reload.

- ⚡ **Multi-Criteria Sorting & Live Filtering**:
  - **Sort by**:
    - Location / City (A-Z, Z-A)
    - Company Name (A-Z, Z-A)
    - Recruiter Name (A-Z, Z-A)
    - Requested Status (Requested first or unrequested first)
    - Messaged Status (Messaged first or unmessaged first)
    - Recently Updated
  - **Filter by**:
    - Outreach Status (All, Requested Yes/Pending, Messaged Yes/Pending, Both Completed)
    - City / Location (dynamic dropdown)
    - Industry Niche (dynamic dropdown)
  - **Search**: Debounced real-time search across Name, Company, Title, Location, and Notes.

- 🎨 **Anti-Vibe-Coded Design**:
  - Refined slate & indigo palette, crisp typography (`Plus Jakarta Sans`), subtle micro-borders, clean status pills, and high accessibility. No cheap neon gradients or illegible glass blobs.

---

## 🗂️ Project Structure

```
recruiter-stalker/
├── package.json               # Root scripts for running server & client
├── README.md                  # Complete documentation
├── server/                    # Backend API (Node.js + Express + Mongoose)
│   ├── .env                   # Configuration (PORT, MONGODB_URI, JWT_SECRET, OWNER_SECRET_KEY)
│   ├── package.json
│   └── src/
│       ├── index.js           # Server entry point & MongoDB connection
│       ├── models/
│       │   ├── User.js        # User model with role (owner / user)
│       │   └── Recruiter.js   # Recruiter schema with text indexing
│       ├── middleware/
│       │   └── auth.js        # JWT verification & requireOwner guard
│       ├── controllers/
│       │   ├── authController.js       # Register, Login, Me handlers
│       │   └── recruiterController.js  # CRUD, filtering, sorting, upload
│       ├── routes/
│       │   ├── authRoutes.js
│       │   └── recruiterRoutes.js
│       ├── utils/
│       │   └── excelParser.js # Normalizes spreadsheet headers & data
│       ├── scripts/
│       │   └── seed.js        # Populates 1,837+ recruiters & demo accounts
│       └── data/
│           └── recruiters.csv # Clean extraction of user's Google Sheet
└── client/                    # Frontend SPA (React 18 + Vite + Tailwind CSS)
    ├── package.json
    ├── vite.config.js         # Proxy to http://localhost:5000
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx            # Dynamic Auth / Dashboard router
        ├── index.css          # Base typography & card styling
        ├── context/
        │   └── AuthContext.jsx# Authentication & role state management
        ├── services/
        │   └── api.js         # Axios client with JWT interceptor
        ├── pages/
        │   ├── AuthPage.jsx   # Tabbed sign-in/register with 1-click demo logins
        │   └── Dashboard.jsx  # Main outreach board, grid, pagination
        └── components/
            ├── Navbar.jsx           # Header with role badge & Excel modal trigger
            ├── StatsBar.jsx         # Outreach KPI metrics & progress bars
            ├── FilterControls.jsx   # Search, multi-field sort & filter dropdowns
            ├── RecruiterCard.jsx    # Card with social icons & auto-save notes
            └── ExcelUploadModal.jsx # Owner-only drag-and-drop file uploader
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas connection string in `server/.env`)

### 1. Install Dependencies
```bash
# In the root directory:
npm run install:all
```
*(Or navigate to `server/` and run `npm install`, then `client/` and run `npm install`)*

### 2. Seed Database with Attached Spreadsheet Data
To populate the database with the **1,837 recruiters from your attached Google Sheet** and create default demo accounts:
```bash
npm run seed
```

### 3. Start the Servers
You can run the backend and frontend in separate terminals:

**Terminal 1 (Backend Server):**
```bash
cd server
npm start
# Server runs on: http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend runs on: http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Owner** | `owner@example.com` | `admin123` | Can upload Excel/CSV sheets, bulk reload data, and track recruiters |
| **Member** | `hunter@example.com` | `hunter123` | Can view cards, toggle checkboxes, and write persistent notes |

> **Note on Registering New Owners**:
> When registering a new account, select the **Owner** card and input the **Owner Passkey** (`admin123`). If left as Member, the user will be registered with role `user`.

---

## 📑 Supported Spreadsheet Columns

When uploading Excel (`.xlsx`, `.xls`) or `.csv` files via the Owner panel, the parser automatically identifies and handles any of the following column headers (case-insensitive):

- `Name` / `Full Name` / `Recruiter`
- `Job Title` / `Title` / `Role` / `Designation`
- `Linkedin URL` / `LinkedIn` / `Profile`
- `Company Name` / `Company` / `Organization`
- `Linkd. Request` / `Requested` / `Request Sent`
- `Message` / `Messaged` / `InMail`
- `Applied for Internship/Job` / `Applied`
- `Company Website` / `Website`
- `Company Linkedin` / `Company LinkedIn URL`
- `Company Social` / `Facebook`
- `Company Twitter` / `Twitter` / `X`
- `Location` / `City`
- `Company Niche` / `Niche` / `Industry`
- `Status` / `Notes` / `Remarks`
