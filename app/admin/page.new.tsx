'use client';

import React from 'react';
import AdminDashboard from '../../components/admin/AdminDashboard';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const AdminPage: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
};

export default AdminPage;