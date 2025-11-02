import dbConnect from '../lib/mongodb';
import User from '../models/User';
import Product from '../models/Product';
import bcrypt from 'bcryptjs';

async function seedTopFarmers() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // Sample farmers data with different performance levels
    const sampleFarmers = [
      {
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        name: 'Juan Dela Cruz',
        email: 'juan.farmer@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'farmer',
        status: 'active',
        isVerified: true,
        sellerStatus: 'verified',
        totalSales: 150, // Highest sales - Rank 1
        averageRating: 4.8,
        productCount: 15,
        reviewCount: 45,
        profilePicture: '/images/default-farmer.png',
        farmName: 'Dela Cruz Farm',
        address: 'Bulacan, Philippines',
        phone: '+639123456789',
        specialties: ['leafy-greens', 'root-crops']
      },
      {
        firstName: 'Maria',
        lastName: 'Santos',
        name: 'Maria Santos',
        email: 'maria.farmer@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'farmer',
        status: 'active',
        isVerified: true,
        sellerStatus: 'verified',
        totalSales: 120, // Second highest - Rank 2
        averageRating: 4.9,
        productCount: 12,
        reviewCount: 38,
        profilePicture: '/images/default-farmer.png',
        farmName: 'Santos Organic Farm',
        address: 'Laguna, Philippines',
        phone: '+639234567890',
        specialties: ['fruits', 'spices-aromatics']
      },
      {
        firstName: 'Pedro',
        lastName: 'Reyes',
        name: 'Pedro Reyes',
        email: 'pedro.farmer@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'farmer',
        status: 'active',
        isVerified: true,
        sellerStatus: 'verified',
        totalSales: 95, // Third - Rank 3
        averageRating: 4.7,
        productCount: 10,
        reviewCount: 30,
        profilePicture: '/images/default-farmer.png',
        farmName: 'Reyes Vegetable Farm',
        address: 'Pampanga, Philippines',
        phone: '+639345678901',
        specialties: ['eggplant-gourds', 'leafy-greens']
      },
      {
        firstName: 'Ana',
        lastName: 'Garcia',
        name: 'Ana Garcia',
        email: 'ana.farmer@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'farmer',
        status: 'active',
        isVerified: true,
        sellerStatus: 'verified',
        totalSales: 75,
        averageRating: 4.6,
        productCount: 8,
        reviewCount: 25,
        profilePicture: '/images/default-farmer.png',
        farmName: 'Garcia Fresh Produce',
        address: 'Nueva Ecija, Philippines',
        phone: '+639456789012',
        specialties: ['grains-rice', 'root-crops']
      },
      {
        firstName: 'Roberto',
        lastName: 'Mendoza',
        name: 'Roberto Mendoza',
        email: 'roberto.farmer@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'farmer',
        status: 'active',
        isVerified: true,
        sellerStatus: 'verified',
        totalSales: 60,
        averageRating: 4.5,
        productCount: 7,
        reviewCount: 20,
        profilePicture: '/images/default-farmer.png',
        farmName: 'Mendoza Agri-Farm',
        address: 'Tarlac, Philippines',
        phone: '+639567890123',
        specialties: ['fruits', 'leafy-greens']
      }
    ];

    // Check if farmers already exist
    for (const farmerData of sampleFarmers) {
      const existing = await User.findOne({ email: farmerData.email });
      
      if (existing) {
        console.log(`⚠️  Farmer ${farmerData.email} already exists, updating...`);
        await User.updateOne(
          { email: farmerData.email },
          { 
            $set: {
              totalSales: farmerData.totalSales,
              averageRating: farmerData.averageRating,
              productCount: farmerData.productCount,
              reviewCount: farmerData.reviewCount,
              isVerified: true,
              status: 'active',
              role: 'farmer',
              sellerStatus: 'verified'
            }
          }
        );
      } else {
        console.log(`✅ Creating farmer: ${farmerData.name}`);
        await User.create(farmerData);
      }
    }

    console.log('\n🎉 Successfully seeded top farmers!');
    console.log('\n📊 Farmers Summary:');
    console.log('1. Juan Dela Cruz - 150 sales (Rank 1 🥇)');
    console.log('2. Maria Santos - 120 sales (Rank 2 🥈)');
    console.log('3. Pedro Reyes - 95 sales (Rank 3 🥉)');
    console.log('4. Ana Garcia - 75 sales');
    console.log('5. Roberto Mendoza - 60 sales');
    console.log('\n💡 You can now view them at /top-farmers');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding farmers:', error);
    process.exit(1);
  }
}

seedTopFarmers();
