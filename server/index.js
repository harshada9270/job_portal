require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const path = require('path');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const appRoutes = require('./routes/applications');
const userRoutes = require('./routes/user');

const app = express();
app.use(express.json());

app.use(cors());
app.options('*', cors());

app.get('/health', (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/user', userRoutes);

// Serve uploaded resumes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal';

app.listen(PORT, () => console.log('Server running on port', PORT));

mongoose.connect(MONGO)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('DB connection error', err);
  });

// Global handlers to capture unexpected errors and promise rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({ error: err.message });
});
