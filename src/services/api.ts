// API service for backend communication
const API_BASE = 'http://localhost:3001/api';

export interface Community {
  id: string;
  name: string;
  city: string;
  country: string;
  stage: string;
  unitPurchasePrice?: string;
  estimatedMonthlyLoanPayment?: string;
  description: string;
  createdAt?: Date;
  members?: string[];
  memberCount?: number;
  roles?: { [key: string]: string };
  resourcePledges?: number;
}

export class ApiService {
  static async getCommunities(): Promise<Community[]> {
    const response = await fetch(`${API_BASE}/communities`);
    if (!response.ok) {
      throw new Error('Failed to fetch communities');
    }
    return response.json();
  }

  static async createCommunity(communityData: Omit<Community, 'id'>): Promise<Community> {
    const response = await fetch(`${API_BASE}/communities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(communityData),
    });
    if (!response.ok) {
      throw new Error('Failed to create community');
    }
    return response.json();
  }

  static async getCommunity(id: string): Promise<Community> {
    const response = await fetch(`${API_BASE}/communities/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch community');
    }
    return response.json();
  }

  // Add more methods as needed for updating, deleting, etc.
}