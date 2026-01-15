import { api } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  avatar_url?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

// Mock user for development - only used when VITE_USE_MOCK=true
const MOCK_USER: User = {
  id: '1',
  username: 'alice',
  email: 'alice@example.com',
  full_name: 'Alice Developer',
  role: 'developer',
};

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === 'true';

export const authService = {
  async login(username: string, password: string): Promise<AuthTokens> {
    if (USE_MOCK_DATA) {
      // Mock login - accept any credentials in mock mode
      localStorage.setItem('access_token', 'mock-token');
      return { access_token: 'mock-token', token_type: 'bearer' };
    }
    
    // Send as JSON - FastAPI will accept it since UserLogin is a Pydantic model
    const response = await api.post('/auth/login', {
      username,
      password
    });
    const tokens = response.data;
    localStorage.setItem('access_token', tokens.access_token);
    return tokens;
  },

  async register(userData: { username: string; email: string; password: string; full_name?: string }): Promise<User> {
    if (USE_MOCK_DATA) {
      // Mock registration
      return {
        id: 'new-user',
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        role: 'developer',
      };
    }
    
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    if (USE_MOCK_DATA) {
      return MOCK_USER;
    }
    
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
  },

  isAuthenticated(): boolean {
    if (USE_MOCK_DATA) {
      return true; // Always authenticated in mock mode
    }
    return !!localStorage.getItem('access_token');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  async refreshToken(): Promise<AuthTokens> {
    if (USE_MOCK_DATA) {
      // Mock refresh - just return mock token
      return { access_token: 'mock-token', token_type: 'bearer' };
    }
    
    const response = await api.post('/auth/refresh');
    const tokens = response.data;
    localStorage.setItem('access_token', tokens.access_token);
    return tokens;
  },
};
