const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, unique: true },
  phone: { type: String, default: '' },
  companyName: { type: String, default: '' },
  companyWebsite: { type: String, default: '' },
  qualification: { type: String, default: '' },
  collegeName: { type: String, default: '' },
  gender: { type: String, default: '' },
  location: { type: String, default: '' },
  careerPreferences: { type: String, default: '' },
  preferredJobs: [{ type: String }],
  availabilityMonths: { type: String, default: '' },
  preferredLocations: [{ type: String }],
  education: [{
    degree: { type: String, default: '' },
    college: { type: String, default: '' },
    grades: { type: String, default: '' },
    startYear: { type: String, default: '' },
    endYear: { type: String, default: '' }
  }],
  graduationDegree: { type: String, default: '' },
  graduationCollege: { type: String, default: '' },
  lastGrades: { type: String, default: '' },
  profileSummary: { type: String, default: '' },
  skills: [{ type: String }],
  languagesKnown: [{ type: String }],
  experienceCompanyName: { type: String, default: '' },
  experienceStartDate: { type: String, default: '' },
  experienceEndDate: { type: String, default: '' },
  projectName: { type: String, default: '' },
  experienceDescription: { type: String, default: '' },
  experienceKeySkills: [{ type: String }],
  projectUrl: { type: String, default: '' },
  accomplishment: { type: String, default: '' },
  certifications: { type: String, default: '' },
  academicAchievements: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  password: String,
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
