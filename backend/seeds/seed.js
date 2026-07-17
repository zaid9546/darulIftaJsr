// require('dotenv').config({ path: '../.env' });
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});
const mongoose = require('mongoose');
const User     = require('../models/User');
const Counter  = require('../models/Counter');
const AuditLog = require('../models/AuditLog');

// ── Seed Data ──────────────────────────────────────────
const SUPER_ADMIN = {
  name:     'Super Admin',
  email:    'admin@fatwams.com',
  password: 'Admin@123456',         // Change immediately after first login
  role:     'super_admin',
  isActive: true,
};

const SAMPLE_MUFTIS = [
  {
    name:           'Mufti Abdullah Al-Hanafi',
    email:          'mufti.abdullah@fatwams.com',
    password:       'Mufti@123456',
    role:           'mufti',
    specialization: 'Fiqh Al-Ibadat (Acts of Worship)',
    languages:      ['english', 'urdu'],
    isActive:       true,
  },
  {
    name:           'Mufti Ibrahim Al-Shafi',
    email:          'mufti.ibrahim@fatwams.com',
    password:       'Mufti@123456',
    role:           'mufti',
    specialization: 'Islamic Finance & Muamalat',
    languages:      ['english', 'arabic'],
    isActive:       true,
  },
  {
    name:           'Mufti Yusuf Al-Maliki',
    email:          'mufti.yusuf@fatwams.com',
    password:       'Mufti@123456',
    role:           'mufti',
    specialization: 'Family Law & Personal Status',
    languages:      ['urdu', 'hindi', 'english'],
    isActive:       true,
  },
];

// ════════════════════════════════════════════════════
const seed = async () => {
  try {
    console.log('\n🌱 Starting FatwaMS Database Seeder...\n');

    // ── Connect to MongoDB ─────────────────────────
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB:', process.env.MONGODB_URI);

    // ── Parse CLI flags ────────────────────────────
    const args    = process.argv.slice(2);
    const isClean = args.includes('--clean');
    const isFull  = args.includes('--full');

    // ── Optional: clean existing data ─────────────
    if (isClean) {
      await Promise.all([
        User.deleteMany({}),
        Counter.deleteMany({}),
        AuditLog.deleteMany({}),
      ]);
      console.log('🗑️  Cleaned: Users, Counters, AuditLogs\n');
    }

    // ── Upsert Super Admin ─────────────────────────
    const existingAdmin = await User.findOne({ email: SUPER_ADMIN.email });
    if (existingAdmin) {
      console.log(`⏭️  Super Admin already exists: ${SUPER_ADMIN.email}`);
    } else {
      await User.create(SUPER_ADMIN);
      console.log(`✅ Super Admin created: ${SUPER_ADMIN.email}`);
    }

    // ── Seed sample Muftis (--full flag) ───────────
    if (isFull) {
      for (const muftiData of SAMPLE_MUFTIS) {
        const existing = await User.findOne({ email: muftiData.email });
        if (existing) {
          console.log(`⏭️  Mufti already exists: ${muftiData.email}`);
        } else {
          await User.create(muftiData);
          console.log(`✅ Mufti created: ${muftiData.email} (${muftiData.specialization})`);
        }
      }
    }

    // ── Initialize Fatwa counter ───────────────────
    const existingCounter = await Counter.findById('fatwa');
    if (existingCounter) {
      console.log(`⏭️  Fatwa counter already exists. Current seq: ${existingCounter.seq}`);
    } else {
      await Counter.create({ _id: 'fatwa', seq: 0 });
      console.log('✅ Fatwa counter initialized (seq: 0)');
    }

    // ── Summary ────────────────────────────────────
    const userCount    = await User.countDocuments();
    const muftiCount   = await User.countDocuments({ role: 'mufti' });
    const counter      = await Counter.findById('fatwa');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Database Seed Summary:');
    console.log(`   👥 Total Users:    ${userCount}`);
    console.log(`   🧕 Total Muftis:   ${muftiCount}`);
    console.log(`   🔢 Fatwa Counter:  ${counter?.seq ?? 0}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Seeding complete!\n');
    console.log('📌 Default Login Credentials:');
    console.log(`   Admin:  ${SUPER_ADMIN.email}  |  ${SUPER_ADMIN.password}`);
    if (isFull) {
      SAMPLE_MUFTIS.forEach((m) => {
        console.log(`   Mufti:  ${m.email}  |  ${m.password}`);
      });
    }
    console.log('\n⚠️  Please change default passwords immediately!\n');

  } catch (err) {
    console.error('❌ Seeder Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
};

seed();
