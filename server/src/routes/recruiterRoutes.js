const express = require('express');
const router = express.Router();
const multer = require('multer');
const recruiterController = require('../controllers/recruiterController');
const { authenticateToken, requireOwner } = require('../middleware/auth');

// Multer in-memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
      'text/plain',
    ];
    const name = file.originalname.toLowerCase();
    if (
      allowed.includes(file.mimetype) ||
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      name.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload .xlsx, .xls, or .csv files.'), false);
    }
  },
});

// All recruiter routes require a logged-in user
router.use(authenticateToken);

// Public to all authenticated users
router.get('/', recruiterController.getRecruiters);
router.get('/stats', recruiterController.getStats);
router.get('/filters', recruiterController.getFilterOptions);
router.patch('/:id', recruiterController.updateRecruiter);

// Restricted to OWNER only
router.post('/upload', requireOwner, upload.single('file'), recruiterController.uploadExcel);
router.post('/seed-default', requireOwner, recruiterController.seedDefaultData);
router.delete('/:id', requireOwner, recruiterController.deleteRecruiter);
router.delete('/', requireOwner, recruiterController.clearRecruiters);

module.exports = router;
