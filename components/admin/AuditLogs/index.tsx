'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDots from '@/components/ui/LoadingDots';

interface AuditLog {
  _id: string;
  performedBy: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  action: string;
  targetUser?: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  targetResource?: string;
  targetResourceId?: string;
  reason: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  severity: string;
  createdAt: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/audit', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionMap: { [key: string]: { color: string } } = {
      'CREATE': { color: 'bg-green-100 text-green-800' },
      'UPDATE': { color: 'bg-blue-100 text-blue-800' },
      'DELETE': { color: 'bg-red-100 text-red-800' },
      'LOGIN': { color: 'bg-purple-100 text-purple-800' },
      'LOGOUT': { color: 'bg-gray-100 text-gray-800' },
      'APPROVE': { color: 'bg-green-100 text-green-800' },
      'REJECT': { color: 'bg-red-100 text-red-800' },
      'SUSPEND': { color: 'bg-orange-100 text-orange-800' },
      'RESTORE': { color: 'bg-blue-100 text-blue-800' }
    };

    const actionInfo = actionMap[action.toUpperCase()] || { color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionInfo.color}`}>
        {action}
      </span>
    );
  };

  const formatDetails = (details: any) => {
    if (!details) return 'No details available';
    
    if (typeof details === 'string') return details;
    
    if (typeof details === 'object') {
      const entries = Object.entries(details);
      if (entries.length === 0) return 'No details available';
      
      return entries.map(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return `${formattedKey}: ${value}`;
      }).join(', ');
    }
    
    return String(details);
  };

  const filteredLogs = logs.filter(log => {
    // Only show specific actions: password changes, email changes, suspend account, deactivate account
    const allowedActions = ['change_password', 'change_email', 'suspend', 'deactivate', 'password_change', 'email_change', 'suspend_account', 'deactivate_account'];
    const logAction = log.action.toLowerCase();
    
    // Check if the action matches any of the allowed actions
    const isAllowedAction = allowedActions.some(action => logAction.includes(action));
    
    if (!isAllowedAction) {
      return false;
    }

    if (filter !== 'all' && !log.action.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }

    if (dateFilter !== 'all') {
      const logDate = new Date(log.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return logDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return logDate >= monthAgo;
        default:
          return true;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#16a34a" />
          </div>
          <p className="text-gray-600">Loading audit logs</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={fetchLogs} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <option value="all">All Actions</option>
            <option value="password">Password Changes</option>
            <option value="email">Email Changes</option>
            <option value="suspend">Suspend Account</option>
            <option value="deactivate">Deactivate Account</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <Button onClick={fetchLogs} variant="outline" className="w-full sm:w-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Poppins, sans-serif' }}>Audit Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Admin</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Action</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Target</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {log.performedBy ? 
                          `${log.performedBy.firstName || ''} ${log.performedBy.lastName || ''}`.trim() || log.performedBy.email
                          : 'Unknown Admin'
                        }
                      </div>
                      {log.performedBy?.email && log.performedBy.firstName && (
                        <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{log.performedBy.email}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {log.targetUser ? 
                          `${log.targetUser.firstName || ''} ${log.targetUser.lastName || ''}`.trim() || log.targetUser.email
                          : 'N/A'
                        }
                      </div>
                      {log.targetUser?.email && log.targetUser.firstName && (
                        <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{log.targetUser.email}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {filteredLogs.map((log) => (
              <div key={log._id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                {/* Admin Info */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Admin</div>
                  <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {log.performedBy ? 
                      `${log.performedBy.firstName || ''} ${log.performedBy.lastName || ''}`.trim() || log.performedBy.email
                      : 'Unknown Admin'
                    }
                  </div>
                  {log.performedBy?.email && log.performedBy.firstName && (
                    <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{log.performedBy.email}</div>
                  )}
                </div>

                {/* Action Badge */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Action</div>
                  {getActionBadge(log.action)}
                </div>

                {/* Target Info */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Target</div>
                  <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {log.targetUser ? 
                      `${log.targetUser.firstName || ''} ${log.targetUser.lastName || ''}`.trim() || log.targetUser.email
                      : 'N/A'
                    }
                  </div>
                  {log.targetUser?.email && log.targetUser.firstName && (
                    <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{log.targetUser.email}</div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Date</div>
                  <div className="text-sm text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-600 mb-4">There are no audit logs matching your current filters.</p>
              <p className="text-sm text-gray-500">Audit logs will appear here when admin actions are performed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;