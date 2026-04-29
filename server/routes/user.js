const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { auth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { calculateMatchScore, fitSuggestionFromScore } = require('../utils/matching');

const parseList = (value) => {
  if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safe = file.originalname.replace(/[^a-z0-9.\-\_]/gi, '_');
    cb(null, unique + '-' + safe);
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedJobs').select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.put('/profile', auth, async (req, res) => {
  const parsedSkills = parseList(req.body.skills);
  const parsedPreferredJobs = parseList(req.body.preferredJobs);
  const parsedPreferredLocations = parseList(req.body.preferredLocations);
  
  // Handle languagesKnown - comes as JSON string from frontend
  let parsedLanguagesKnown = [];
  try {
    if (typeof req.body.languagesKnown === 'string') {
      parsedLanguagesKnown = JSON.parse(req.body.languagesKnown);
    } else if (Array.isArray(req.body.languagesKnown)) {
      parsedLanguagesKnown = req.body.languagesKnown;
    }
  } catch (e) {
    parsedLanguagesKnown = parseList(req.body.languagesKnown);
  }
  
  // Handle education - comes as JSON string from frontend
  let parsedEducation = [];
  try {
    if (typeof req.body.education === 'string') {
      parsedEducation = JSON.parse(req.body.education);
    } else if (Array.isArray(req.body.education)) {
      parsedEducation = req.body.education;
    }
  } catch (e) {
    parsedEducation = [];
  }
  
  const parsedExperienceKeySkills = parseList(req.body.experienceKeySkills);

  const update = {
    name: req.body.name ?? '',
    phone: req.body.phone ?? '',
    qualification: req.body.qualification ?? '',
    collegeName: req.body.collegeName ?? '',
    gender: req.body.gender ?? '',
    location: req.body.location ?? '',
    careerPreferences: req.body.careerPreferences ?? '',
    preferredJobs: parsedPreferredJobs,
    availabilityMonths: req.body.availabilityMonths ?? '',
    preferredLocations: parsedPreferredLocations,
    graduationDegree: req.body.graduationDegree ?? '',
    graduationCollege: req.body.graduationCollege ?? '',
    lastGrades: req.body.lastGrades ?? '',
    education: parsedEducation,
    profileSummary: req.body.profileSummary ?? '',
    skills: parsedSkills,
    languagesKnown: parsedLanguagesKnown,
    experienceCompanyName: req.body.experienceCompanyName ?? '',
    experienceStartDate: req.body.experienceStartDate ?? '',
    experienceEndDate: req.body.experienceEndDate ?? '',
    projectName: req.body.projectName ?? '',
    experienceDescription: req.body.experienceDescription ?? '',
    experienceKeySkills: parsedExperienceKeySkills,
    projectUrl: req.body.projectUrl ?? '',
    accomplishment: req.body.accomplishment ?? '',
    certifications: req.body.certifications ?? '',
    academicAchievements: req.body.academicAchievements ?? '',
    companyName: req.body.companyName ?? '',
    companyWebsite: req.body.companyWebsite ?? '',
    resumeUrl: req.body.resumeUrl ?? ''
  };

  const updatedUser = await User.findByIdAndUpdate(req.user._id, update, { new: true }).populate('savedJobs').select('-password');

  if (!updatedUser) return res.status(404).json({ message: 'User not found' });

  try {
    const apps = await Application.find({ userId: req.user._id });
    for (const application of apps) {
      const job = await Job.findById(application.jobId);
      if (!job) continue;
      const score = calculateMatchScore(job.skills || [], parsedSkills);
      application.matchScore = score;
      application.fitSuggestion = fitSuggestionFromScore(score);
      application.userSkills = parsedSkills;
      await application.save();
    }
  } catch (err) {
    console.error('Recalc error', err);
  }

  res.json(updatedUser);
});

router.get('/saved-jobs', auth, requireRole('user'), async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedJobs');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(Array.isArray(user.savedJobs) ? user.savedJobs : []);
});

router.post('/saved-jobs/:jobId', auth, requireRole('user'), async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const exists = (user.savedJobs || []).some(savedJobId => String(savedJobId) === String(job._id));
  if (!exists) {
    user.savedJobs = [...(user.savedJobs || []), job._id];
    await user.save();
  }

  const updated = await User.findById(req.user._id).populate('savedJobs').select('-password');
  res.json({ savedJobs: updated.savedJobs || [], message: exists ? 'Already saved' : 'Job saved' });
});

router.delete('/saved-jobs/:jobId', auth, requireRole('user'), async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.savedJobs = (user.savedJobs || []).filter(savedJobId => String(savedJobId) !== String(req.params.jobId));
  await user.save();
  const updated = await User.findById(req.user._id).populate('savedJobs').select('-password');
  res.json({ savedJobs: updated.savedJobs || [], message: 'Job removed' });
});

// Upload resume file and update user.resumeUrl
router.post('/profile/resume', auth, upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const relative = path.join('/uploads', path.basename(req.file.path)).replace(/\\/g, '/');
    const updated = await User.findByIdAndUpdate(req.user._id, { resumeUrl: relative }, { new: true }).select('-password');
    res.json({ resumeUrl: updated.resumeUrl });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Delete resume file and clear resumeUrl
router.delete('/profile/resume', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('resumeUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.resumeUrl) {
      const filename = path.basename(user.resumeUrl);
      const full = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }
    user.resumeUrl = '';
    await user.save();
    res.json({ resumeUrl: '' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;
