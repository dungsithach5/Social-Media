const express = require('express');
const router = express.Router();

const {
    reportCopyrightViolation,
    getAllViolations,
    updateViolationStatus,
} = require('../controllers/copyrightViolation.controller');

// Report a copyright violation
router.post('/report', reportCopyrightViolation);

// Get all violations (admin only)
router.get('/', getAllViolations);

// Update violation status (admin only)
router.put('/:id/status', updateViolationStatus);

module.exports = router; 