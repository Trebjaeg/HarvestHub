// Run this script to fix any reviews with 'approved' status to 'active'
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-uri';

async function fixReviewStatus() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const reviews = db.collection('reviews');
    
    // Find all reviews with 'approved' status
    const approvedReviews = await reviews.find({ status: 'approved' }).toArray();
    console.log(`Found ${approvedReviews.length} reviews with 'approved' status`);
    
    if (approvedReviews.length > 0) {
      // Update all 'approved' to 'active'
      const result = await reviews.updateMany(
        { status: 'approved' },
        { $set: { status: 'active' } }
      );
      console.log(`Updated ${result.modifiedCount} reviews to 'active' status`);
    }
    
    // Check for any reviews missing sellerResponse field
    const reviewsWithoutSellerResponse = await reviews.find({ 
      sellerResponse: { $exists: false }
    }).toArray();
    
    if (reviewsWithoutSellerResponse.length > 0) {
      console.log(`Found ${reviewsWithoutSellerResponse.length} reviews without sellerResponse field`);
      const addResult = await reviews.updateMany(
        { sellerResponse: { $exists: false } },
        { $set: { sellerResponse: { comment: null, respondedAt: null } } }
      );
      console.log(`Added sellerResponse field to ${addResult.modifiedCount} reviews`);
    }
    
    // Check for any reviews missing followUpReviews field
    const reviewsWithoutFollowUps = await reviews.find({ 
      followUpReviews: { $exists: false }
    }).toArray();
    
    if (reviewsWithoutFollowUps.length > 0) {
      console.log(`Found ${reviewsWithoutFollowUps.length} reviews without followUpReviews field`);
      const addResult = await reviews.updateMany(
        { followUpReviews: { $exists: false } },
        { $set: { followUpReviews: [] } }
      );
      console.log(`Added followUpReviews field to ${addResult.modifiedCount} reviews`);
    }
    
    console.log('Review status fix completed!');
    
  } catch (error) {
    console.error('Error fixing review status:', error);
  } finally {
    await client.close();
  }
}

fixReviewStatus();
