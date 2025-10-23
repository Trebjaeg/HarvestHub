'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDots from '@/components/ui/LoadingDots';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
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
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    // Optimistic update - update UI immediately
    const newStatus = isActive ? 'suspended' : 'active';
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      )
    );
    setFilteredUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      )
    );

    try {
      const action = isActive ? 'suspend' : 'activate';
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: action,
          userId: userId,
          reason: `User ${action}d by admin`
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        const originalStatus = isActive ? 'active' : 'suspended';
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, status: originalStatus } : user
          )
        );
        setFilteredUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, status: originalStatus } : user
          )
        );
        throw new Error('Failed to update user status');
      }

      // Success - the optimistic update was correct, no need to change anything
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#16a34a" />
          </div>
          <p className="text-gray-600">Loading users</p>
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
            <Button onClick={fetchUsers} className="mt-4" variant="outline">
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
          <Button onClick={fetchUsers} variant="outline" className="w-full sm:w-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Poppins, sans-serif' }}>
            User Management ({filteredUsers.length}
            {searchTerm && ` of ${users.length}`})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Joined</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {user.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'superadmin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'admin'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => toggleUserStatus(user._id, user.status === 'active')}
                        variant="outline"
                        size="sm"
                        className={user.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
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
                          : 'bg-red-100 text-red-800'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
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

                    <Button
                      onClick={() => toggleUserStatus(user._id, user.status === 'active')}
                      variant="outline"
                      size="sm"
                      className={`w-full ${user.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
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
    </div>
  );
};

export default UserManagement;