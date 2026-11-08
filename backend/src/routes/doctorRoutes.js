const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/patients', doctorController.getAssignedPatients);
router.get('/patients/:patientId/reports', doctorController.getPatientReports);

module.exports = router;
