const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hyvora_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('hyvora_token');
      localStorage.removeItem('hyvora_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    let errorMsg = `Server error (${res.status})`;
    try {
      const err = await res.json();
      errorMsg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || errorMsg);
    } catch {
      if (res.status === 502) {
        errorMsg = 'Backend service is waking up or temporarily unavailable (502 Bad Gateway). Please retry in 30 seconds.';
      } else if (res.status === 504) {
        errorMsg = 'Backend server timed out (504 Gateway Timeout).';
      } else {
        errorMsg = `API request failed with status ${res.status}`;
      }
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ accessToken: string; user: any }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  // Users
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  async createUser(data: any) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateUser(id: string, data: any) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Dashboard
  async getDashboardStats(assignedUserId?: string) {
    const q = assignedUserId ? `?assignedUserId=${assignedUserId}` : '';
    const res = await fetch(`${API_BASE}/dashboard/stats${q}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  // Reports
  async getReports() {
    const res = await fetch(`${API_BASE}/reports`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  // Global Search
  async globalSearch(q: string) {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
    return handleResponse<{ customers: any[]; leads: any[]; properties: any[] }>(res);
  },

  // Customers
  async getCustomers(params?: Record<string, any>) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    const res = await fetch(`${API_BASE}/customers?${query.toString()}`, { headers: getHeaders() });
    return handleResponse<{ data: any[]; meta: any }>(res);
  },

  async checkDuplicateCustomer(phone: string) {
    const res = await fetch(`${API_BASE}/customers/check-duplicate?phone=${encodeURIComponent(phone)}`, {
      headers: getHeaders(),
    });
    return handleResponse<{ exists: boolean; customer: any }>(res);
  },

  async getCustomer(id: string) {
    const res = await fetch(`${API_BASE}/customers/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async createCustomer(data: any) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateCustomer(id: string, data: any) {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Leads
  async getLeads(params?: Record<string, any>) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    const res = await fetch(`${API_BASE}/leads?${query.toString()}`, { headers: getHeaders() });
    return handleResponse<{ data: any[]; meta: any }>(res);
  },

  async getPipeline(assignedUserId?: string) {
    const q = assignedUserId ? `?assignedUserId=${assignedUserId}` : '';
    const res = await fetch(`${API_BASE}/leads/pipeline${q}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getLead(id: string) {
    const res = await fetch(`${API_BASE}/leads/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async createLead(data: any) {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateLead(id: string, data: any) {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async deleteLead(id: string) {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async bulkDeleteLeads(ids: string[]) {
    const res = await fetch(`${API_BASE}/leads/bulk-delete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ids }),
    });
    return handleResponse<any>(res);
  },

  // Requirements
  async updateRequirement(id: string, data: any) {
    const res = await fetch(`${API_BASE}/requirements/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Properties
  async getProperties(params?: Record<string, any>) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    const res = await fetch(`${API_BASE}/properties?${query.toString()}`, { headers: getHeaders() });
    return handleResponse<{ data: any[]; meta: any }>(res);
  },

  async getProperty(id: string) {
    const res = await fetch(`${API_BASE}/properties/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async createProperty(data: any) {
    const res = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateProperty(id: string, data: any) {
    const res = await fetch(`${API_BASE}/properties/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async deleteProperty(id: string) {
    const res = await fetch(`${API_BASE}/properties/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async matchPropertiesForLead(leadId: string) {
    const res = await fetch(`${API_BASE}/properties/match/lead/${leadId}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  // Follow-ups
  async getFollowUps(params?: {
    period?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
    status?: string;
    type?: string;
    assignedUserId?: string;
    leadId?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/followups?${query.toString()}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  async createFollowUp(data: any) {
    const res = await fetch(`${API_BASE}/followups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateFollowUp(id: string, data: any) {
    const res = await fetch(`${API_BASE}/followups/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Calls
  async getCalls(params?: { customerId?: string; leadId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, String(v));
      });
    }
    const res = await fetch(`${API_BASE}/calls?${query.toString()}`, { headers: getHeaders() });
    return handleResponse<{ data: any[]; meta: any }>(res);
  },

  async createCall(data: any) {
    const res = await fetch(`${API_BASE}/calls`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Notes
  async getNotes(params?: { customerId?: string; leadId?: string }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/notes?${query.toString()}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  async createNote(data: any) {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Site Visits
  async getSiteVisits(params?: {
    period?: 'today' | 'upcoming' | 'completed' | 'cancelled' | 'all';
    status?: string;
    leadId?: string;
    propertyId?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/site-visits?${query.toString()}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  async createSiteVisit(data: any) {
    const res = await fetch(`${API_BASE}/site-visits`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateSiteVisit(id: string, data: any) {
    const res = await fetch(`${API_BASE}/site-visits/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Bookings
  async getBookings(params?: { status?: string; leadId?: string; propertyId?: string }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/bookings?${query.toString()}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  async createBooking(data: any) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateBooking(id: string, data: any) {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // AI Voice & Multi-Modal Processing
  async aiProcessVoiceText(data: { text: string; phoneNumber?: string; assignedUserId?: string }) {
    const res = await fetch(`${API_BASE}/ai/process-voice-text`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{
      success: boolean;
      lead: any;
      extracted: any;
      speechText: string;
      textResponse: string;
      matchedProperties: any[];
    }>(res);
  },

  async aiProcessImage(data: { imageData: string; notes?: string; assignedUserId?: string }) {
    const res = await fetch(`${API_BASE}/ai/process-image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{
      success: boolean;
      lead: any;
      extracted: any;
      speechText: string;
      textResponse: string;
      matchedProperties: any[];
    }>(res);
  },
};
