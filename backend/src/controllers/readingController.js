const db = require('../config/db');

/**
 * List readings for current user with optional pagination and date filter.
 * GET /api/readings?page=1&limit=20&date=YYYY-MM-DD
 */
async function getReadings(req, res) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const dateFilter = req.query.date;

    const queryParams = [userId];
    let whereClause = 'WHERE user_id = $1';

    if (dateFilter && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
      queryParams.push(dateFilter);
      whereClause += ` AND reading_date = $${queryParams.length}`;
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM readings ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit) || 1;

    // Slot ordering expression for intuitive daily chronological ordering
    const slotOrderSql = `
      CASE slot
        WHEN 'Morning (fasting)' THEN 1
        WHEN 'After breakfast' THEN 2
        WHEN 'After lunch' THEN 3
        WHEN 'After dinner' THEN 4
        ELSE 5
      END
    `;

    // Fetch paginated readings
    const dataParams = [...queryParams, limit, offset];
    const dataResult = await db.query(
      `SELECT id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at
       FROM readings
       ${whereClause}
       ORDER BY reading_date DESC, ${slotOrderSql} ASC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    return res.status(200).json({
      readings: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching readings:', err);
    return res.status(500).json({ error: 'Failed to retrieve readings.' });
  }
}

/**
 * Get a single reading by ID
 * GET /api/readings/:id
 */
async function getReadingById(req, res) {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    if (isNaN(readingId)) {
      return res.status(400).json({ error: 'Invalid reading ID.' });
    }

    const result = await db.query(
      `SELECT id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [readingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    return res.status(200).json({ reading: result.rows[0] });
  } catch (err) {
    console.error('Error fetching reading by id:', err);
    return res.status(500).json({ error: 'Failed to retrieve reading.' });
  }
}

/**
 * Create a new blood glucose reading
 * POST /api/readings
 */
async function createReading(req, res) {
  try {
    const userId = req.user.id;
    const { reading_date, slot, parsedValue } = req.body;

    const insertResult = await db.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at`,
      [userId, reading_date, slot, parsedValue]
    );

    return res.status(201).json({
      message: 'Reading logged successfully.',
      reading: insertResult.rows[0]
    });
  } catch (err) {
    console.error('Error creating reading:', err);
    if (err.code === '23505') {
      // Postgres unique constraint violation fallback
      const startsWithVowel = /^[aeiou]/i.test(req.body.slot.trim());
      const article = startsWithVowel ? 'an' : 'a';
      return res.status(400).json({
        error: `You already have ${article} ${req.body.slot} reading for this date.`
      });
    }
    return res.status(500).json({ error: 'Failed to log reading.' });
  }
}

/**
 * Update an existing reading
 * PUT /api/readings/:id
 */
async function updateReading(req, res) {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);
    const { reading_date, slot, parsedValue } = req.body;

    if (isNaN(readingId)) {
      return res.status(400).json({ error: 'Invalid reading ID.' });
    }

    // Verify reading belongs to user
    const checkResult = await db.query(
      'SELECT id FROM readings WHERE id = $1 AND user_id = $2',
      [readingId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const updateResult = await db.query(
      `UPDATE readings
       SET reading_date = $1, slot = $2, value = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at`,
      [reading_date, slot, parsedValue, readingId, userId]
    );

    return res.status(200).json({
      message: 'Reading updated successfully.',
      reading: updateResult.rows[0]
    });
  } catch (err) {
    console.error('Error updating reading:', err);
    if (err.code === '23505') {
      const startsWithVowel = /^[aeiou]/i.test(req.body.slot.trim());
      const article = startsWithVowel ? 'an' : 'a';
      return res.status(400).json({
        error: `You already have ${article} ${req.body.slot} reading for this date.`
      });
    }
    return res.status(500).json({ error: 'Failed to update reading.' });
  }
}

/**
 * Delete a reading
 * DELETE /api/readings/:id
 */
async function deleteReading(req, res) {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    if (isNaN(readingId)) {
      return res.status(400).json({ error: 'Invalid reading ID.' });
    }

    const deleteResult = await db.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [readingId, userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    return res.status(200).json({ message: 'Reading deleted successfully.' });
  } catch (err) {
    console.error('Error deleting reading:', err);
    return res.status(500).json({ error: 'Failed to delete reading.' });
  }
}

module.exports = {
  getReadings,
  getReadingById,
  createReading,
  updateReading,
  deleteReading
};
