export interface UserProfile {
  username: string;
  uid: string;
  avatar?: string;
  isAuthenticated: boolean;
  createdAt: string;
}

class AuthService {
  private currentUser: UserProfile | null = null;
  private listeners: Array<(user: UserProfile | null) => void> = [];

  constructor() {
    this.checkAuthStatus();
  }

  public async checkAuthStatus(): Promise<UserProfile | null> {
    try {
      console.log('🔐 AUTH CLIENT: Checking authentication status...');

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          this.currentUser = {
            username: data.user.username,
            uid: data.user.uid,
            avatar: data.user.avatar,
            isAuthenticated: true,
            createdAt: data.user.createdAt || new Date().toISOString(),
          };
          console.log(
            '✅ AUTH CLIENT: User is authenticated:',
            this.currentUser.username
          );
          this.notifyListeners();
          return this.currentUser;
        }
      }

      console.log('ℹ️  AUTH CLIENT: User is not authenticated');
      this.currentUser = null;
      this.notifyListeners();
      return null;
    } catch (error) {
      console.error('❌ AUTH CLIENT: Error checking auth status:', error);
      this.currentUser = null;
      this.notifyListeners();
      return null;
    }
  }

  public async startAuthentication(): Promise<void> {
    try {
      console.log('🔐 AUTH CLIENT: Starting Reddit authentication...');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          this.currentUser = {
            username: data.user.username,
            uid: data.user.uid,
            avatar: data.user.avatar,
            isAuthenticated: true,
            createdAt: data.user.createdAt || new Date().toISOString(),
          };
          console.log(
            '✅ AUTH CLIENT: Authentication successful:',
            this.currentUser.username
          );
          this.notifyListeners();
        } else {
          throw new Error(data.message || 'Authentication failed');
        }
      } else {
        throw new Error(`Authentication failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ AUTH CLIENT: Authentication error:', error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      console.log('🔐 AUTH CLIENT: Logging out...');

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      this.currentUser = null;
      this.notifyListeners();
      console.log('✅ AUTH CLIENT: Logged out successfully');
    } catch (error) {
      console.error('❌ AUTH CLIENT: Logout error:', error);

      this.currentUser = null;
      this.notifyListeners();
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser?.isAuthenticated || false;
  }

  public onAuthChange(callback: (user: UserProfile | null) => void): void {
    this.listeners.push(callback);

    callback(this.currentUser);
  }

  public removeAuthListener(
    callback: (user: UserProfile | null) => void
  ): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error('❌ AUTH CLIENT: Listener error:', error);
      }
    });
  }
}

export const authService = new AuthService();
