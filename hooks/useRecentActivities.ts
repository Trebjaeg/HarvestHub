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
      
      // Fetch more logs to account for filtering
      const response = await fetch(`/api/admin/audit?limit=${limit * 5}&page=1`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch recent activities: ${response.status} - ${errorData.details || errorData.error || 'Unknown error'}`);
      }
      
      const data: RecentActivitiesResponse = await response.json();
      
      // Filter for only important actions: suspend, deactivate, reject, approve
      const importantActions = [
        'suspend',
        'suspend_account',
        'deactivate',
        'deactivate_account',
        'reject',
        'reject_farmer',
        'reject_application',
        'approve',
        'approve_farmer',
        'approve_application',
        'verify_farmer',
        'verification_approved',
        'verification_rejected'
      ];
      
      const filteredActivities = data.logs.filter(log => 
        importantActions.some(action => 
          log.action.toLowerCase().includes(action.toLowerCase())
        )
      ).slice(0, limit); // Only take the requested number after filtering
      
      setActivities(filteredActivities);
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