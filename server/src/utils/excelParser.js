const XLSX = require('xlsx');
const Papa = require('papaparse');
const fs = require('fs');

/**
 * Normalizes field headers to canonical model keys
 */
const normalizeKey = (key) => {
  if (!key) return '';
  const clean = key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (clean.includes('jobtitle') || clean === 'title' || clean === 'role' || clean === 'designation') return 'jobTitle';
  if (clean.includes('companyname') || clean === 'company' || clean === 'organization') return 'companyName';
  if (clean.includes('companywebsite') || (clean.includes('website') && clean.includes('company'))) return 'companyWebsite';
  if (clean.includes('companylinkedin')) return 'companyLinkedin';
  if (clean.includes('companytwitter') || clean.includes('companyx')) return 'companyTwitter';
  if (clean.includes('companysocial') || clean.includes('companyfacebook')) return 'companySocial';
  if (clean.includes('companylok') || clean.includes('companyniche') || clean === 'niche' || clean === 'industry') return 'companyNiche';
  if (clean.includes('linkedinurl') || clean === 'linkedin' || clean === 'profile') return 'linkedinUrl';
  if (clean.includes('linkdrequest') || clean.includes('request') || clean === 'requested') return 'requested';
  if (clean.includes('message') || clean.includes('messaged') || clean === 'dmsent') return 'messaged';
  if (clean.includes('applied')) return 'applied';
  if (clean === 'location' || clean === 'city' || clean === 'place') return 'location';
  if (clean.includes('status') || clean.includes('note') || clean.includes('remark')) return 'statusNotes';
  if (clean === 'name' || clean === 'fullname' || clean === 'recruiter') return 'name';

  return clean;
};

const parseBooleanValue = (val) => {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const str = String(val).trim().toLowerCase();
  return ['true', 'yes', '1', 'y', 'sent', 'done', 'checked'].includes(str);
};

const cleanString = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

/**
 * Parses raw JSON rows from XLSX or PapaParse into canonical Recruiter records
 */
const formatParsedRows = (rawRows) => {
  return rawRows
    .map((row) => {
      const canonical = {
        name: '',
        jobTitle: '',
        linkedinUrl: '',
        companyName: '',
        requested: false,
        messaged: false,
        applied: false,
        companyWebsite: '',
        companyLinkedin: '',
        companySocial: '',
        companyTwitter: '',
        location: '',
        companyNiche: '',
        statusNotes: '',
      };

      for (const [key, value] of Object.entries(row)) {
        const norm = normalizeKey(key);
        if (!norm) continue;

        if (norm === 'requested' || norm === 'messaged' || norm === 'applied') {
          canonical[norm] = parseBooleanValue(value);
        } else if (canonical.hasOwnProperty(norm)) {
          canonical[norm] = cleanString(value);
        }
      }

      // If location is numeric (like "280" in some messy rows), handle gracefully
      if (canonical.location && /^\d+$/.test(canonical.location.replace(/,/g, ''))) {
        // likely displaced data or employee count, leave as is or blank if numeric
      }

      return canonical;
    })
    .filter((r) => r.name && r.name.length > 0);
};

/**
 * Parses an Excel or CSV file from a buffer or file path
 */
const parseSpreadsheetFile = (filePathOrBuffer, isBuffer = false) => {
  let workbook;
  if (isBuffer) {
    workbook = XLSX.read(filePathOrBuffer, { type: 'buffer' });
  } else {
    workbook = XLSX.readFile(filePathOrBuffer);
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return formatParsedRows(rawJson);
};

/**
 * Parses a CSV string directly
 */
const parseCsvString = (csvString) => {
  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  return formatParsedRows(parsed.data);
};

module.exports = {
  parseSpreadsheetFile,
  parseCsvString,
  formatParsedRows,
};
