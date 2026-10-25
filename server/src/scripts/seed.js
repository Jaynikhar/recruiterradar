const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Recruiter = require('../models/Recruiter');
const { parseCsvString } = require('../utils/excelParser');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruiter_crm';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');

    // 1. Ensure default Owner user exists
    const existingOwner = await User.findOne({ email: 'owner@example.com' });
    if (!existingOwner) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await User.create({
        name: 'Demo Owner',
        email: 'owner@example.com',
        password: hashedPassword,
        role: 'owner',
      });
      console.log('Created default Owner user: owner@example.com / admin123');
    } else {
      console.log('Owner user already exists: owner@example.com');
    }

    // 2. Ensure demo regular user exists
    const existingUser = await User.findOne({ email: 'hunter@example.com' });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('hunter123', salt);
      await User.create({
        name: 'Job Hunter',
        email: 'hunter@example.com',
        password: hashedPassword,
        role: 'user',
      });
      console.log('Created default Member user: hunter@example.com / hunter123');
    }

    // 3. Seed Recruiters from CSV
    const csvPath = path.join(__dirname, '../data/recruiters.csv');
    if (fs.existsSync(csvPath)) {
      const count = await Recruiter.countDocuments();
      if (count === 0) {
        console.log('Parsing recruiters CSV from:', csvPath);
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const records = parseCsvString(csvContent);
        console.log(`Parsed ${records.length} recruiter records. Seeding database...`);

        const masterRecords = records.map((r) => ({
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
        console.log(`Successfully seeded ${inserted.length} recruiters into MongoDB!`);
      } else {
        console.log(`Database already has ${count} recruiters. Skipping duplicate seed.`);
      }
    } else {
      console.warn('Seed CSV file not found at:', csvPath);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();
