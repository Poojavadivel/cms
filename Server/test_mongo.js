const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.MONGODB_URL || process.env.MANGODB_URL;
console.log('Testing connection to:', url ? url.substring(0, 20) + '...' : 'null');

async function test() {
    try {
        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
}

test();
