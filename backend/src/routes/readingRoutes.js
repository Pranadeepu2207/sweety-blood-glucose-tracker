const express = require('express');
const router = express.Router();
const readingController = require('../controllers/readingController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateReading } = require('../middleware/validateReading');

// All reading endpoints require user authentication
router.use(requireAuth);

router.get('/', readingController.getReadings);
router.get('/:id', readingController.getReadingById);
router.post('/', validateReading, readingController.createReading);
router.put('/:id', validateReading, readingController.updateReading);
router.delete('/:id', readingController.deleteReading);

module.exports = router;

