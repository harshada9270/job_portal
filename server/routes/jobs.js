const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { auth, requireRole } = require('../middleware/auth');
const { calculateMatchScore } = require('../utils/matching');

router.get('/', async (req, res) => {
  const jobs = await Job.find().sort({ createdAt: -1 });
  res.json(jobs);
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  const {
    postType,
    title,
    employmentType,
    skills,
    departmentRoleCategory,
    workMode,
    location,
    experienceNeeded,
    salaryRange,
    educationalBackground,
    description,
    company,
    aboutCompany,
    vacanciesAvailable
  } = req.body;
  if (!postType || !title || !employmentType || !Array.isArray(skills) || skills.length === 0 || !departmentRoleCategory || !workMode || !location || !experienceNeeded || !salaryRange || !educationalBackground || !description || !company || !aboutCompany || vacanciesAvailable === undefined || vacanciesAvailable === null || vacanciesAvailable === '') {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const job = await Job.create({
      postType,
      title,
      employmentType,
      departmentRoleCategory,
      workMode,
      location,
      experienceNeeded,
      salaryRange,
      educationalBackground,
      description,
      skills,
      company,
      aboutCompany,
      vacanciesAvailable: Number(vacanciesAvailable)
    });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Error creating job' });
  }
});

router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  const {
    postType,
    title,
    employmentType,
    skills,
    departmentRoleCategory,
    workMode,
    location,
    experienceNeeded,
    salaryRange,
    educationalBackground,
    description,
    company,
    aboutCompany,
    vacanciesAvailable
  } = req.body;
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        postType,
        title,
        employmentType,
        skills: skills || [],
        departmentRoleCategory,
        workMode,
        location,
        experienceNeeded,
        salaryRange,
        educationalBackground,
        description,
        company,
        aboutCompany,
        vacanciesAvailable: Number(vacanciesAvailable) || 1
      },
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Error updating job' });
  }
});

router.get('/recommendations', auth, requireRole('user'), async (req, res) => {
  const userSkills = Array.isArray(req.user.skills) ? req.user.skills : [];
  const jobs = await Job.find().sort({ createdAt: -1 });

  const recommended = jobs
    .map(job => {
      const score = calculateMatchScore(job.skills || [], userSkills);
      return { ...job.toObject(), recommendationScore: score };
    })
    .filter(job => job.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 5);

  res.json(recommended);
});

// Admin: delete job
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Not found' });
    await require('../models/Application').deleteMany({ jobId: job._id });
    await require('../models/User').updateMany({}, { $pull: { savedJobs: job._id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting job' });
  }
});

router.get('/:id', async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Not found' });
  res.json(job);
});

module.exports = router;
