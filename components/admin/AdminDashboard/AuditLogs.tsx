'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import { useReactiveTranslation } from '../../../hooks/useReactiveTranslation';

interface AuditLog {
  _id: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  targetUser?: {
    _id: string;
    name: string;
    email: string;
  };
  description: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

const AuditLogs: React.FC = () => {
  const { t } = useReactiveTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter, severityFilter, dateFilter, searchTerm]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(severityFilter !== 'all' && { severity: severityFilter }),
        ...(dateFilter !== 'all' && { dateFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/audit?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const actionTypes: Record<string, { label: string; color: string }> = {
      user_suspended: { label: 'User Suspended', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      user_deleted: { label: 'User Deleted', color: 'bg-red-100 text-red-800 border-red-200' },
      user_promoted: { label: 'User Promoted', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      user_demoted: { label: 'User Demoted', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      report_reviewed: { label: 'Report Reviewed', color: 'bg-green-100 text-green-800 border-green-200' },
      report_resolved: { label: 'Report Resolved', color: 'bg-green-100 text-green-800 border-green-200' },
      report_dismissed: { label: 'Report Dismissed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      appeal_approved: { label: 'Appeal Approved', color: 'bg-green-100 text-green-800 border-green-200' },
      appeal_rejected: { label: 'Appeal Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
      login: { label: 'Login', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      logout: { label: 'Logout', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };

    const actionInfo = actionTypes[action] || { label: action, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    return <Badge className={actionInfo.color}>{actionInfo.label}</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const formatMetadata = (metadata?: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;
    
    return Object.entries(metadata).map(([key, value]) => (
      <div key={key} className="text-xs text-gray-600">
        <span className="font-medium">{key}:</span> {JSON.stringify(value)}
      </div>
    ));
  };

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.audit.title', 'Audit Logs') as string}</CardTitle>
          <CardDescription>
            {t('admin.audit.description', 'Monitor all administrative actions and system events') as string}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('admin.audit.searchPlaceholder', 'Search logs by user, action, or description...') as string}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user_suspended">User Suspended</SelectItem>
                <SelectItem value="user_deleted">User Deleted</SelectItem>
                <SelectItem value="user_promoted">User Promoted</SelectItem>
                <SelectItem value="user_demoted">User Demoted</SelectItem>
                <SelectItem value="report_reviewed">Report Reviewed</SelectItem>
                <SelectItem value="report_resolved">Report Resolved</SelectItem>
                <SelectItem value="appeal_approved">Appeal Approved</SelectItem>
                <SelectItem value="appeal_rejected">Appeal Rejected</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-2">
        {logs.map((log) => {
          const timestamp = formatTimestamp(log.timestamp);
          return (
            <Card key={log._id} className={`transition-all hover:shadow-md ${log.severity === 'critical' ? 'border-red-300 bg-red-50' : log.severity === 'high' ? 'border-orange-300 bg-orange-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      {getActionBadge(log.action)}
                      {getSeverityBadge(log.severity)}
                      <div className="text-sm text-gray-500">
                        {timestamp.date} at {timestamp.time}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-[#2B5A3D] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {log.performedBy.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.performedBy.name}</p>
                          <p className="text-xs text-gray-500">{log.performedBy.email}</p>
                        </div>
                      </div>
                      
                      {log.targetUser && (
                        <>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {log.targetUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{log.targetUser.name}</p>
                              <p className="text-xs text-gray-500">{log.targetUser.email}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{log.description}</p>

                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <span>IP: {log.ipAddress}</span>
                      <span title={log.userAgent} className="truncate max-w-xs">
                        UA: {log.userAgent.slice(0, 50)}...
                      </span>
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                        <p className="font-medium text-gray-700 mb-1">Metadata:</p>
                        {formatMetadata(log.metadata)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {logs.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No audit logs found for the selected filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditLogs;