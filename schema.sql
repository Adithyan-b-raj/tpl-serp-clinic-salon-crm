-- Clinic, Dental & Salon Token Queue & Appointment CRM Schema
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS practitioners;

CREATE TABLE practitioners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  room_no TEXT NOT NULL,
  status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, BUSY, ON_BREAK
  avg_consult_min INTEGER DEFAULT 15,
  avatar_url TEXT
);

CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  token_no TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id),
  service_name TEXT NOT NULL,
  slot_time TEXT NOT NULL,
  token_status TEXT DEFAULT 'WAITING', -- WAITING, SERVING, COMPLETED, NO_SHOW
  notes TEXT,
  called_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
  id TEXT PRIMARY KEY,
  appointment_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_age INTEGER,
  patient_gender TEXT,
  doctor_name TEXT,
  department TEXT,
  room_no TEXT,
  diagnosis TEXT NOT NULL,
  vitals_bp TEXT,
  vitals_pulse TEXT,
  vitals_weight TEXT,
  vitals_temp TEXT,
  vitals_spo2 TEXT,
  medicines_json TEXT NOT NULL, -- JSON array: [{name, dosage, freq, days, instructions}]
  doctor_advice TEXT,
  follow_up TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_status ON appointments(token_status);
CREATE INDEX idx_appointments_practitioner ON appointments(practitioner_id);
CREATE INDEX idx_prescriptions_phone ON prescriptions(patient_phone);
