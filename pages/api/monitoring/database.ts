import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { DatabaseUtils, QueryProfiler } from '@/lib/database-utils';
import User from '@/models/User';

/**
 * Database health and performance monitoring endpoint
 * Use this endpoint to monitor your database performance
 * GET /api/monitoring/database
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Simple authentication check (add proper auth in production)
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.MONITORING_TOKEN}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await dbConnect();

    // Get database connection stats
    const connectionStats = {
      readyState: require('mongoose').connection.readyState,
      host: require('mongoose').connection.host,
      name: require('mongoose').connection.name,
    };

    // Get collection statistics
    const userStats = await DatabaseUtils.getCollectionStats(User);

    // Get query performance stats
    const queryStats = QueryProfiler.getStats();

    // Test database responsiveness
    const startTime = Date.now();
    await User.findOne({}, { _id: 1 }).limit(1).lean().exec();
    const responseTime = Date.now() - startTime;

    const healthStatus = {
      timestamp: new Date().toISOString(),
      database: {
        status: connectionStats.readyState === 1 ? 'connected' : 'disconnected',
        host: connectionStats.host,
        name: connectionStats.name,
        responseTime: `${responseTime}ms`
      },
      collections: {
        users: userStats
      },
      queryPerformance: queryStats,
      recommendations: generateRecommendations(userStats, queryStats, responseTime)
    };

    return res.status(200).json(healthStatus);

  } catch (error: any) {
    console.error('Database monitoring error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve database status',
      error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

function generateRecommendations(
  userStats: any, 
  queryStats: any, 
  responseTime: number
): string[] {
  const recommendations: string[] = [];

  // Response time recommendations
  if (responseTime > 1000) {
    recommendations.push('Database response time is slow. Consider optimizing queries or upgrading your database tier.');
  }

  // Collection size recommendations
  if (userStats && userStats.documentCount > 100000) {
    recommendations.push('Large user collection detected. Consider implementing data archiving or partitioning.');
  }

  // Index recommendations
  if (userStats && userStats.avgDocumentSize > 10000) {
    recommendations.push('Large average document size. Consider normalizing data or using references.');
  }

  // Query performance recommendations
  Object.entries(queryStats).forEach(([queryName, stats]: [string, any]) => {
    if (stats.avgTime > 1000) {
      recommendations.push(`Query "${queryName}" is slow (avg: ${stats.avgTime}ms). Consider adding indexes.`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('Database performance looks good!');
  }

  return recommendations;
}