const db = require('../config/db');
const { calculateMetrics, getReportDateRanges } = require('./reportController');

/**
 * Middleware/helper to ensure user is a doctor
 */
function checkDoctorRole(req, res) {
  if (req.user.role !== 'doctor') {
    res.status(403).json({ error: 'Access denied. Doctor account required.' });
    return false;
  }
  return true;
}

/**
 * Get all patients assigned to the authenticated doctor
 * GET /api/doctor/patients
 */
async function getAssignedPatients(req, res) {
  if (!checkDoctorRole(req, res)) return;

  try {
    const doctorId = req.user.id;

    const query = `
      SELECT u.id, u.name, u.email, u.created_at,
             COUNT(r.id)::int AS total_readings,
             MAX(r.reading_date) AS latest_reading_date
      FROM doctor_patients dp
      JOIN users u ON dp.patient_id = u.id
      LEFT JOIN readings r ON u.id = r.user_id
      WHERE dp.doctor_id = $1
      GROUP BY u.id, u.name, u.email, u.created_at
      ORDER BY u.name ASC
    `;

    const result = await db.query(query, [doctorId]);
    return res.status(200).json({ patients: result.rows });
  } catch (err) {
    console.error('Error fetching assigned patients:', err);
    return res.status(500).json({ error: 'Failed to retrieve assigned patients.' });
  }
}

/**
 * View reports for an assigned patient
 * GET /api/doctor/patients/:patientId/reports?date=YYYY-MM-DD
 */
async function getPatientReports(req, res) {
  if (!checkDoctorRole(req, res)) return;

  try {
    const doctorId = req.user.id;
    const patientId = parseInt(req.params.patientId, 10);

    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID.' });
    }

    // Verify patient is assigned to this doctor
    const verifyResult = await db.query(
      `SELECT u.id, u.name, u.email
       FROM doctor_patients dp
       JOIN users u ON dp.patient_id = u.id
       WHERE dp.doctor_id = $1 AND dp.patient_id = $2`,
      [doctorId, patientId]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Access denied. Patient is not assigned to your account.'
      });
    }

    const patient = verifyResult.rows[0];

    // Selected date
    let selectedDate = req.query.date;
    if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      selectedDate = `${y}-${m}-${d}`;
    }

    const ranges = getReportDateRanges(selectedDate);

    const slotOrderSql = `
      CASE slot
        WHEN 'Morning (fasting)' THEN 1
        WHEN 'After breakfast' THEN 2
        WHEN 'After lunch' THEN 3
        WHEN 'After dinner' THEN 4
        ELSE 5
      END
    `;

    // 1. Daily
    const dailyResult = await db.query(
      `SELECT id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY ${slotOrderSql} ASC`,
      [patientId, ranges.daily.startDate]
    );

    // 2. Month-to-date
    const mtdResult = await db.query(
      `SELECT value
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
      [patientId, ranges.mtd.startDate, ranges.mtd.endDate]
    );

    // 3. Monthly (whole previous month)
    const monthlyResult = await db.query(
      `SELECT value
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
      [patientId, ranges.monthly.startDate, ranges.monthly.endDate]
    );

    return res.status(200).json({
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email
      },
      selectedDate,
      daily: {
        range: ranges.daily,
        ...calculateMetrics(dailyResult.rows),
        readings: dailyResult.rows
      },
      monthToDate: {
        range: ranges.mtd,
        ...calculateMetrics(mtdResult.rows)
      },
      monthly: {
        range: ranges.monthly,
        ...calculateMetrics(monthlyResult.rows)
      }
    });
  } catch (err) {
    console.error('Error fetching patient reports for doctor:', err);
    return res.status(500).json({ error: 'Failed to retrieve patient reports.' });
  }
}

module.exports = {
  getAssignedPatients,
  getPatientReports
};
