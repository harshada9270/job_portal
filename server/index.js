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

// ✅ Middlewares
app.use(express.json());

app.use(cors({
  origin: "https://job-portal-lilac-nu-94.vercel.app",
  credentials: true
}));

// ✅ Health route
app.get('/health', (req, res) => {
  res.status(200).json({ status: "OK" });
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/user', userRoutes);

// ✅ Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ ENV variables
const PORT = process.env.PORT;
const MONGO = process.env.MONGO_URI;

if (!PORT) console.error("❌ PORT is missing!");
if (!MONGO) console.error("❌ MONGO_URI is missing!");

// ✅ Connect DB FIRST, then start server
mongoose.connect(MONGO)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  })
  .catch(err => {
    console.error('❌ DB connection error:', err);
  });

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);
  res.status(500).json({ error: err.message });
});

// ✅ Catch unexpected crashes
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('🔥 Unhandled Rejection at:', p, 'reason:', reason);
});