#!/usr/bin/env node

/**
 * Superadmin Initialization Script for HarvestHub
 * This script initializes the superadmin account for iamraymondbautista17@gmail.com
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function initializeSuperAdmin() {
  console.log('🌱 HarvestHub Superadmin Initialization');
  console.log('=====================================\n');

  const email = 'iamraymondbautista17@gmail.com';
  
  console.log(`Initializing superadmin for: ${email}`);
  
  rl.question('Enter password for superadmin: ', async (password) => {
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      rl.close();
      return;
    }

    try {
      console.log('\n🔄 Initializing superadmin...');
      
      const response = await fetch('http://localhost:3000/api/admin/init-superadmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initKey: 'HARVESTHUB_SUPERADMIN_INIT_2025',
          email: email,
          password: password
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('\n✅ Superadmin initialized successfully!');
        console.log(`📧 Email: ${result.user.email}`);
        console.log(`👤 Name: ${result.user.name}`);
        console.log(`🔑 Role: ${result.user.role}`);
        console.log('\n🎉 You can now log in to the admin dashboard!');
        console.log('🔗 Admin URL: http://localhost:3000/admin');
      } else {
        console.error(`❌ Error: ${result.error}`);
      }

    } catch (error) {
      console.error('❌ Failed to initialize superadmin:', error.message);
      console.log('\n💡 Make sure your Next.js server is running on localhost:3000');
    }

    rl.close();
  });
}

// Run the script
if (require.main === module) {
  initializeSuperAdmin();
}

module.exports = { initializeSuperAdmin };