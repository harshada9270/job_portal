const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const { auth, requireRole } = require('../middleware/auth');
const { calculateMatchScore, fitSuggestionFromScore } = require('../utils/matching');

router.post('/apply', auth, requireRole('user'), async (req, res) => {
  const { jobId, coverLetter } = req.body;
  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const existing = await Application.findOne({ jobId, userId: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already applied' });

    // Use stored user skills from req.user (populated by auth middleware)
    const storedSkills = Array.isArray(req.user.skills) ? req.user.skills : [];
    const matchScore = calculateMatchScore(job.skills || [], storedSkills);
    const fitSuggestion = fitSuggestionFromScore(matchScore);

    const app = await Application.create({
      jobId,
      userId: req.user._id,
      coverLetter,
      userSkills: storedSkills,
      matchScore,
      fitSuggestion
    });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// Admin: view applicants for a job
router.get('/job/:jobId', auth, requireRole('admin'), async (req, res) => {
  const apps = await Application.find({ jobId: req.params.jobId }).populate('userId', 'name email');
  res.json(apps);
});

// User: view their applications
router.get('/me', auth, async (req, res) => {
  const apps = await Application.find({ userId: req.user._id }).populate('jobId');
  res.json(apps);
});

// Admin: update status
router.post('/:id/status', auth, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected', 'pending', 'next_round'].includes(status)) return res.status(400).json({ message: 'Invalid' });
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: 'Not found' });
  app.status = status;
  await app.save();
  res.json(app);
});

module.exports = router;
