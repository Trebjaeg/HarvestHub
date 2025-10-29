'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Mail, 
  Calendar,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download
} from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin' | 'superadmin';
  status: 'active' | 'suspended' | 'inactive';
  isVerified: boolean;
  createdAt: string;
  lastActive?: string;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    zipCode?: string;
  };
  phoneNumber?: string;
  isEmailVerified: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockUsers: User[] = [
        {
          _id: '1',
          firstName: 'Maria',
          lastName: 'Santos',
          email: 'maria.santos@email.com',
          role: 'buyer',
          status: 'active',
          isVerified: true,
          isEmailVerified: true,
          createdAt: '2025-01-10T08:30:00Z',
          lastActive: '2025-01-15T16:45:00Z',
          phoneNumber: '+63 912 345 6789',
          address: {
            street: '123 Main St',
            city: 'Quezon City',
            province: 'Metro Manila',
            zipCode: '1100'
          }
        },
        {
          _id: '2',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          email: 'juan.delacruz@email.com',
          role: 'seller',
          status: 'active',
          isVerified: true,
          isEmailVerified: true,
          createdAt: '2025-01-08T14:20:00Z',
          lastActive: '2025-01-15T12:30:00Z',
          phoneNumber: '+63 917 555 1234',
          address: {
            street: '456 Farm Road',
            city: 'Baguio City',
            province: 'Benguet',
            zipCode: '2600'
          }
        },
        {
          _id: '3',
          firstName: 'Ana',
          lastName: 'Reyes',
          email: 'ana.reyes@email.com',
          role: 'buyer',
          status: 'suspended',
          isVerified: false,
          isEmailVerified: true,
          createdAt: '2025-01-12T11:45:00Z',
          lastActive: '2025-01-14T09:15:00Z',
          phoneNumber: '+63 920 123 4567'
        },
        {
          _id: '4',
          firstName: 'Carlos',
          lastName: 'Mendoza',
          email: 'carlos.mendoza@email.com',
          role: 'seller',
          status: 'active',
          isVerified: true,
          isEmailVerified: false,
          createdAt: '2025-01-05T16:30:00Z',
          lastActive: '2025-01-15T18:20:00Z',
          phoneNumber: '+63 915 987 6543',
          address: {
            street: '789 Agriculture Ave',
            city: 'Davao City',
            province: 'Davao del Sur',
            zipCode: '8000'
          }
        },
        {
          _id: '5',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@harvesthub.ph',
          role: 'admin',
          status: 'active',
          isVerified: true,
          isEmailVerified: true,
          createdAt: '2025-01-01T00:00:00Z',
          lastActive: '2025-01-15T20:00:00Z'
        }
      ];
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'seller': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'superadmin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'suspended': return <Ban className="w-4 h-4" />;
      case 'inactive': return <UserX className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleUserAction = (userId: string, action: 'suspend' | 'activate' | 'delete' | 'verify') => {
    // Implement user actions here
    console.log(`Performing ${action} on user ${userId}`);
    
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (user._id === userId) {
          switch (action) {
            case 'suspend':
              return { ...user, status: 'suspended' as const };
            case 'activate':
              return { ...user, status: 'active' as const };
            case 'verify':
              return { ...user, isVerified: true };
            default:
              return user;
          }
        }
        return user;
      })
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            User Management
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    suspendedUsers: users.filter(u => u.status === 'suspended').length,
    verifiedUsers: users.filter(u => u.isVerified).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            User Management
          </h2>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Manage all users in the HarvestHub platform
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Users</span>
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Users className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspendedUsers}</p>
              </div>
              <Ban className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-blue-600">{stats.verifiedUsers}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Roles</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
                <option value="admin">Admins</option>
                <option value="superadmin">Super Admins</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Users ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                No users found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className={`${getRoleColor(user.role)} text-xs`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        <Badge className={`${getStatusColor(user.status)} text-xs`}>
                          {getStatusIcon(user.status)}
                          <span className="ml-1 capitalize">{user.status}</span>
                        </Badge>
                        {user.isVerified && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {!user.isEmailVerified && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            <Mail className="w-3 h-3 mr-1" />
                            Email Unverified
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        {user.lastActive && (
                          <div className="flex items-center space-x-1">
                            <UserCheck className="w-4 h-4" />
                            <span>Last active {formatTimeAgo(user.lastActive)}</span>
                          </div>
                        )}
                        {user.phoneNumber && (
                          <div className="flex items-center space-x-1">
                            <span>{user.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                      
                      {user.address && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span>Address: </span>
                          <span>{user.address.city}, {user.address.province}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      {user.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user._id, 'suspend')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user._id, 'activate')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Activate
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full justify-start">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Bulk Actions
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="w-4 h-4 mr-2" />
              Send Notifications
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;