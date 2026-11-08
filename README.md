# Sweety: Blood Glucose Tracker (Node.js + Express + PostgreSQL + React)

Sweety is a clinical blood glucose tracking web application designed for diabetes patients. Patients record up to 4 blood glucose readings a day across designated time slots and review daily, month-to-date, and previous-month summary reports.

---

## Tech Stack & Architecture

- **Backend**: Node.js, Express.js REST API
- **Database**: PostgreSQL (connection pooling via `pg`, strict constraints, indexes)
- **Frontend**: React (Vite), Tailwind CSS, Lucide React SVG icons
- **Security**: Passwords hashed with `bcryptjs` (salt rounds: 10), JWT session authentication
- **Design System**: Clean, responsive surfaces with custom clinical palette:
  - Primary Brand Red: `#CD1C18`
  - Deep Crimson Accent: `#9B1313`
  - Dark Cherry / Burgundy: `#38000A`
  - Soft Coral Tint: `#FFA896`

---

## Features

### 1. Authentication & Security
- Registration with full name, email, and password.
- Secure login with bcrypt password verification and JWT token issuance.
- Complete patient isolation: patients only see and modify their own readings.

### 2. Blood Glucose Logging (Full CRUD)
- Designated 4 time slots:
  1. `Morning (fasting)`
  2. `After breakfast`
  3. `After lunch`
  4. `After dinner`
- Interactive 4-slot progress tracker for the selected date.
- Real-time clinical indicators:
  - Low (&lt;70 mg/dl)
  - In Range (70 to 140 mg/dl)
  - Elevated (&gt;140 mg/dl)

### 3. Strict Validation Rules
All validation errors return HTTP 400 and display directly in the UI:

| Rule | Trigger Condition | Exact Error Message |
| :--- | :--- | :--- |
| Value is required | Empty or whitespace value | `"Please enter a glucose value."` |
| Whole number between 40 and 600 | Non-integer, &lt; 40 or &gt; 600 | `"Value must be between 40 and 600 mg/dl."` |
| Only one reading per slot per day | Slot already recorded for that date | `"You already have an After lunch reading for this date."` |
| Maximum 4 readings per day | 4 readings already exist on that date | `"You can add only 4 readings per day."` |
| Date cannot be in the future | Date is after today's local date | `"Date cannot be in the future."` |

### 4. Clinical Reports
Each report computes: Highest, Lowest, Average (rounded to 1 decimal place), and Total count. When no readings exist, a friendly empty state is rendered.

- **Daily Report**: Aggregates the selected date (e.g. 15 Oct 2026) and lists each individual reading with its slot.
- **Month-to-Date (MTD) Report**: Aggregates readings from the 1st of the month to the selected date (e.g. 1 Oct to 15 Oct 2026).
- **Monthly Report**: Aggregates readings across the whole previous month (e.g. 1 Sep to 30 Sep 2026).

### 5. Bonus Capabilities
- **API Pagination**: `GET /api/readings?page=1&limit=20` with page metadata (`page`, `limit`, `total`, `totalPages`).
- **Date Filtering**: `GET /api/readings?date=YYYY-MM-DD`.

---

## Quick Setup Guide (For Anyone Cloning This Repository)

When someone clones this repository, they need to initialize their local database instance. We have provided a single setup command:

### 1. Clone & Configure Environment
```bash
git clone <repository-url>
cd "sweety - blood glucose tracker"
cp .env.example backend/.env
```

Verify your PostgreSQL credentials in `backend/.env` (default is user `postgres` on port 5432):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sweety_db
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=sweety_db
JWT_SECRET=super_secret_sweety_jwt_key_replace_in_production
JWT_EXPIRES_IN=7d
```

### 2. Run All-In-One Setup
Run this single command to install all dependencies, auto-create the database, apply migrations, and seed sample data:
```bash
npm run setup
```

*(Alternatively, you can run the steps individually: `npm run install:all`, `npm run migrate`, and `npm run seed`).*

**Demo Account Credentials:**
- **Email**: `demo@sweety.app`
- **Password**: `Password123!`

### 3. Start the Application
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

*Note: The backend server also includes automatic database initialization on startup, ensuring that `sweety_db` and tables exist whenever the server starts.*

---

## Notes & Assumptions

### Assumptions
1. **Time Slot Constraints**: The 4 clinical slots (`Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`) represent distinct phases of a patient's metabolic day. Each slot can be recorded at most once per calendar date, capped at 4 total per day.
2. **Future Date Boundary**: The client provides timezone offset information via `x-timezone-offset` headers so the server evaluates "today" using the patient's local calendar day rather than standard UTC midnight.
3. **Previous Month Boundaries**: For the Monthly report, the date range spans from the 1st of the previous month to the final calendar day of that month (correctly handling February leap years and 30/31-day months). If the selected date is in January, the previous month seamlessly resolves to December of the prior calendar year.

### What I Would Improve With More Time
1. **CSV / PDF Clinical Export**: Allow patients to export their monthly summary as a structured PDF report to hand to their endocrinologist during clinical visits.
2. **Automated Reminders**: Push notifications or browser reminders for unlogged daily slots after fasting or dinner.
3. **Target Range Customization**: Allow patients with specific clinical guidelines to customize target ranges (e.g. gestational diabetes targets).
