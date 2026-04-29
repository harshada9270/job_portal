const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  postType: { type: String, enum: ['job', 'internship'], default: 'job' },
  title: String,
  employmentType: String,
  skills: [String],
  departmentRoleCategory: String,
  workMode: String,
  location: String,
  experienceNeeded: String,
  salaryRange: String,
  educationalBackground: String,
  description: String,
  company: String,
  aboutCompany: String,
  vacanciesAvailable: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
