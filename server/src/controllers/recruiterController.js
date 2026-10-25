const fs = require('fs');
const path = require('path');
const Recruiter = require('../models/Recruiter');
const { parseSpreadsheetFile, parseCsvString } = require('../utils/excelParser');

/**
 * Get paginated, filtered, and sorted recruiters
 */
exports.getRecruiters = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit) || 30));
    const skip = (page - 1) * limit;

    const {
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      requested,
      messaged,
      location,
      niche,
    } = req.query;

    const query = {};

    // Filter by outreach status
    if (requested === 'true') {
      query.requested = true;
    } else if (requested === 'false') {
      query.requested = false;
    }

    if (messaged === 'true') {
      query.messaged = true;
    } else if (messaged === 'false') {
      query.messaged = false;
    }

    // Filter by location
    if (location && location !== 'all') {
      query.location = { $regex: new RegExp(`^${location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }

    // Filter by niche
    if (niche && niche !== 'all') {
      query.companyNiche = { $regex: new RegExp(`^${niche.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }

    // Search query
    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: regex },
        { companyName: regex },
        { jobTitle: regex },
        { location: regex },
        { companyNiche: regex },
        { statusNotes: regex },
      ];
    }

    // Sorting definition
    const sort = {};
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'location':
        sort.location = orderDirection;
        break;
      case 'companyName':
        sort.companyName = orderDirection;
        break;
      case 'name':
        sort.name = orderDirection;
        break;
      case 'requested':
        sort.requested = orderDirection;
        break;
      case 'messaged':
        sort.messaged = orderDirection;
        break;
      case 'updatedAt':
        sort.updatedAt = orderDirection;
        break;
      default:
        sort.createdAt = orderDirection;
    }

    const [recruiters, total] = await Promise.all([
      Recruiter.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Recruiter.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      success: true,
      recruiters,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching recruiters:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get distinct filter options (Locations and Niches)
 */
exports.getFilterOptions = async (req, res) => {
  try {
    const [locations, niches] = await Promise.all([
      Recruiter.distinct('location'),
      Recruiter.distinct('companyNiche'),
    ]);

    const cleanLocations = locations
      .filter((loc) => loc && loc.trim() && !/^\d+$/.test(loc.replace(/,/g, '')))
      .map((l) => l.trim())
      .sort((a, b) => a.localeCompare(b));

    const cleanNiches = niches
      .filter((n) => n && n.trim())
      .map((n) => n.trim())
      .sort((a, b) => a.localeCompare(b));

    return res.json({
      success: true,
      locations: cleanLocations,
      niches: cleanNiches,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get analytics & outreach statistics
 */
exports.getStats = async (req, res) => {
  try {
    const total = await Recruiter.countDocuments();
    const requestedCount = await Recruiter.countDocuments({ requested: true });
    const messagedCount = await Recruiter.countDocuments({ messaged: true });
    const bothCount = await Recruiter.countDocuments({ requested: true, messaged: true });

    return res.json({
      success: true,
      stats: {
        total,
        requestedCount,
        messagedCount,
        bothCount,
        requestedPercent: total > 0 ? Math.round((requestedCount / total) * 100) : 0,
        messagedPercent: total > 0 ? Math.round((messagedCount / total) * 100) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a single recruiter (checkboxes, status notes, etc.)
 */
exports.updateRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    const { requested, messaged, applied, statusNotes } = req.body;

    const updateFields = {};
    if (requested !== undefined) updateFields.requested = Boolean(requested);
    if (messaged !== undefined) updateFields.messaged = Boolean(messaged);
    if (applied !== undefined) updateFields.applied = Boolean(applied);
    if (statusNotes !== undefined) updateFields.statusNotes = String(statusNotes);

    const recruiter = await Recruiter.findById(id);
    if (!recruiter) {
      return res.status(404).json({ success: false, message: 'Recruiter not found.' });
    }

    // If statusNotes changed, record history entry
    if (statusNotes !== undefined && statusNotes !== recruiter.statusNotes) {
      recruiter.history.push({
        note: statusNotes,
        updatedAt: new Date(),
      });
    }

    Object.assign(recruiter, updateFields);
    await recruiter.save();

    return res.json({
      success: true,
      message: 'Recruiter updated successfully.',
      recruiter,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload and parse Excel / CSV file (Owner only)
 */
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx, .xls) or CSV file.' });
    }

    const mode = req.body.mode || 'append'; // 'append' or 'replace'
    let parsedRows = [];

    const originalName = req.file.originalname.toLowerCase();
    if (originalName.endsWith('.csv')) {
      const fileContent = req.file.buffer.toString('utf8');
      parsedRows = parseCsvString(fileContent);
    } else {
      parsedRows = parseSpreadsheetFile(req.file.buffer, true);
    }

    if (!parsedRows || parsedRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recruiter records found in the uploaded spreadsheet. Please check column headers.',
      });
    }

    if (mode === 'replace') {
      await Recruiter.deleteMany({});
    }

    // Insert batch
    const result = await Recruiter.insertMany(parsedRows, { ordered: false });

    return res.json({
      success: true,
      message: `Successfully processed ${parsedRows.length} recruiters.`,
      importedCount: result.length,
      mode,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error processing spreadsheet.' });
  }
};

/**
 * Seed data from the attached Google Sheet CSV (Owner only)
 */
exports.seedDefaultData = async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../data/recruiters.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ success: false, message: 'Default seed file not found on server.' });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const parsedRows = parseCsvString(csvContent);

    const mode = req.body.mode || 'replace';
    if (mode === 'replace') {
      await Recruiter.deleteMany({});
    }

    const inserted = await Recruiter.insertMany(parsedRows, { ordered: false });

    return res.json({
      success: true,
      message: `Seeded ${inserted.length} recruiters from Google Sheet.`,
      count: inserted.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a single recruiter (Owner only)
 */
exports.deleteRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiter = await Recruiter.findByIdAndDelete(id);
    if (!recruiter) {
      return res.status(404).json({ success: false, message: 'Recruiter not found.' });
    }
    return res.json({ success: true, message: 'Recruiter deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Clear all recruiters (Owner only)
 */
exports.clearRecruiters = async (req, res) => {
  try {
    await Recruiter.deleteMany({});
    return res.json({ success: true, message: 'All recruiters have been cleared.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
