import { 
  CalendarEvent, 
  Transaction, 
  SpendingAnalysis, 
  User,
  ApiResponse,
  TransactionFormData,
  EventFilters,
  TransactionFilters 
} from '@/types';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(response.status, errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error');
  }
}

// Calendar Events API
export const eventsApi = {
  async sync(user: User, events: any[]): Promise<ApiResponse<{ savedCount: number }>> {
    return apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify({ user, events }),
    });
  },

  async getByUserId(userId: string): Promise<CalendarEvent[]> {
    return apiRequest(`/events?userId=${userId}`);
  },

  async getFiltered(filters: EventFilters): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.search) params.append('search', filters.search);
    
    return apiRequest(`/events?${params.toString()}`);
  },
};

// Transactions API
export const transactionsApi = {
  async create(data: TransactionFormData & { userId: string }): Promise<Transaction> {
    return apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getByUserId(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams({ userId });
    if (filters) {
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.eventId) params.append('eventId', filters.eventId);
      if (filters.search) params.append('search', filters.search);
    }
    
    return apiRequest(`/transactions?${params.toString()}`);
  },

  async update(id: string, data: Partial<TransactionFormData>): Promise<Transaction> {
    return apiRequest(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Analysis API
export const analysisApi = {
  async getSpendingAnalysis(userId: string, days: number = 30): Promise<SpendingAnalysis> {
    return apiRequest(`/analysis/spending?userId=${userId}&days=${days}`);
  },
};

// Auth API
export const authApi = {
  async validateToken(token: string): Promise<User> {
    return apiRequest('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};

export { ApiError }; 