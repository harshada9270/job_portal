require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal';

async function run() {
  await mongoose.connect(MONGO);
  console.log('Connected to DB for seeding');
  const adminEmail = 'admin@test.com';
  const userEmail = 'user@test.com';

  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hash = await bcrypt.hash('123456', 10);
    await User.create({ name: 'Admin', email: adminEmail, password: hash, role: 'admin' });
    console.log('Created admin');
  }

  const user = await User.findOne({ email: userEmail });
  if (!user) {
    const hash = await bcrypt.hash('123456', 10);
    await User.create({ name: 'User', email: userEmail, password: hash, role: 'user' });
    console.log('Created user');
  }

  console.log('Seeding done');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
