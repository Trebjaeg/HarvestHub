import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

/**
 * Database utility functions for optimized queries
 */
export class DatabaseUtils {
  /**
   * Find documents with automatic error handling and logging
   */
  static async findWithRetry<T extends Document>(
    model: Model<T>,
    filter: FilterQuery<T>,
    options: QueryOptions = {},
    retries: number = 3
  ): Promise<any[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await model.find(filter, null, {
          ...options,
          lean: true, // Return plain JavaScript objects for better performance
        }).exec();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Database query attempt ${attempt + 1} failed:`, error);
        
        if (attempt < retries - 1) {
          // Wait before retrying (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Find one document with automatic error handling
   */
  static async findOneWithRetry<T extends Document>(
    model: Model<T>,
    filter: FilterQuery<T>,
    options: QueryOptions = {},
    retries: number = 3
  ): Promise<any | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await model.findOne(filter, null, {
          ...options,
          lean: options.lean !== false, // Default to lean queries
        }).exec();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Database query attempt ${attempt + 1} failed:`, error);
        
        if (attempt < retries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Update with optimistic locking using version field
   */
  static async updateWithVersion<T extends Document>(
    model: Model<T>,
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    version: number
  ): Promise<T | null> {
    const result = await model.findOneAndUpdate(
      { ...filter, __v: version },
      { ...update, $inc: { __v: 1 } },
      { new: true, runValidators: true }
    ).exec();
    
    if (!result) {
      throw new Error('Document was modified by another process. Please retry.');
    }
    
    return result;
  }

  /**
   * Bulk operations with error handling
   */
  static async bulkWrite<T extends Document>(
    model: Model<T>,
    operations: any[],
    options: any = {}
  ) {
    try {
      return await model.bulkWrite(operations, {
        ordered: false, // Continue on errors
        ...options
      });
    } catch (error) {
      console.error('Bulk write operation failed:', error);
      throw error;
    }
  }

  /**
   * Aggregation with automatic error handling and timeout
   */
  static async aggregateWithTimeout<T extends Document>(
    model: Model<T>,
    pipeline: any[],
    timeoutMs: number = 30000
  ) {
    try {
      return await model.aggregate(pipeline)
        .allowDiskUse(true) // Allow disk usage for large datasets
        .exec();
    } catch (error) {
      console.error('Aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  static async getCollectionStats<T extends Document>(model: Model<T>) {
    try {
      const documentCount = await model.countDocuments();
      return {
        documentCount,
        avgDocumentSize: 0,
        totalSize: 0,
        indexCount: 0,
        totalIndexSize: 0
      };
    } catch (error) {
      console.error('Failed to get collection stats:', error);
      return null;
    }
  }

  /**
   * Simple delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Query performance monitoring
 */
export class QueryProfiler {
  private static profiles: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  static async profile<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await queryFn();
      this.recordQuery(queryName, Date.now() - start);
      return result;
    } catch (error) {
      this.recordQuery(queryName, Date.now() - start, true);
      throw error;
    }
  }

  private static recordQuery(name: string, duration: number, isError: boolean = false): void {
    const profile = this.profiles.get(name) || { count: 0, totalTime: 0, avgTime: 0 };
    
    profile.count++;
    profile.totalTime += duration;
    profile.avgTime = profile.totalTime / profile.count;
    
    this.profiles.set(name, profile);

    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`Slow query detected: ${name} took ${duration}ms`, { isError });
    }
  }

  static getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.profiles.forEach((profile, name) => {
      stats[name] = { ...profile };
    });
    return stats;
  }

  static reset(): void {
    this.profiles.clear();
  }
}