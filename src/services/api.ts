// API Service Layer for ScholarStream Backend Integration
import { Scholarship, DiscoveryJobResponse, UserProfile } from '@/types/scholarship';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Initial scholarship discovery after onboarding
  async discoverScholarships(userId: string, profile: UserProfile): Promise<DiscoveryJobResponse> {
    return this.fetchWithAuth('/api/scholarships/discover', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, profile }),
    });
  }

  // Poll for discovery progress
  async getDiscoveryProgress(jobId: string): Promise<DiscoveryJobResponse> {
    return this.fetchWithAuth(`/api/scholarships/discover/${jobId}`);
  }

  // Get all matched scholarships for a user
  async getMatchedScholarships(userId: string): Promise<{ scholarships: Scholarship[]; total_value: number; last_updated: string }> {
    return this.fetchWithAuth(`/api/scholarships/matched?user_id=${userId}`);
  }

  // Get single scholarship details
  async getScholarshipById(scholarshipId: string): Promise<Scholarship> {
    return this.fetchWithAuth(`/api/scholarships/${scholarshipId}`);
  }

  // Save scholarship to favorites
  async saveScholarship(userId: string, scholarshipId: string): Promise<void> {
    return this.fetchWithAuth('/api/scholarships/save', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, scholarship_id: scholarshipId }),
    });
  }

  // Remove from favorites
  async unsaveScholarship(userId: string, scholarshipId: string): Promise<void> {
    return this.fetchWithAuth('/api/scholarships/unsave', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, scholarship_id: scholarshipId }),
    });
  }

  // Track application start
  async startApplication(userId: string, scholarshipId: string): Promise<void> {
    return this.fetchWithAuth('/api/applications/start', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, scholarship_id: scholarshipId }),
    });
  }
}

export const apiService = new ApiService();
