import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Group from './models/Group.js';
import dotenv from 'dotenv';
import process from 'process';

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/split-star');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create test group
async function createTestGroup() {
  try {
    const group = new Group({
      groupName: 'Test Dinner Group',
      description: 'Test group for splitting expenses',
      uuid: uuidv4(),
      adminPin: Math.floor(1000 + Math.random() * 9000).toString(), // 4-digit PIN
      personCount: 2,
      members: [
        {
          name: 'Alice',
          role: 'admin',
          accessLevel: 'full',
          pin: Math.floor(1000 + Math.random() * 9000).toString(),
          id: uuidv4()
        },
        {
          name: 'Bob',
          role: 'member',
          accessLevel: 'limited',
          pin: Math.floor(1000 + Math.random() * 9000).toString(),
          id: uuidv4()
        }
      ],
      settings: {
        allowMemberInvites: true,
        requireApprovalForExpenses: false,
        defaultSplitMethod: 'equal',
        currency: 'USD'
      },
      isActive: true
    });

    await group.save();
    
    console.log('\n🎉 Test Group Created Successfully!');
    console.log('================================');
    console.log(`Group Name: ${group.groupName}`);
    console.log(`Group UUID: ${group.uuid}`);
    console.log(`Admin PIN: ${group.adminPin}`);
    console.log('\n👥 Members:');
    group.members.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.name} (${member.role})`);
      console.log(`     PIN: ${member.pin}`);
      console.log(`     ID: ${member.id}`);
    });
    console.log('\n🔗 Share Link:');
    console.log(`http://localhost:5173/group/${group.uuid}`);
    console.log('\n📝 Instructions:');
    console.log('1. Use the share link to access the group');
    console.log('2. Use any member PIN to authenticate');
    console.log('3. Use the Admin PIN for full access');
    
    return group;
  } catch (error) {
    console.error('Error creating test group:', error);
    throw error;
  }
}

// Main function
async function main() {
  await connectDB();
  await createTestGroup();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run the script
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});