import { getAdminDatabase, getAdminFirestore } from './firebase-admin.service';
import { redditNotificationService } from './reddit-notification.service';
import type { Database } from 'firebase-admin/database';
import type { Firestore } from 'firebase-admin/firestore';

export interface UserRecord {
  username: string;
  email: string;
  role: 'admin' | 'user';
  icon: string;
  createdAt: string;
}

export interface DeletedUserRecord {
  originalData: UserRecord;
  deletedBy: string;
  deletedAt: string;
  deletionReason: string;
  metadata: {
    environment: string;
    version: string;
  };
}

export class AdminFirebaseService {
  private database: Database;
  private firestore: Firestore;

  constructor() {
    this.database = getAdminDatabase();
    this.firestore = getAdminFirestore();
  }

  /**
   * Retrieve all users from Firebase Realtime Database
   */
  async getAllUsers(): Promise<UserRecord[]> {
    try {
      const usersRef = this.database.ref('users');
      const snapshot = await usersRef.get();

      if (!snapshot.exists()) {
        return [];
      }

      const usersData = snapshot.val();
      const users: UserRecord[] = [];

      for (const [firebaseUid, userData] of Object.entries(usersData)) {
        const user = userData as any;
        // Exclude sensitive authentication data from responses
        users.push({
          username: user.username || firebaseUid, // Use the actual Reddit username from user data
          email: user.email || '',
          role: user.role || 'user',
          icon: user.icon || '',
          createdAt: user.createdAt || new Date().toISOString()
        });
      }

      return users;
    } catch (error) {
      console.error('Error retrieving all users:', error);
      throw new Error(`Failed to retrieve users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }



  /**
   * Get a specific user by Firebase UID (e.g., reddit:12345)
   */
  async getUserByUsername(firebaseUid: string): Promise<UserRecord | null> {
    try {
      const userRef = this.database.ref(`users/${firebaseUid}`);
      const snapshot = await userRef.get();

      if (!snapshot.exists()) {
        return null;
      }

      const userData = snapshot.val();
      // Exclude sensitive authentication data from response
      return {
        username: userData.username || firebaseUid, // Use actual Reddit username from data
        email: userData.email || '',
        role: userData.role || 'user',
        icon: userData.icon || '',
        createdAt: userData.createdAt || new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error retrieving user ${firebaseUid}:`, error);
      throw new Error(`Failed to retrieve user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a user with automatic audit trail logging
   * @param firebaseUid - The Firebase UID (e.g., reddit:1zyfbtxovw) used as database key
   */
  async deleteUser(firebaseUid: string, deletedBy: string, reason: string): Promise<void> {
    try {
      // First, get the user data before deletion using Firebase UID
      const userData = await this.getUserByUsername(firebaseUid);
      if (!userData) {
        throw new Error(`User with ID ${firebaseUid} not found`);
      }

      // Check if this is the last admin user
      if (userData.role === 'admin') {
        const adminCount = await this.countAdminUsers();
        if (adminCount <= 1) {
          throw new Error('Cannot delete the last admin user in the system');
        }
      }

      // Archive the user data first (this creates the audit trail)
      const deletedUserRecord: DeletedUserRecord = {
        originalData: userData,
        deletedBy,
        deletedAt: new Date().toISOString(),
        deletionReason: reason,
        metadata: {
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0'
        }
      };

      const deletedUsersRef = this.firestore.collection('deletedUsers');
      await deletedUsersRef.doc(userData.username).set(deletedUserRecord);

      // Then delete from the main database using the Firebase UID
      const userRef = this.database.ref(`users/${firebaseUid}`);
      await userRef.remove();

      // Send Reddit notification using the actual Reddit username (non-blocking)
      try {
        if (redditNotificationService && redditNotificationService.isServiceAvailable()) {
          await redditNotificationService.sendDeletionNotification(userData.username, reason);
          console.log(`✅ Reddit DM sent to u/${userData.username} about account deletion`);
        } else {
          console.warn(`⚠️ Reddit notification not sent - service not available (standalone mode)`);
        }
      } catch (notificationError) {
        // Log notification error but don't throw - user deletion should succeed even if notification fails
        console.error(`❌ Failed to send Reddit notification to u/${userData.username}:`, notificationError);
      }

      console.log(`✅ User ${userData.username} (${firebaseUid}) deleted and archived successfully`);
    } catch (error) {
      console.error(`Error deleting user ${firebaseUid}:`, error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user role in Firebase Realtime Database with validation
   * @param firebaseUid - The Firebase UID (e.g., reddit:1zyfbtxovw) used as database key
   */
  async updateUserRole(firebaseUid: string, role: 'admin' | 'user'): Promise<UserRecord> {
    try {
      const userRef = this.database.ref(`users/${firebaseUid}`);

      // First check if user exists and get current data
      const snapshot = await userRef.get();
      if (!snapshot.exists()) {
        throw new Error(`User with ID ${firebaseUid} not found`);
      }

      const currentUserData = snapshot.val();
      const currentRole = currentUserData.role;
      const redditUsername = currentUserData.username;

      // If demoting from admin to user, check if this is the last admin
      if (currentRole === 'admin' && role === 'user') {
        const adminCount = await this.countAdminUsers();
        if (adminCount <= 1) {
          throw new Error('Cannot demote the last admin user in the system');
        }
      }

      // Validate role change
      if (currentRole === role) {
        throw new Error(`User ${redditUsername} already has role '${role}'`);
      }

      // Update the role
      await userRef.update({ role });

      // Return updated user data
      const updatedUser = await this.getUserByUsername(firebaseUid);
      if (!updatedUser) {
        throw new Error(`Failed to retrieve updated user data for ${firebaseUid}`);
      }

      console.log(`✅ User ${redditUsername} (${firebaseUid}) role updated from '${currentRole}' to '${role}'`);
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user role for ${firebaseUid}:`, error);
      throw new Error(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }





  /**
   * Count the number of admin users in the system
   */
  async countAdminUsers(): Promise<number> {
    try {
      const usersRef = this.database.ref('users');
      const snapshot = await usersRef.orderByChild('role').equalTo('admin').get();

      if (!snapshot.exists()) {
        return 0;
      }

      const adminUsers = snapshot.val();
      return Object.keys(adminUsers).length;
    } catch (error) {
      console.error('Error counting admin users:', error);
      throw new Error(`Failed to count admin users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }






}