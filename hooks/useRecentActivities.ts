import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../lib/admin-auth';

export interface AuditActivity {
  _id: string;
  action: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  performedBy: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  targetUser?: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  targetResource?: string;
  createdAt: string;
}

export interface RecentActivitiesResponse {
  logs: AuditActivity[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export const useRecentActivities = (limit: number = 5) => {
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/audit?limit=${limit}&page=1`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch recent activities: ${response.status} - ${errorData.details || errorData.error || 'Unknown error'}`);
      }
      
      const data: RecentActivitiesResponse = await response.json();
      setActivities(data.logs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching recent activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities
  };
};