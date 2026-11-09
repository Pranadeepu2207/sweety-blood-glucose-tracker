const db = require('../config/db');

const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

// Returns today's date in YYYY-MM-DD format (respecting user timezone offset header)
function getTodayDateString(req) {
  const tzOffset = req.headers['x-timezone-offset'];
  if (tzOffset !== undefined) {
    const offsetMinutes = parseInt(tzOffset, 10);
    if (!isNaN(offsetMinutes)) {
      const clientTime = new Date(Date.now() - offsetMinutes * 60000);
      return clientTime.toISOString().split('T')[0];
    }
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Formats error message with appropriate indefinite article (a/an)
function formatDuplicateSlotMessage(slot) {
  const startsWithVowel = /^[aeiou]/i.test(slot.trim());
  const article = startsWithVowel ? 'an' : 'a';
  return `You already have ${article} ${slot} reading for this date.`;
}

// Validation middleware for creating and updating glucose readings
async function validateReading(req, res, next) {
  const { reading_date, slot, value } = req.body;
  const currentId = req.params.id ? parseInt(req.params.id, 10) : null;
  const userId = req.user.id;

  // Validate date format
  if (!reading_date || !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
    return res.status(400).json({ error: 'Please enter a valid date (YYYY-MM-DD).' });
  }

  // Prevent logging future dates
  const todayStr = getTodayDateString(req);
  if (reading_date > todayStr) {
    return res.status(400).json({ error: 'Date cannot be in the future.' });
  }

  // Validate allowed time slot
  if (!slot || !ALLOWED_SLOTS.includes(slot)) {
    return res.status(400).json({
      error: `Please select a valid time slot (${ALLOWED_SLOTS.join(', ')}).`
    });
  }

  // Check required value
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return res.status(400).json({ error: 'Please enter a glucose value.' });
  }

  // Value must be integer between 40 and 600
  const numericVal = Number(value);
  if (!Number.isInteger(numericVal) || numericVal < 40 || numericVal > 600) {
    return res.status(400).json({ error: 'Value must be between 40 and 600 mg/dl.' });
  }

  req.body.parsedValue = numericVal;

  try {
    // Check user's existing records on this date
    const countQuery = 'SELECT id, slot FROM readings WHERE user_id = $1 AND reading_date = $2';
    const existing = await db.query(countQuery, [userId, reading_date]);

    // Exclude the current reading when editing
    const otherReadingsOnDate = existing.rows.filter((r) => r.id !== currentId);

    // Enforce one reading per slot per day
    const slotConflict = otherReadingsOnDate.find((r) => r.slot === slot);
    if (slotConflict) {
      return res.status(400).json({ error: formatDuplicateSlotMessage(slot) });
    }

    // Limit to maximum 4 readings per day
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
