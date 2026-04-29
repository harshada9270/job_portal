const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  userSkills: [String],
  coverLetter: String,
  matchScore: { type: Number, default: 0 },
  fitSuggestion: { type: String, enum: ['Good Fit', 'Average', 'Low Fit'], default: 'Low Fit' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'next_round'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
