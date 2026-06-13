require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Wait, __dirname is backend/scripts, so ../.env is backend/.env! Let me fix it to use MONGO_URI if MONGODB_URI is undefined.
const mongoose = require('mongoose');
const { NotificationTemplate } = require('../src/models');
const logger = require('../src/utils/logger');

const templates = [
  {
    code: 'COMPLAINT_CREATED',
    priority: 'Medium',
    defaultChannels: ['IN_APP', 'EMAIL'],
    requiredChannels: ['IN_APP'],
    translations: {
      en: {
        title: 'Complaint Registered',
        message: 'Your complaint ({{id}}) has been successfully registered.'
      },
      te: {
        title: 'ఫిర్యాదు నమోదు చేయబడింది',
        message: 'మీ ఫిర్యాదు ({{id}}) విజయవంతంగా నమోదు చేయబడింది.'
      },
      ta: {
        title: 'புகார் பதிவு செய்யப்பட்டது',
        message: 'உங்கள் புகார் ({{id}}) வெற்றிகரமாக பதிவு செய்யப்பட்டது.'
      },
      kn: {
        title: 'ದೂರು ದಾಖಲಾಗಿದೆ',
        message: 'ನಿಮ್ಮ ದೂರು ({{id}}) ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ.'
      }
    }
  },
  {
    code: 'COMPLAINT_STATUS_UPDATE',
    priority: 'High',
    defaultChannels: ['IN_APP', 'SMS'],
    requiredChannels: ['IN_APP'],
    translations: {
      en: {
        title: 'Complaint Update',
        message: 'Your complaint ({{id}}) is now: {{status}}.'
      },
      te: {
        title: 'ఫిర్యాదు అప్‌డేట్',
        message: 'మీ ఫిర్యాదు ({{id}}) ఇప్పుడు: {{status}}.'
      },
      ta: {
        title: 'புகார் புதுப்பிப்பு',
        message: 'உங்கள் புகார் ({{id}}) இப்போது: {{status}}.'
      },
      kn: {
        title: 'ದೂರು ನವೀಕರಣ',
        message: 'ನಿಮ್ಮ ದೂರು ({{id}}) ಈಗ: {{status}}.'
      }
    }
  }
];

const seed = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');

    for (const t of templates) {
      await NotificationTemplate.findOneAndUpdate(
        { code: t.code },
        t,
        { upsert: true, new: true }
      );
      logger.info(`Seeded template: ${t.code}`);
    }

    logger.info('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error(`Seeding failed: ${err.message}`);
    process.exit(1);
  }
};

seed();
