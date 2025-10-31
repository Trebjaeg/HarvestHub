'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LoadingDots from '@/components/ui/LoadingDots';
import { Ban, Unlock, Trash2, AlertCircle } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: 'active' | 'suspended' | 'deleted';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  suspendReason?: string;
  suspendedAt?: string;
  suspensionExpiresAt?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Suspend Modal State
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspensionExpiry, setSuspensionExpiry] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);
  
  // Deactivate/Reactivate Confirmation Modal State
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<{ id: string; name: string } | null>(null);
  const [userToReactivate, setUserToReactivate] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term and auto-refresh
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/users');
      // const data = await response.json();
      // setUsers(data.users);
      
      // Mock data for now
      setUsers([
        {
          _id: '1',
          username: 'john_doe',
          name: 'John Doe',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'buyer',
          status: 'active',
          isActive: true,
          isVerified: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Open suspend modal
  const openSuspendModal = (user: User) => {
    setSelectedUser(user);
    setSuspendReason('');
    setSuspensionExpiry('');
    setSuspendModalOpen(true);
  };

  // Handle suspend user
  const handleSuspendUser = async () => {
    if (!selectedUser || !suspendReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    setIsSuspending(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'suspend',
          userId: selectedUser._id,
          reason: suspendReason,
          expiresAt: suspensionExpiry || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to suspend user');
      }

      // Refresh users list
      await fetchUsers();
      setSuspendModalOpen(false);
      setSelectedUser(null);
      setSuspendReason('');
      setSuspensionExpiry('');
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user. Please try again.');
    } finally {
      setIsSuspending(false);
    }
  };

  // Unsuspend user (reactivate)
  const handleUnsuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unsuspend this user? They will regain full access.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'activate',
          userId: userId,
          reason: 'User unsuspended by admin'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to unsuspend user');
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Failed to unsuspend user. Please try again.');
    }
  };

  // Deactivate user (permanent - sets to deleted)
  const handleDeactivateClick = (userId: string, userName: string) => {
    setUserToDeactivate({ id: userId, name: userName });
    setShowDeactivateModal(true);
  };

  const handleDeactivateUser = async () => {
    if (!userToDeactivate) return;
    
    setShowDeactivateModal(false);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'delete',
          userId: userToDeactivate.id,
          reason: 'Account deactivated by admin'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate user');
      }

      await fetchUsers();
      setUserToDeactivate(null);
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user. Please try again.');
    }
  };

  // Reactivate deactivated user
  const handleReactivateClick = (userId: string) => {
    setUserToReactivate(userId);
    setShowReactivateModal(true);
  };

  const handleReactivateUser = async () => {
    if (!userToReactivate) return;
    
    setShowReactivateModal(false);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'activate',
          userId: userToReactivate,
          reason: 'Account reactivated by admin'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate user');
      }

      await fetchUsers();
      setUserToReactivate(null);
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert('Failed to reactivate user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingDots size="lg" color="#16a34a" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : user.status === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {user.status === 'active' ? 'Active' : 
                         user.status === 'suspended' ? 'Suspended' : 
                         'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {user.status === 'active' && (
                          <>
                            <Button
                              onClick={() => openSuspendModal(user)}
                              variant="outline"
                              size="sm"
                              className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                              title="Suspend (temporary, can still login)"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Suspend
                            </Button>
                            <Button
                              onClick={() => handleDeactivateClick(user._id, user.name)}
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                              title="Deactivate (permanent, blocks login)"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Deactivate
                            </Button>
                          </>
                        )}
                        {user.status === 'suspended' && (
                          <>
                            <Button
                              onClick={() => handleUnsuspendUser(user._id)}
                              variant="outline"
                              size="sm"
                              className="border-green-200 text-green-600 hover:bg-green-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Unsuspend
                            </Button>
                            <Button
                              onClick={() => handleDeactivateClick(user._id, user.name)}
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Deactivate
                            </Button>
                          </>
                        )}
                        {user.status === 'deleted' && (
                          <Button
                            onClick={() => handleReactivateClick(user._id)}
                            variant="outline"
                            size="sm"
                            className="border-green-200 text-green-600 hover:bg-green-50"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            <Unlock className="h-3 w-3 mr-1" />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user._id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{user.name}</h3>
                        <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{user.email}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : user.status === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {user.status === 'active' ? 'Active' : 
                         user.status === 'suspended' ? 'Suspended' : 
                         'Deactivated'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'superadmin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'admin'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {user.role}
                      </span>
                      <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {user.status === 'suspended' && user.suspendReason && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                        <p className="text-yellow-800"><strong>Reason:</strong> {user.suspendReason}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {user.status === 'active' && (
                        <>
                          <Button
                            onClick={() => openSuspendModal(user)}
                            variant="outline"
                            size="sm"
                            className="w-full border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Suspend
                          </Button>
                          <Button
                            onClick={() => handleDeactivateClick(user._id, user.name)}
                            variant="outline"
                            size="sm"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Deactivate
                          </Button>
                        </>
                      )}
                      {user.status === 'suspended' && (
                        <>
                          <Button
                            onClick={() => handleUnsuspendUser(user._id)}
                            variant="outline"
                            size="sm"
                            className="w-full border-green-200 text-green-600 hover:bg-green-50"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            <Unlock className="h-3 w-3 mr-1" />
                            Unsuspend
                          </Button>
                          <Button
                            onClick={() => handleDeactivateClick(user._id, user.name)}
                            variant="outline"
                            size="sm"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Deactivate
                          </Button>
                        </>
                      )}
                      {user.status === 'deleted' && (
                        <Button
                          onClick={() => handleReactivateClick(user._id)}
                          variant="outline"
                          size="sm"
                          className="w-full border-green-200 text-green-600 hover:bg-green-50"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          <Unlock className="h-3 w-3 mr-1" />
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredUsers.length === 0 && users.length > 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>No users found</p>
              <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Try adjusting your search terms</p>
            </div>
          )}

          {users.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>No users found</h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>There are no users in the system yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspend User Modal */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <Ban className="h-5 w-5 text-yellow-600" />
              Suspend User Account
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">Suspending:</p>
                <p className="text-sm text-gray-900 font-semibold">{selectedUser.name}</p>
                <p className="text-xs text-gray-600">{selectedUser.email}</p>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">About Suspension:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>User CAN still login to view their account</li>
                    <li>User CANNOT buy or sell products</li>
                    <li>User can submit an appeal</li>
                    <li>This is temporary - different from Deactivate</li>
                  </ul>
                </div>
              </div>

              {/* Reason Field */}
              <div>
                <Label htmlFor="suspend-reason" className="text-gray-700 font-medium">
                  Reason for Suspension <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="suspend-reason"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g., Violation of terms of service, inappropriate behavior, fraudulent activity..."
                  className="mt-2"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be shown to the user
                </p>
              </div>

              {/* Expiry Date (Optional) */}
              <div>
                <Label htmlFor="suspension-expiry" className="text-gray-700 font-medium">
                  Suspension Expiry (Optional)
                </Label>
                <Input
                  id="suspension-expiry"
                  type="date"
                  value={suspensionExpiry}
                  onChange={(e) => setSuspensionExpiry(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for indefinite suspension (requires manual unsuspend)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSuspendUser}
                  disabled={!suspendReason.trim() || isSuspending}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {isSuspending ? 'Suspending...' : 'Suspend User'}
                </Button>
                <Button
                  onClick={() => setSuspendModalOpen(false)}
                  variant="outline"
                  disabled={isSuspending}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setUserToDeactivate(null);
        }}
        onConfirm={handleDeactivateUser}
        title="Confirm Deactivation"
        description={`Are you sure you want to DEACTIVATE ${userToDeactivate?.name}? This will permanently block their login access. This action is different from suspension.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        confirmVariant="destructive"
      />

      {/* Reactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showReactivateModal}
        onClose={() => {
          setShowReactivateModal(false);
          setUserToReactivate(null);
        }}
        onConfirm={handleReactivateUser}
        title="Confirm Reactivation"
        description="Are you sure you want to reactivate this deactivated account? The user will be able to login again."
        confirmText="Reactivate"
        cancelText="Cancel"
        confirmVariant="default"
      />
    </div>
  );
};

export default UserManagement;