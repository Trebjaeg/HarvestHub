const { MongoClient } = require('mongodb');

const sampleProducts = [
  {
    name: "Bitter Gourd",
    description: "Fresh organic bitter gourd, perfect for traditional Filipino dishes. Known for its health benefits and distinctive taste.",
    category: "vegetables",
    basePrice: 55,
    currentPrice: 40,
    unit: "kg",
    stock: 25,
    imageUrl: "/images/products/bittergourd.png",
    farmer: {
      name: "Juan Dela Cruz",
      location: "Laguna",
      contact: "+639123456789"
    },
    isOrganic: true,
    isFeatured: true,
    tags: ["healthy", "traditional", "bitter", "vegetable"],
    nutritionalInfo: {
      calories: 17,
      protein: 1,
      carbohydrates: 3.7,
      fiber: 2.8
    }
  },
  {
    name: "Fresh Lemon",
    description: "Juicy and tangy lemons freshly picked from our organic farms. Perfect for cooking, drinks, and natural remedies.",
    category: "fruits",
    basePrice: 130,
    currentPrice: 105,
    unit: "kg",
    stock: 40,
    imageUrl: "/images/products/lemon.png",
    farmer: {
      name: "Maria Santos",
      location: "Batangas",
      contact: "+639987654321"
    },
    isOrganic: true,
    isFeatured: true,
    tags: ["citrus", "vitamin-c", "fresh", "organic"],
    nutritionalInfo: {
      calories: 29,
      protein: 1.1,
      carbohydrates: 9.3,
      fiber: 2.8
    }
  },
  {
    name: "Roma Tomato",
    description: "Fresh, ripe Roma tomatoes perfect for sauces, salads, and cooking. Grown with sustainable farming practices.",
    category: "vegetables",
    basePrice: 66,
    currentPrice: 50,
    unit: "kg",
    stock: 35,
    imageUrl: "/images/products/tomato.png",
    farmer: {
      name: "Pedro Reyes",
      location: "Nueva Ecija",
      contact: "+639555123456"
    },
    isOrganic: false,
    isFeatured: true,
    tags: ["red", "juicy", "cooking", "salad"],
    nutritionalInfo: {
      calories: 18,
      protein: 0.9,
      carbohydrates: 3.9,
      fiber: 1.2
    }
  },
  {
    name: "Fresh Ginger",
    description: "Premium quality ginger root, perfect for cooking, tea, and natural remedies. Freshly harvested with strong aroma.",
    category: "spices",
    basePrice: 130,
    currentPrice: 120,
    unit: "kg",
    stock: 20,
    imageUrl: "/images/products/ginger.png",
    farmer: {
      name: "Rosa Garcia",
      location: "Ilocos Norte",
      contact: "+639777888999"
    },
    isOrganic: true,
    isFeatured: false,
    tags: ["spicy", "aromatic", "medicinal", "root"],
    nutritionalInfo: {
      calories: 80,
      protein: 1.8,
      carbohydrates: 18,
      fiber: 2
    }
  },
  {
    name: "Sweet Banana",
    description: "Fresh, sweet bananas perfect for snacking or cooking. Rich in potassium and natural sugars.",
    category: "fruits",
    basePrice: 75,
    currentPrice: 60,
    unit: "kg",
    stock: 50,
    imageUrl: "/images/products/banana.png",
    farmer: {
      name: "Carlos Mendoza",
      location: "Davao",
      contact: "+639333222111"
    },
    isOrganic: false,
    isFeatured: true,
    tags: ["sweet", "potassium", "energy", "tropical"],
    nutritionalInfo: {
      calories: 89,
      protein: 1.1,
      carbohydrates: 23,
      fiber: 2.6
    }
  },
  {
    name: "Spring Onion",
    description: "Fresh spring onions with green tops, perfect for garnishing and adding mild onion flavor to dishes.",
    category: "vegetables",
    basePrice: 45,
    currentPrice: 30,
    unit: "bunch",
    stock: 30,
    imageUrl: "/images/products/springonion.png",
    farmer: {
      name: "Elena Villanueva",
      location: "Benguet",
      contact: "+639111222333"
    },
    isOrganic: true,
    isFeatured: false,
    tags: ["green", "mild", "garnish", "fresh"],
    nutritionalInfo: {
      calories: 32,
      protein: 1.8,
      carbohydrates: 7.3,
      fiber: 2.6
    }
  },
  {
    name: "Fresh Carrots",
    description: "Crisp and sweet carrots, perfect for salads, cooking, or healthy snacking. Rich in beta-carotene.",
    category: "vegetables",
    basePrice: 65,
    currentPrice: 55,
    unit: "kg",
    stock: 45,
    imageUrl: "/images/products/carrot.png",
    farmer: {
      name: "Roberto Cruz",
      location: "Baguio",
      contact: "+639444555666"
    },
    isOrganic: false,
    isFeatured: true,
    tags: ["orange", "sweet", "crunchy", "beta-carotene"],
    nutritionalInfo: {
      calories: 41,
      protein: 0.9,
      carbohydrates: 10,
      fiber: 2.8
    }
  },
  {
    name: "Sweet Pineapple",
    description: "Tropical pineapples at peak ripeness. Sweet, juicy, and perfect for fresh eating or smoothies.",
    category: "fruits",
    basePrice: 85,
    currentPrice: 70,
    unit: "kg",
    stock: 25,
    imageUrl: "/images/products/pineapple.png",
    farmer: {
      name: "Ana Fernandez",
      location: "Bukidnon",
      contact: "+639666777888"
    },
    isOrganic: false,
    isFeatured: true,
    tags: ["tropical", "sweet", "juicy", "vitamin-c"],
    nutritionalInfo: {
      calories: 50,
      protein: 0.5,
      carbohydrates: 13,
      fiber: 1.4
    }
  }
];

async function seedProducts() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/harvesthub');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const productsCollection = db.collection('products');
    
    // Clear existing products
    await productsCollection.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert sample products
    const result = await productsCollection.insertMany(sampleProducts);
    console.log(`Inserted ${result.insertedCount} sample products`);
    
    // Create indexes for better performance
    await productsCollection.createIndex({ category: 1 });
    await productsCollection.createIndex({ name: "text", description: "text" });
    await productsCollection.createIndex({ isFeatured: 1 });
    await productsCollection.createIndex({ isOrganic: 1 });
    console.log('Created indexes');
    
  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
if (require.main === module) {
  seedProducts();
}

module.exports = { seedProducts, sampleProducts };