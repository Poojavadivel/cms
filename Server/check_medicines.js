// Simple DB check
require('dotenv').config();
const mongoose = require('mongoose');

async function checkDB() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hms';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);

    const Medicine = mongoose.model('Medicine', new mongoose.Schema({}, { strict: false, collection: 'medicines' }));
    const count = await Medicine.countDocuments();
    console.log('\n📊 Total medicines in DB:', count);

    if (count > 0) {
      const samples = await Medicine.find().limit(5).lean();
      console.log('\n📋 Sample medicines:');
      samples.forEach(m => {
        console.log(`  - ${m.name} (ID: ${m._id})`);
      });
    } else {
      console.log('\n⚠️ No medicines found in database!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkDB();
