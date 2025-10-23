// Use a generic type for the reddit client
type RedditClient = any;

export class RedditNotificationService {
  private reddit: RedditClient | undefined;

  constructor(redditClient?: RedditClient) {
    this.reddit = redditClient;
  }

  /**
   * Check if Reddit notification service is available
   */
  isServiceAvailable(): boolean {
    return this.reddit !== undefined;
  }

  /**
   * Send deletion notification via Reddit Direct Message
   * Note: This will only work in Devvit context where Reddit API is available
   */
  async sendDeletionNotification(username: string, reason: string): Promise<void> {
    if (!this.reddit) {
      throw new Error('Reddit client not available - notifications only work in Devvit context');
    }

    try {
      const subject = 'Account Deletion Notification';
      const message = this.formatDeletionMessage(reason);

      // Try to send private message using Reddit API
      // The exact method may vary based on Devvit's Reddit client implementation
      if (typeof this.reddit.sendPrivateMessage === 'function') {
        await this.reddit.sendPrivateMessage({
          to: username,
          subject: subject,
          text: message
        });
      } else if (typeof this.reddit.composeMessage === 'function') {
        await this.reddit.composeMessage({
          to: username,
          subject: subject,
          text: message
        });
      } else {
        // Fallback: log the notification (for development/testing)
        console.log(`📨 Reddit DM would be sent to u/${username}:`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
        console.warn('⚠️ Reddit DM API method not found - message logged instead');
        return;
      }

      console.log(`✅ Reddit DM sent to u/${username} about account deletion`);
    } catch (error) {
      console.error(`❌ Failed to send Reddit DM to u/${username}:`, error);
      throw new Error(`Failed to send Reddit notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format the deletion notification message
   */
  private formatDeletionMessage(reason: string): string {
    return `Hello,

We're writing to inform you that your account has been removed from our system.

**Reason for deletion:** ${reason}

If you believe this action was taken in error or if you have any questions, please feel free to reach out to our moderation team.

Thank you for your understanding.

Best regards,
The Moderation Team`;
  }
}

// Export singleton instance that will be initialized with Reddit client when available
export let redditNotificationService: RedditNotificationService;

/**
 * Initialize the Reddit notification service with the Reddit client
 * This should be called when the Reddit client becomes available
 */
export function initializeRedditNotificationService(redditClient?: RedditClient): void {
  redditNotificationService = new RedditNotificationService(redditClient);
}