const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/summary', reportController.getReportsSummary);

module.exports = router;

