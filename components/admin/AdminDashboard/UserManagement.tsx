'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { useReactiveTranslation } from '../../../hooks/useReactiveTranslation';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  lastLogin?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspendReason?: string;
}

interface UserActionDialog {
  isOpen: boolean;
  action: 'suspend' | 'delete' | 'promote' | 'demote' | 'activate' | null;
  user: User | null;
  reason: string;
}

const UserManagement: React.FC = () => {
  const { t } = useReactiveTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionDialog, setActionDialog] = useState<UserActionDialog>({
    isOpen: false,
    action: null,
    user: null,
    reason: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, statusFilter, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserAction = async () => {
    if (!actionDialog.user || !actionDialog.action) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: actionDialog.user._id,
          action: actionDialog.action,
          reason: actionDialog.reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }

      // Refresh users list
      await fetchUsers();
      
      // Close dialog
      setActionDialog({
        isOpen: false,
        action: null,
        user: null,
        reason: ''
      });

    } catch (error) {
      console.error('Error performing user action:', error);
      setError(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (action: UserActionDialog['action'], user: User) => {
    setActionDialog({
      isOpen: true,
      action,
      user,
      reason: ''
    });
  };

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Suspended</Badge>;
      case 'deleted':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>;
      case 'user':
        return <Badge variant="outline">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <CardTitle>{t('admin.users.title', 'User Management')}</CardTitle>
          <CardDescription>
            {t('admin.users.description', 'Manage user accounts, roles, and permissions')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('admin.users.searchPlaceholder', 'Search users by name or email...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user._id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#2B5A3D] rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>
                        {t('admin.users.joined', 'Joined')}: {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                      {user.lastLogin && (
                        <span>
                          {t('admin.users.lastLogin', 'Last login')}: {new Date(user.lastLogin).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {user.status === 'suspended' && user.suspendReason && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                        <span className="font-medium text-orange-800">
                          {t('admin.users.suspendReason', 'Suspended')}: 
                        </span>
                        <span className="text-orange-700 ml-1">{user.suspendReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {user.status === 'active' && (
                    <Button
                      onClick={() => openActionDialog('suspend', user)}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      {t('admin.users.actions.suspend', 'Suspend')}
                    </Button>
                  )}
                  
                  {user.status === 'suspended' && (
                    <Button
                      onClick={() => openActionDialog('activate', user)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      {t('admin.users.actions.activate', 'Activate')}
                    </Button>
                  )}

                  {user.status !== 'deleted' && (
                    <Button
                      onClick={() => openActionDialog('delete', user)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {t('admin.users.actions.delete', 'Delete')}
                    </Button>
                  )}

                  {user.role === 'user' && (
                    <Button
                      onClick={() => openActionDialog('promote', user)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      {t('admin.users.actions.promote', 'Promote')}
                    </Button>
                  )}

                  {user.role === 'admin' && (
                    <Button
                      onClick={() => openActionDialog('demote', user)}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      {t('admin.users.actions.demote', 'Demote')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
          >
            {t('common.previous', 'Previous')}
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            {t('common.pageOf', 'Page {{current}} of {{total}}', {
              current: currentPage,
              total: totalPages
            })}
          </span>
          <Button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            {t('common.next', 'Next')}
          </Button>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.isOpen} onOpenChange={(open) => !open && setActionDialog({ ...actionDialog, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'suspend' && t('admin.users.dialogs.suspend.title', 'Suspend User')}
              {actionDialog.action === 'delete' && t('admin.users.dialogs.delete.title', 'Delete User')}
              {actionDialog.action === 'promote' && t('admin.users.dialogs.promote.title', 'Promote User')}
              {actionDialog.action === 'demote' && t('admin.users.dialogs.demote.title', 'Demote User')}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'suspend' && 
                `This will suspend ${actionDialog.user?.name} and prevent them from accessing the platform.`
              }
              {actionDialog.action === 'delete' && 
                `This will permanently delete ${actionDialog.user?.name}'s account. This action cannot be undone.`
              }
              {actionDialog.action === 'promote' && 
                `This will promote ${actionDialog.user?.name} to admin role with elevated privileges.`
              }
              {actionDialog.action === 'demote' && 
                `This will demote ${actionDialog.user?.name} back to regular user role.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">
                {t('admin.users.dialogs.reasonLabel', 'Reason')} 
                {(actionDialog.action === 'suspend' || actionDialog.action === 'delete') && ' *'}
              </Label>
              <Textarea
                id="reason"
                placeholder={t('admin.users.dialogs.reasonPlaceholder', 'Provide a reason for this action...')}
                value={actionDialog.reason}
                onChange={(e) => setActionDialog({ ...actionDialog, reason: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ ...actionDialog, isOpen: false })}
              disabled={actionLoading}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleUserAction}
              disabled={actionLoading || ((actionDialog.action === 'suspend' || actionDialog.action === 'delete') && !actionDialog.reason.trim())}
              className={`
                ${actionDialog.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
                ${actionDialog.action === 'suspend' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                ${actionDialog.action === 'promote' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                ${actionDialog.action === 'demote' ? 'bg-gray-600 hover:bg-gray-700' : ''}
              `}
            >
              {actionLoading ? t('common.processing', 'Processing...') : t('common.confirm', 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;