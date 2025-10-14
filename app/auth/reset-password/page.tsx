"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const em = searchParams?.get('email') || '';
    const tk = searchParams?.get('token') || '';
    setEmail(em);
    setToken(tk);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!password) return setError('Password is required');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      setSuccess('Password updated. Redirecting to login...');
      setTimeout(() => router.push('/auth'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <Label className="block text-sm font-medium text-gray-700 mb-2">New Password</Label>
        <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mb-3" />
        <Label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</Label>
        <Input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="mb-3" />
        <Button type="submit" disabled={loading} className="w-full mt-2">{loading ? 'Updating...' : 'Update Password'}</Button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
