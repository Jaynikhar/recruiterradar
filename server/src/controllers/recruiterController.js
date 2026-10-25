const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Recruiter = require('../models/Recruiter');
const UserOutreach = require('../models/UserOutreach');
const { parseSpreadsheetFile, parseCsvString } = require('../utils/excelParser');

/**
 * Get paginated, filtered, and sorted recruiters with isolated user tracking
 */
exports.getRecruiters = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
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

    const baseMatch = {};

    // Filter by location
    if (location && location !== 'all') {
      baseMatch.location = { $regex: new RegExp(`^${location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }

    // Filter by niche
    if (niche && niche !== 'all') {
      baseMatch.companyNiche = { $regex: new RegExp(`^${niche.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }

    // Search query on core recruiter attributes
    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      baseMatch.$or = [
        { name: regex },
        { companyName: regex },
        { jobTitle: regex },
        { location: regex },
        { companyNiche: regex },
      ];
    }

    // Aggregation pipeline: Join UserOutreach collection specifically for req.user._id
    const pipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: 'useroutreaches',
          let: { recruiterId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$recruiter', '$$recruiterId'] },
                    { $eq: ['$user', userId] },
                  ],
                },
              },
            },
          ],
          as: 'userTracking',
        },
      },
      {
        $addFields: {
          requested: { $ifNull: [{ $arrayElemAt: ['$userTracking.requested', 0] }, false] },
          messaged: { $ifNull: [{ $arrayElemAt: ['$userTracking.messaged', 0] }, false] },
          applied: { $ifNull: [{ $arrayElemAt: ['$userTracking.applied', 0] }, false] },
          statusNotes: { $ifNull: [{ $arrayElemAt: ['$userTracking.statusNotes', 0] }, ''] },
          userTrackingUpdatedAt: {
            $ifNull: [{ $arrayElemAt: ['$userTracking.updatedAt', 0] }, '$updatedAt'],
          },
        },
      },
    ];

    // Filter by current user's outreach status
    const postMatch = {};
    if (requested === 'true') {
      postMatch.requested = true;
    } else if (requested === 'false') {
      postMatch.requested = false;
    }

    if (messaged === 'true') {
      postMatch.messaged = true;
    } else if (messaged === 'false') {
      postMatch.messaged = false;
    }

    if (Object.keys(postMatch).length > 0) {
      pipeline.push({ $match: postMatch });
    }

    // Sorting
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
        sort._id = 1;
        break;
      case 'messaged':
        sort.messaged = orderDirection;
        sort._id = 1;
        break;
      case 'updatedAt':
        sort.userTrackingUpdatedAt = orderDirection;
        break;
      default:
        sort.createdAt = orderDirection;
    }

    pipeline.push({ $sort: sort });

    // Pagination using $facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: limit },
          { $project: { userTracking: 0 } },
        ],
      },
    });

    const results = await Recruiter.aggregate(pipeline);
    const total = results[0]?.metadata[0]?.total || 0;
    const recruiters = results[0]?.data || [];
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
 * Get analytics & outreach statistics strictly for the authenticated user
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const total = await Recruiter.countDocuments();
    const requestedCount = await UserOutreach.countDocuments({ user: userId, requested: true });
    const messagedCount = await UserOutreach.countDocuments({ user: userId, messaged: true });
    const bothCount = await UserOutreach.countDocuments({
      user: userId,
      requested: true,
      messaged: true,
    });

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
 * Update a recruiter for the authenticated user only (checkboxes, status notes)
 */
exports.updateRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { requested, messaged, applied, statusNotes } = req.body;

    const recruiter = await Recruiter.findById(id).lean();
    if (!recruiter) {
      return res.status(404).json({ success: false, message: 'Recruiter not found.' });
    }

    const updateFields = {};
    if (requested !== undefined) updateFields.requested = Boolean(requested);
    if (messaged !== undefined) updateFields.messaged = Boolean(messaged);
    if (applied !== undefined) updateFields.applied = Boolean(applied);
    if (statusNotes !== undefined) updateFields.statusNotes = String(statusNotes);

    const userOutreach = await UserOutreach.findOneAndUpdate(
      { user: userId, recruiter: id },
      { $set: updateFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      success: true,
      message: 'Recruiter updated successfully for your account.',
      recruiter: {
        ...recruiter,
        requested: userOutreach.requested,
        messaged: userOutreach.messaged,
        applied: userOutreach.applied,
        statusNotes: userOutreach.statusNotes,
      },
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

    const mode = req.body.mode || 'append'; // 'append' | 'replace'
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
      await UserOutreach.deleteMany({});
    }

    // Insert master recruiter records (clean from any user-specific flags)
    const masterRecords = parsedRows.map((r) => ({
      name: r.name,
      jobTitle: r.jobTitle,
      linkedinUrl: r.linkedinUrl,
      companyName: r.companyName,
      companyWebsite: r.companyWebsite,
      companyLinkedin: r.companyLinkedin,
      companySocial: r.companySocial,
      companyTwitter: r.companyTwitter,
      location: r.location,
      companyNiche: r.companyNiche,
    }));

    const result = await Recruiter.insertMany(masterRecords, { ordered: false });

    // If the uploaded rows have initial requested/messaged status, assign to the uploading Owner's tracker
    const ownerOutreachRecords = [];
    result.forEach((inserted, idx) => {
      const original = parsedRows[idx];
      if (original && (original.requested || original.messaged || original.statusNotes)) {
        ownerOutreachRecords.push({
          user: req.user._id,
          recruiter: inserted._id,
          requested: Boolean(original.requested),
          messaged: Boolean(original.messaged),
          statusNotes: original.statusNotes || '',
        });
      }
    });

    if (ownerOutreachRecords.length > 0) {
      await UserOutreach.insertMany(ownerOutreachRecords, { ordered: false });
    }

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
      await UserOutreach.deleteMany({});
    }

    const masterRecords = parsedRows.map((r) => ({
      name: r.name,
      jobTitle: r.jobTitle,
      linkedinUrl: r.linkedinUrl,
      companyName: r.companyName,
      companyWebsite: r.companyWebsite,
      companyLinkedin: r.companyLinkedin,
      companySocial: r.companySocial,
      companyTwitter: r.companyTwitter,
      location: r.location,
      companyNiche: r.companyNiche,
    }));

    const inserted = await Recruiter.insertMany(masterRecords, { ordered: false });

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
    await UserOutreach.deleteMany({ recruiter: id });
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
    await UserOutreach.deleteMany({});
    return res.json({ success: true, message: 'All recruiters and tracking records have been cleared.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
