/* eslint-env node */
/* global process */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function resetGroups() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Drop the groups collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    const groupsCollectionExists = collections.some(col => col.name === 'groups');

    if (groupsCollectionExists) {
      await mongoose.connection.db.dropCollection('groups');
      console.log('✅ Groups collection dropped successfully!');
    } else {
      console.log('⚠️ Groups collection does not exist.');
    }

    console.log('✅ Reset complete! All group data has been cleared.');
  } catch (error) {
    console.error('❌ Error resetting groups:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

resetGroups();
