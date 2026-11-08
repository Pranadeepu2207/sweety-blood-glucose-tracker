const db = require('../config/db');

/**
 * Calculates highest, lowest, average (rounded to 1 decimal), and count
 */
function calculateMetrics(readings) {
  if (!readings || readings.length === 0) {
    return {
      count: 0,
      highest: null,
      lowest: null,
      average: null
    };
  }

  const values = readings.map((r) => r.value);
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = Number((sum / values.length).toFixed(1));

  return {
    count: values.length,
    highest,
    lowest,
    average
  };
}

/**
 * Given a date string 'YYYY-MM-DD', returns the date ranges for:
 * - Daily: selected date
 * - Month-to-date: 1st of month to selected date
 * - Monthly: 1st to last day of previous month
 */
function getReportDateRanges(dateStr) {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const day = parseInt(dayStr, 10);

  // 1. Daily
  const dailyStart = dateStr;
  const dailyEnd = dateStr;

  // 2. Month-to-date (MTD): 1st of month to selected date
  const mtdStart = `${yearStr}-${monthStr}-01`;
  const mtdEnd = dateStr;

  // 3. Monthly (Whole previous month)
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const prevMonthStr = String(prevMonth).padStart(2, '0');
  const prevYearStr = String(prevYear);

  // Days in previous month
  const lastDayOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const monthlyStart = `${prevYearStr}-${prevMonthStr}-01`;
  const monthlyEnd = `${prevYearStr}-${prevMonthStr}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;

  return {
    daily: { startDate: dailyStart, endDate: dailyEnd },
    mtd: { startDate: mtdStart, endDate: mtdEnd },
    monthly: { startDate: monthlyStart, endDate: monthlyEnd }
  };
}

/**
 * GET /api/reports/summary?date=YYYY-MM-DD
 */
async function getReportsSummary(req, res) {
  try {
    const userId = req.user.id;
    let selectedDate = req.query.date;

    if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      // Default to today
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      selectedDate = `${y}-${m}-${d}`;
    }

    const ranges = getReportDateRanges(selectedDate);

    // Slot ordering expression
    const slotOrderSql = `
      CASE slot
        WHEN 'Morning (fasting)' THEN 1
        WHEN 'After breakfast' THEN 2
        WHEN 'After lunch' THEN 3
        WHEN 'After dinner' THEN 4
        ELSE 5
      END
    `;

    // 1. Fetch Daily readings
    const dailyResult = await db.query(
      `SELECT id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY ${slotOrderSql} ASC`,
      [userId, ranges.daily.startDate]
    );

    // 2. Fetch Month-to-date readings
    const mtdResult = await db.query(
      `SELECT value
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
      [userId, ranges.mtd.startDate, ranges.mtd.endDate]
    );

    // 3. Fetch Monthly (whole previous month) readings
    const monthlyResult = await db.query(
      `SELECT value
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
      [userId, ranges.monthly.startDate, ranges.monthly.endDate]
    );

    const dailyMetrics = calculateMetrics(dailyResult.rows);
    const mtdMetrics = calculateMetrics(mtdResult.rows);
    const monthlyMetrics = calculateMetrics(monthlyResult.rows);

    return res.status(200).json({
      selectedDate,
      daily: {
        range: ranges.daily,
        ...dailyMetrics,
        readings: dailyResult.rows
      },
      monthToDate: {
        range: ranges.mtd,
        ...mtdMetrics
      },
      monthly: {
        range: ranges.monthly,
        ...monthlyMetrics
      }
    });
  } catch (err) {
    console.error('Error generating reports:', err);
    return res.status(500).json({ error: 'Failed to generate glucose reports.' });
  }
}

module.exports = {
  getReportsSummary,
  calculateMetrics,
  getReportDateRanges
};

