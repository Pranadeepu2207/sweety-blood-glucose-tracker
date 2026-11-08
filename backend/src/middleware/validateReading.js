const db = require('../config/db');

const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

/**
 * Helper to get today's date in YYYY-MM-DD format.
 * Checks client timezone offset header if sent, otherwise uses local server date.
 */
function getTodayDateString(req) {
  const tzOffset = req.headers['x-timezone-offset'];
  if (tzOffset !== undefined) {
    const offsetMinutes = parseInt(tzOffset, 10);
    if (!isNaN(offsetMinutes)) {
      const clientTime = new Date(Date.now() - offsetMinutes * 60000);
      return clientTime.toISOString().split('T')[0];
    }
  }
  // Fallback to local machine date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats the slot duplicate error message
 * Example: "You already have an After lunch reading for this date."
 */
function formatDuplicateSlotMessage(slot) {
  const startsWithVowel = /^[aeiou]/i.test(slot.trim());
  const article = startsWithVowel ? 'an' : 'a';
  return `You already have ${article} ${slot} reading for this date.`;
}

/**
 * Validates reading fields and business rules.
 */
async function validateReading(req, res, next) {
  const { reading_date, slot, value } = req.body;
  const currentId = req.params.id ? parseInt(req.params.id, 10) : null;
  const userId = req.user.id;

  // 1. Date presence & validity
  if (!reading_date || !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
    return res.status(400).json({ error: 'Please enter a valid date (YYYY-MM-DD).' });
  }

  // 2. Rule: "Date cannot be in the future"
  const todayStr = getTodayDateString(req);
  if (reading_date > todayStr) {
    return res.status(400).json({ error: 'Date cannot be in the future.' });
  }

  // 3. Slot validation
  if (!slot || !ALLOWED_SLOTS.includes(slot)) {
    return res.status(400).json({
      error: `Please select a valid time slot (${ALLOWED_SLOTS.join(', ')}).`
    });
  }

  // 4. Rule: "Value is required"
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return res.status(400).json({ error: 'Please enter a glucose value.' });
  }

  // 5. Rule: "Value must be a whole number between 40 and 600"
  const numericVal = Number(value);
  if (!Number.isInteger(numericVal) || numericVal < 40 || numericVal > 600) {
    return res.status(400).json({ error: 'Value must be between 40 and 600 mg/dl.' });
  }

  // Store normalized parsed value
  req.body.parsedValue = numericVal;

  try {
    // Database rules:
    // Check existing readings on this date for the user
    let countQuery = 'SELECT id, slot FROM readings WHERE user_id = $1 AND reading_date = $2';
    const queryParams = [userId, reading_date];
    const existing = await db.query(countQuery, queryParams);

    const otherReadingsOnDate = existing.rows.filter((r) => r.id !== currentId);

    // Rule: "Only one reading per slot per day"
    const slotConflict = otherReadingsOnDate.find((r) => r.slot === slot);
    if (slotConflict) {
      return res.status(400).json({ error: formatDuplicateSlotMessage(slot) });
    }

    // Rule: "Maximum 4 readings per day"
    if (otherReadingsOnDate.length >= 4) {
      return res.status(400).json({ error: 'You can add only 4 readings per day.' });
    }

    next();
  } catch (err) {
    console.error('Validation DB error:', err);
    return res.status(500).json({ error: 'Failed to validate reading.' });
  }
}

module.exports = {
  validateReading,
  ALLOWED_SLOTS,
  formatDuplicateSlotMessage,
  getTodayDateString
};

