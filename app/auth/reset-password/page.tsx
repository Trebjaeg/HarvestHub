"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';

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
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const em = searchParams?.get('email') || '';
    const tk = searchParams?.get('token') || '';
    setEmail(em);
    setToken(tk);
    
    // Clear any previous states that might cause issues
    setError(null);
    setSuccess(null);
    setLoading(false);
    setIsResetting(false);
    
    // Force clear any body styles that might be set by modals
    document.body.style.overflow = 'unset';
    document.body.style.position = 'static';
    
    // Remove any overlay elements that might be stuck
    const overlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"], [class*="z-50"], [class*="z-[70]"], [class*="modal"]');
    overlays.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    
    // Cleanup function to reset states when component unmounts
    return () => {
      setLoading(false);
      setIsResetting(false);
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading || isResetting) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setIsResetting(true);
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      // Success - show toast and redirect
      setSuccess('Password updated successfully! Redirecting to login...');
      toast.success('Password reset successful! Please log in with your new password.');
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      setError(null);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reset password';
      setError(errorMessage);
      setLoading(false);
      setIsResetting(false);
      
      // Show error toast
      toast.error(errorMessage);
    } finally {
      // Ensure loading states are cleared after a maximum timeout
      setTimeout(() => {
        setLoading(false);
        setIsResetting(false);
      }, 5000);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
        
        <form onSubmit={handleSubmit}>
          <Label className="block text-sm font-medium text-gray-700 mb-2">New Password</Label>
          <Input 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            className="mb-3"
            disabled={isResetting}
            placeholder="Enter your new password (min. 8 characters)"
          />
          <Label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</Label>
          <Input 
            type="password" 
            value={confirmPassword} 
            onChange={e=>setConfirmPassword(e.target.value)} 
            className="mb-3"
            disabled={isResetting}
            placeholder="Confirm your new password"
          />
          <Button 
            type="submit" 
            disabled={loading || isResetting || !password || !confirmPassword} 
            className="w-full mt-2"
          >
            {loading ? 'Updating Password...' : success ? 'Success! Redirecting...' : 'Update Password'}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
      </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
      <Toaster 
        position="top-center"
        richColors
        closeButton
        duration={4000}
      />
    </div>
  );
}
