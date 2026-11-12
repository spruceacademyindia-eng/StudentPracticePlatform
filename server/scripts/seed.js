require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const TypingContent = require('../models/TypingContent');
const TypingAttempt = require('../models/TypingAttempt');
const SystemSetting = require('../models/SystemSetting');
const AdminLog = require('../models/AdminLog');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri || mongoUri.includes('<username>')) {
      console.log('⚠️ Please ensure MONGODB_URI in server/.env has valid credentials before running seed.');
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri || 'mongodb://127.0.0.1:27017/spruce_academia');
    console.log('✅ Connected to MongoDB.');

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      TypingContent.deleteMany({}),
      TypingAttempt.deleteMany({}),
      SystemSetting.deleteMany({}),
      AdminLog.deleteMany({}),
    ]);

    // 1. Seed Admin & Students
    console.log('🌱 Seeding Users...');
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@spruce.edu',
      password: 'Admin@123456',
      role: 'ADMIN',
      status: 'ACTIVE',
      lastLogin: new Date(),
    });

    const student1 = await User.create({
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.jenkins@student.spruce.edu',
      password: 'Student@123',
      role: 'STUDENT',
      status: 'ACTIVE',
      lastLogin: new Date(),
    });

    const student2 = await User.create({
      firstName: 'Alex',
      lastName: 'Chen',
      email: 'alex.chen@student.spruce.edu',
      password: 'Student@123',
      role: 'STUDENT',
      status: 'ACTIVE',
      lastLogin: new Date(),
    });

    const student3 = await User.create({
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@student.spruce.edu',
      password: 'Student@123',
      role: 'STUDENT',
      status: 'ACTIVE',
      lastLogin: new Date(),
    });

    // 2. Seed System Settings
    console.log('🌱 Seeding System Settings...');
    const settingsList = [
      { key: 'defaultTargetWPM', value: 30, description: 'Default Target WPM for challenges', updatedBy: admin._id },
      { key: 'minimumAccuracy', value: 80, description: 'Minimum accuracy % required to pass challenges', updatedBy: admin._id },
      { key: 'maximumWordCount', value: 1000, description: 'Maximum allowed word count for typing content', updatedBy: admin._id },
      { key: 'defaultChallengeDuration', value: 300, description: 'Default challenge duration in seconds', updatedBy: admin._id },
      { key: 'availableWPMBenchmarks', value: [20, 25, 30, 35, 40, 45, 50, 60, 80, 100], description: 'Selectable WPM targets', updatedBy: admin._id },
      { key: 'healthcareWordLimits', value: { min: 300, max: 1000 }, description: 'Healthcare domain word limits', updatedBy: admin._id },
      { key: 'englishWordLimits', value: { min: 200, max: 800 }, description: 'English communication word limits', updatedBy: admin._id },
    ];
    await SystemSetting.insertMany(settingsList);

    // 3. Seed Hierarchical Categories
    console.log('🌱 Seeding Categories...');
    const catHealthcare = await Category.create({
      name: 'Healthcare',
      description: 'Medical transcription, clinical documentation, and hospital discharge summaries.',
      parentCategory: null,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    const subDischarge = await Category.create({
      name: 'Discharge Summary Typing',
      description: 'Formal patient hospital discharge records, diagnoses, and medication summaries.',
      parentCategory: catHealthcare._id,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    const subClinical = await Category.create({
      name: 'Clinical Notes & SOAP Reports',
      description: 'Subjective, Objective, Assessment, and Plan notes written by medical specialists.',
      parentCategory: catHealthcare._id,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    const catEnglish = await Category.create({
      name: 'English Communication',
      description: 'Professional, business, and administrative corporate correspondence.',
      parentCategory: null,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    const subGeneral = await Category.create({
      name: 'General Communication',
      description: 'Clear, modern prose designed to develop fluid typing cadence.',
      parentCategory: catEnglish._id,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    const subBusiness = await Category.create({
      name: 'Business Correspondence',
      description: 'Executive emails, corporate memos, proposals, and official letters.',
      parentCategory: catEnglish._id,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    const catSpeed = await Category.create({
      name: 'Speed Tests',
      description: 'Standardized speed calibration passages mapped to explicit WPM benchmarks.',
      parentCategory: null,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    // 4. Seed Typing Content
    console.log('🌱 Seeding Typing Content...');
    const content1 = await TypingContent.create({
      title: 'Inpatient Cardiology Discharge Summary',
      description: 'Clinical summary for a patient treated for acute coronary syndrome.',
      content: 'The patient is a 64-year-old male admitted with atypical substernal chest discomfort radiating to the left shoulder and diaphoresis. Electrocardiogram upon presentation demonstrated subtle ST-segment elevation across leads V2 through V4, and initial cardiac troponin I was markedly elevated at 2.4 ng/mL. The patient was immediately anticoagulated with subcutaneous enoxaparin and administered a loading dose of aspirin and clopidogrel. Urgent diagnostic coronary catheterization performed via the right radial approach revealed a 90 percent focal stenosis of the mid left anterior descending artery. Percutaneous coronary intervention was executed uneventfully with the successful deployment of a single drug-eluting stent. Post-procedural echocardiogram demonstrated an estimated left ventricular ejection fraction of 50 percent with mild anterior hypokinesis. The patient remained hemodynamically stable throughout the remainder of hospitalization with no recurrence of angina, arrhythmia, or bleeding complications. Discharge medications include aspirin 81 mg daily, clopidogrel 75 mg daily, atorvastatin 80 mg nightly, and metoprolol succinate 25 mg daily. The patient is advised to adhere strictly to dual antiplatelet therapy and follow up with outpatient cardiology in two weeks.',
      category: catHealthcare._id,
      subcategory: subDischarge._id,
      mode: 'BOTH',
      difficulty: 'HARD',
      targetWPM: 35,
      minimumAccuracy: 90,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    const content2 = await TypingContent.create({
      title: 'Executive Strategic Memorandum',
      description: 'Corporate business communication outlining quarterly digital transformation objectives.',
      content: 'To all department leads and regional operational directors. As we finalize our corporate strategic priorities for the upcoming fiscal quarter, accelerating our cloud modernization initiative remains our highest operational priority. Cross-functional teams must ensure full data parity across legacy enterprise repositories and modern cloud infrastructure before the scheduled migration cutoff. Department heads are requested to conduct rigorous architectural audits, streamline automated testing pipelines, and provide weekly telemetry on service reliability metrics. Transparent communication between engineering, product management, and customer success teams is essential to minimize workflow disruptions for global enterprise clients. Please review the attached resource allocation roadmap and confirm your respective milestones before the executive committee meeting scheduled for Friday.',
      category: catEnglish._id,
      subcategory: subBusiness._id,
      mode: 'BOTH',
      difficulty: 'MEDIUM',
      targetWPM: 30,
      minimumAccuracy: 85,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    const content3 = await TypingContent.create({
      title: 'Speed Calibration Benchmark 40 WPM',
      description: 'Standardized speed test designed to test rhythm, precision, and sustained finger dexterity.',
      content: 'Typing with consistent cadence requires relaxation, proper posture, and balanced hand positioning over the home row. Keep your wrists slightly elevated above the desk surface rather than resting them flat. As you scan ahead to upcoming words, allow your fingers to prepare each keystroke smoothly without abrupt movements. Focus first on unwavering accuracy, because high speed is the natural byproduct of clean muscle memory and flawless coordination.',
      category: catSpeed._id,
      subcategory: null,
      mode: 'CHALLENGE',
      difficulty: 'EASY',
      targetWPM: 40,
      minimumAccuracy: 85,
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    // 5. Seed Realistic Historical Attempts
    console.log('🌱 Seeding Historical Attempts...');
    const now = Date.now();
    const attempts = [
      {
        student: student1._id,
        content: content1._id,
        mode: 'PRACTICE',
        targetWPM: 35,
        actualWPM: 38,
        accuracy: 94,
        typedCharacters: 920,
        correctCharacters: 865,
        incorrectCharacters: 55,
        wordsTyped: 172,
        timeTaken: 290,
        result: 'COMPLETED',
        startedAt: new Date(now - 4 * 24 * 3600 * 1000),
        completedAt: new Date(now - 4 * 24 * 3600 * 1000 + 290000),
        contentSnapshot: {
          title: content1.title,
          content: content1.content,
          categoryName: 'Healthcare',
          subcategoryName: 'Discharge Summary Typing',
          targetWPM: 35,
          minimumAccuracy: 90,
          wordCount: content1.wordCount,
        },
      },
      {
        student: student1._id,
        content: content2._id,
        mode: 'CHALLENGE',
        targetWPM: 30,
        actualWPM: 34,
        accuracy: 92,
        typedCharacters: 780,
        correctCharacters: 718,
        incorrectCharacters: 62,
        wordsTyped: 140,
        timeTaken: 275,
        result: 'PASS',
        startedAt: new Date(now - 2 * 24 * 3600 * 1000),
        completedAt: new Date(now - 2 * 24 * 3600 * 1000 + 275000),
        contentSnapshot: {
          title: content2.title,
          content: content2.content,
          categoryName: 'English Communication',
          subcategoryName: 'Business Correspondence',
          targetWPM: 30,
          minimumAccuracy: 85,
          wordCount: content2.wordCount,
        },
      },
      {
        student: student2._id,
        content: content3._id,
        mode: 'CHALLENGE',
        targetWPM: 40,
        actualWPM: 44,
        accuracy: 96,
        typedCharacters: 410,
        correctCharacters: 394,
        incorrectCharacters: 16,
        wordsTyped: 75,
        timeTaken: 112,
        result: 'PASS',
        startedAt: new Date(now - 1 * 24 * 3600 * 1000),
        completedAt: new Date(now - 1 * 24 * 3600 * 1000 + 112000),
        contentSnapshot: {
          title: content3.title,
          content: content3.content,
          categoryName: 'Speed Tests',
          subcategoryName: '',
          targetWPM: 40,
          minimumAccuracy: 85,
          wordCount: content3.wordCount,
        },
      },
      {
        student: student3._id,
        content: content1._id,
        mode: 'CHALLENGE',
        targetWPM: 35,
        actualWPM: 29,
        accuracy: 82,
        typedCharacters: 800,
        correctCharacters: 656,
        incorrectCharacters: 144,
        wordsTyped: 150,
        timeTaken: 330,
        result: 'FAIL',
        startedAt: new Date(now - 6 * 3600 * 1000),
        completedAt: new Date(now - 6 * 3600 * 1000 + 330000),
        contentSnapshot: {
          title: content1.title,
          content: content1.content,
          categoryName: 'Healthcare',
          subcategoryName: 'Discharge Summary Typing',
          targetWPM: 35,
          minimumAccuracy: 90,
          wordCount: content1.wordCount,
        },
      },
    ];

    await TypingAttempt.insertMany(attempts);

    // 6. Seed Initial Admin Log
    await AdminLog.create({
      admin: admin._id,
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      metadata: { note: 'Database initialized with demo admin, students, categories, and benchmark content.' },
    });

    console.log('\n======================================================');
    console.log('✅ DATABASE SEED COMPLETE!');
    console.log('------------------------------------------------------');
    console.log('Admin Account:   admin@spruce.edu  /  Admin@123456');
    console.log('Student 1:       sarah.jenkins@student.spruce.edu  /  Student@123');
    console.log('Student 2:       alex.chen@student.spruce.edu  /  Student@123');
    console.log('Student 3:       priya.patel@student.spruce.edu  /  Student@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();

