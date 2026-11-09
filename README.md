# Sweety - Blood Glucose Tracker

I built Sweety as a clean, full-stack web application for diabetes patients to log daily blood glucose readings and view structured clinical reports. The project is built using Node.js, Express, PostgreSQL, and React (Vite + Tailwind CSS).

---

## What I Built (Features)

### 1. User Authentication & Privacy
- Patients can sign up with their name, email, and password, and log in securely.
- Passwords are encrypted using `bcrypt` (never stored in plain text).
- Authentication uses JSON Web Tokens (JWT).
- Complete data isolation: once logged in, a patient can only see, create, edit, or delete their own readings.

### 2. Blood Glucose Tracking (Full CRUD)
- Patients can log readings across 4 designated daily slots:
  - Morning (fasting)
  - After breakfast
  - After lunch
  - After dinner
- The dashboard includes a daily slot tracker showing at a glance which slots have been recorded and which are still pending.
- Real-time indicator badges help patients see where their reading lands:
  - Low (&lt;70 mg/dl)
  - In Range (70 to 140 mg/dl)
  - Elevated (&gt;140 mg/dl)
- Patients can edit or delete any logged reading with full confirmation dialogs.

### 3. Strict Input Validation
I implemented strict server-side and client-side validation rules that return clear, user-friendly error messages:
- **Value is required**: `"Please enter a glucose value."`
- **Whole number between 40 and 600**: `"Value must be between 40 and 600 mg/dl."`
- **Only one reading per slot per day**: `"You already have an After lunch reading for this date."` (enforced at both application and database constraint levels).
- **Maximum 4 readings per day**: `"You can add only 4 readings per day."`
- **Date cannot be in the future**: `"Date cannot be in the future."`

### 4. Daily & Monthly Reports
Patients can pick any calendar date to view three distinct clinical reports:
- **Daily Report**: Aggregates readings on the selected date and lists each individual reading alongside its slot.
- **Month-to-Date Report**: Calculates aggregated metrics from the 1st of the current month up to the selected date.
- **Monthly Report (Previous Month)**: Aggregates all readings across the entire previous calendar month (handling February leap years and varying month lengths automatically).
- Each report calculates: Highest reading, Lowest reading, Average reading (rounded to 1 decimal place), and Total count of readings.
- Friendly empty states are displayed when no readings exist for the selected period.

### 5. Bonus Feature: API Pagination
- The `GET /api/readings` endpoint supports pagination parameters (`?page=1&limit=20`).
- The dashboard UI includes pagination controls to navigate across large historical datasets easily.

### 6. Clean, Responsive UI
- Styled with a purpose-built color palette:
  - Primary Brand Red: `#CD1C18`
  - Deep Crimson: `#9B1313`
  - Dark Header / Text: `#38000A`
  - Soft Coral Tint: `#FFA896`
- Fully responsive: Desktop and tablet viewports use a full data table, while mobile viewports automatically adapt into clean, touch-friendly card layouts.
- Built with standard rounded corners and clean SVG icons from Lucide.

---

## How to Clone and Run the App (Step-by-Step)

If you are cloning this repository on your computer, follow these steps to get up and running:

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- PostgreSQL installed and running locally

---

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd "sweety - blood glucose tracker"
```

---

### Step 2: Set Up Environment Variables
Copy `.env.example` to create your local `.env` file for the backend:

```bash
cp .env.example backend/.env
```

Open `backend/.env` and verify your PostgreSQL credentials. By default, it connects to local PostgreSQL:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL connection settings:
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sweety_db

# Or individual parameters:
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_postgres_password
PGDATABASE=sweety_db

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

*(Note: `.env` is ignored by Git, so your credentials will stay private on your machine).*

---

### Step 3: Run the Setup Script
To make setting up fast and simple, I created a single setup script:

```bash
npm run setup
```

This single command:
1. Installs all root, backend, and frontend dependencies.
2. Automatically creates the `sweety_db` PostgreSQL database if it does not already exist.
3. Applies all database tables, constraints, and indexes (`npm run migrate`).
4. Seeds the demo patient account with sample readings spanning today, the current month, and the previous month (`npm run seed`).

*If you prefer running the steps individually, you can also run:*
```bash
npm run install:all
npm run migrate
npm run seed
```

---

### Step 4: Start the Development Server
Start both the backend server and the frontend client simultaneously:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## Demo Credentials

You can log in immediately using the pre-seeded demo account:

- **Email**: `demo@sweety.app`
- **Password**: `Password123!`

*(You can also register a brand new patient account from the sign-up page).*

---
