-- Sweety Database Schema for PostgreSQL

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'patient', -- 'patient' or 'doctor'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create readings table
CREATE TABLE IF NOT EXISTS readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot VARCHAR(50) NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 40 AND value <= 600),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_user_date_slot UNIQUE (user_id, reading_date, slot)
);

-- Doctor-Patient Assignment Table (Bonus Feature)
CREATE TABLE IF NOT EXISTS doctor_patients (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_doctor_patient UNIQUE (doctor_id, patient_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, reading_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_doc ON doctor_patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_pat ON doctor_patients(patient_id);
