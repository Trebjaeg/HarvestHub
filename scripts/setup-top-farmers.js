const { MongoClient } = require('mongodb');

// MongoDB connection URL - adjust as needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/harvesthub';

async function setupTopFarmersConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const topFarmersConfigCollection = db.collection('topfarmersconfigs');
    
    // Check if config already exists
    const existingConfig = await topFarmersConfigCollection.findOne({ isActive: true });
    
    if (existingConfig) {
      console.log('Top Farmers configuration already exists');
      return;
    }
    
    // Create default Top Farmers configuration
    const defaultConfig = {
      banner: {
        title: 'Top Farmers',
        subtitle: 'Meet our highest-rated and most productive farmers',
        buttonText: 'Explore Farmers',
        buttonLink: '#farmers',
        heroImage: process.env.DEFAULT_TOP_FARMERS_HERO_IMAGE || '/images/top-farmers-hero.jpg',
        backgroundColor: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFDF5 100%)',
        textColor: '#1E3A2F',
        enabled: true
      },
      filters: {
        performance: [
          { id: 'all', name: 'All', enabled: true, order: 0 },
          { id: 'top_rated', name: 'Top Rated', enabled: true, order: 1 },
          { id: 'top_sellers', name: 'Top Sellers', enabled: true, order: 2 },
          { id: 'most_productive', name: 'Most Productive', enabled: true, order: 3 },
          { id: 'trending', name: 'Trending', enabled: true, order: 4 },
          { id: 'most_reviewed', name: 'Most Reviewed', enabled: true, order: 5 }
        ],
        categories: [
          { id: 'all', name: 'All', slug: 'all', enabled: true, order: 0 },
          { id: 'leafy-greens', name: 'Leafy Greens', slug: 'leafy-greens', enabled: true, order: 1 },
          { id: 'root-crops', name: 'Root Crops', slug: 'root-crops', enabled: true, order: 2 },
          { id: 'fruits', name: 'Fruits', slug: 'fruits', enabled: true, order: 3 },
          { id: 'spices-aromatics', name: 'Spices & Aromatics', slug: 'spices-aromatics', enabled: true, order: 4 },
          { id: 'eggplant-gourds', name: 'Eggplants & Gourds', slug: 'eggplant-gourds', enabled: true, order: 5 },
          { id: 'grains-rice', name: 'Grains & Rice', slug: 'grains-rice', enabled: true, order: 6 }
        ],
        ratings: { enabled: true, minRating: 1, maxRating: 5 }
      },
      sorting: {
        options: [
          { id: 'top_rated', name: 'Top Rated', field: 'averageRating', direction: 'desc', enabled: true, order: 0 },
          { id: 'most_reviewed', name: 'Most Reviewed', field: 'reviewCount', direction: 'desc', enabled: true, order: 1 },
          { id: 'newest', name: 'Newest', field: 'createdAt', direction: 'desc', enabled: true, order: 2 },
          { id: 'name', name: 'Name', field: 'firstName', direction: 'asc', enabled: true, order: 3 }
        ],
        defaultSort: 'top_rated'
      },
      topFarmersCriteria: {
        salesWeight: 0.3,
        ratingWeight: 0.3,
        productCountWeight: 0.2,
        reviewCountWeight: 0.1,
        recentActivityWeight: 0.1,
        minSalesForTopFarmer: 5,
        minRatingForTopFarmer: 4.0,
        minProductsForTopFarmer: 3,
        timeframeDays: 30
      },
      pagination: { itemsPerPage: 10, maxItemsPerPage: 50 },
      cacheSettings: { ttlMinutes: 30, enabled: true },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await topFarmersConfigCollection.insertOne(defaultConfig);
    console.log('Top Farmers configuration created successfully:', result.insertedId);
    
    // Update existing farmers with default statistics if needed
    const usersCollection = db.collection('users');
    
    // Add farmer role to users who don't have it but should be farmers
    await usersCollection.updateMany(
      { 
        role: 'seller',
        sellerStatus: 'verified'
      },
      { 
        $set: { 
          role: 'farmer',
          averageRating: 0,
          totalSales: 0,
          productCount: 0,
          reviewCount: 0,
          specialties: []
        }
      }
    );
    
    // Split existing name field into firstName and lastName for existing users
    const usersWithNames = await usersCollection.find({ 
      name: { $exists: true },
      $or: [
        { firstName: { $exists: false } },
        { lastName: { $exists: false } }
      ]
    }).toArray();
    
    for (const user of usersWithNames) {
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            firstName,
            lastName
          }
        }
      );
    }
    
    console.log(`Updated ${usersWithNames.length} users with firstName/lastName split`);
    
    // Update Product model to include farmerId reference if it doesn't exist
    const productsCollection = db.collection('products');
    const productsCount = await productsCollection.countDocuments({ farmerId: { $exists: false } });
    
    if (productsCount > 0) {
      console.log(`Found ${productsCount} products without farmerId. Consider updating them manually.`);
    }
    
    console.log('Top Farmers setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up Top Farmers configuration:', error);
  } finally {
    await client.close();
  }
}

// Run the setup
setupTopFarmersConfig();