'use client';

import { useActionState, useState } from 'react';
import { signin } from '@/src/actions/auth';
import Link from 'next/link';
import { AlertCircle, CheckCircle } from 'lucide-react';

// Validation functions
const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!/\d/.test(password)) return 'Password must contain at least 1 number';
  return null;
};

export default function LoginPage() {
  const [state, action, isPending] = useActionState(signin, undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value.trim()) {
      setEmailError(validateEmail(value));
    } else {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      setPasswordError(validatePassword(value));
    } else {
      setPasswordError(null);
    }
  };

  const isFormValid = email.trim() && password && !emailError && !passwordError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans text-foreground">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/40">

        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/30">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-800">Welcome Back</h1>
          <p className="text-stone-500 mt-2">Sign in to your account</p>
        </div>

        {/* Server Error */}
        {state?.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm">{state.error}</p>
          </div>
        )}

        <form action={action} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition text-stone-800 placeholder:text-stone-400
                  ${emailError
                    ? 'border-red-500 focus:ring-red-400 bg-red-50'
                    : email && !emailError
                      ? 'border-green-500 focus:ring-green-400 bg-green-50'
                      : 'border-stone-200 bg-white/50 focus:border-primary focus:ring-primary/20'
                  }`}
              />
              {email && !emailError && <CheckCircle className="absolute right-3 top-3 text-green-500" size={20} />}
            </div>
            {emailError && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} /> {emailError}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Your password"
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition text-stone-800 placeholder:text-stone-400
                  ${passwordError
                    ? 'border-red-500 focus:ring-red-400 bg-red-50'
                    : password && !passwordError
                      ? 'border-green-500 focus:ring-green-400 bg-green-50'
                      : 'border-stone-200 bg-white/50 focus:border-primary focus:ring-primary/20'
                  }`}
              />
              {password && !passwordError && <CheckCircle className="absolute right-3 top-3 text-green-500" size={20} />}
            </div>
            {passwordError && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} /> {passwordError}
              </p>
            )}
            {password && !passwordError && (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <CheckCircle size={16} /> Password looks good
              </p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isPending || !isFormValid}
            className="w-full bg-primary text-white p-3 rounded-xl font-semibold hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed mt-6 disabled:shadow-none"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-8 text-center text-sm text-stone-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary font-bold hover:text-primary/80 underline decoration-2 decoration-primary/30 underline-offset-2">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
