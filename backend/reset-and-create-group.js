import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';
import User from './models/User.js';
import Group from './models/Group.js';
import Split from './models/Split.js';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/split-star');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Wipe database and create new test group
const resetDatabase = async () => {
  try {
    console.log('🧹 Wiping database...');
    
    // Clear all collections
    await User.deleteMany({});
    await Group.deleteMany({});
    await Split.deleteMany({});
    
    console.log('✅ Database wiped successfully');
    
    // Create 4 test users
    console.log('👥 Creating test users...');
    
    const users = await User.create([
      {
        name: 'Alex Johnson',
        email: 'alex@test.com',
        password: 'password123',
        pin: '123456'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@test.com',
        password: 'password123',
        pin: '567890'
      },
      {
        name: 'Mike Chen',
        email: 'mike@test.com',
        password: 'password123',
        pin: '901234'
      },
      {
        name: 'Emma Davis',
        email: 'emma@test.com',
        password: 'password123',
        pin: '345678'
      }
    ]);
    
    console.log('✅ Users created successfully');
    
    // Create test group
    console.log('🏠 Creating test group...');
    
    const personNames = {};
    users.forEach((user, index) => {
      personNames[index + 1] = user.name;
    });
    
    const group = await Group.create({
      groupName: 'Weekend Trip Expenses',
      description: 'Shared expenses for our weekend getaway',
      members: users.map(user => user._id),
      personCount: users.length,
      personNames: personNames,
      settings: {
        isPrivate: false,
        allowInvites: true,
        emailNotifications: true,
        pushNotifications: true
      },
      createdBy: users[0]._id
    });
    
    console.log('✅ Group created successfully');
    
    // Add the group to each user's groups array
    console.log('🔗 Linking users to group...');
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      user.groups.push({
        group: group._id,
        role: i === 0 ? 'admin' : 'member', // First user is admin
        accessLevel: i === 0 ? 'full' : 'limited',
        joinedAt: new Date()
      });
      await user.save();
    }
    
    console.log('✅ Users linked to group successfully');
    
    // Display results
    console.log('\n🎉 Database reset complete!');
    console.log('\n📊 Group Details:');
    console.log(`Group Name: ${group.groupName}`);
    console.log(`Group UUID: ${group.uuid}`);
    
    console.log('\n👤 Admin User (Alex Johnson):');
    console.log(`User PIN: ${users[0].pin} (6 digits)`);
    console.log(`Email: ${users[0].email}`);
    
    console.log('\n👥 All Members:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} - PIN: ${user.pin} - Role: ${user.name === 'Alex Johnson' ? 'Admin' : 'Member'}`);
    });
    
    console.log('\n🔗 Access URLs:');
    console.log(`Direct Group Access: http://localhost:5173/group/${group.uuid}`);
    
    console.log('\n✨ Ready to test!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the reset
const main = async () => {
  await connectDB();
  await resetDatabase();
};

main();