'use client';

import { useActionState, useState } from 'react';
import { signup } from '@/src/actions/auth';
import Link from 'next/link';
import { AlertCircle, CheckCircle } from 'lucide-react';

// Validation functions
const validateFirstName = (name: string): string | null => {
  if (!name.trim()) return 'First name is required';
  if (name.trim().length < 2) return 'First name must be at least 2 characters';
  return null;
};

const validateLastName = (name: string): string | null => {
  if (!name.trim()) return 'Last name is required';
  if (name.trim().length < 1) return 'Last name must be at least 2 characters';
  return null;
};

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

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/\d/.test(password)) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { label: 'Good', color: 'bg-yellow-500' };
  return { label: 'Strong', color: 'bg-green-500' };
};

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(signup, undefined);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirstName(value);
    if (value.trim()) {
      setFirstNameError(validateFirstName(value));
    } else {
      setFirstNameError(null);
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLastName(value);
    if (value.trim()) {
      setLastNameError(validateLastName(value));
    } else {
      setLastNameError(null);
    }
  };

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

  const passwordStrength = password ? getPasswordStrength(password) : null;
  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    password &&
    !firstNameError &&
    !lastNameError &&
    !emailError &&
    !passwordError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans text-foreground">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/40">

        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/30">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-800">Create Account</h1>
          <p className="text-stone-500 mt-2">Join to manage your tasks</p>
        </div>

        {state?.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm">{state.error}</p>
          </div>
        )}

        <form action={action} className="space-y-4">

          {/* First Name */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              First Name
            </label>
            <div className="relative">
              <input
                name="firstName"
                type="text"
                value={firstName}
                onChange={handleFirstNameChange}
                placeholder="John"
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition text-stone-800 placeholder:text-stone-400
                  ${firstNameError
                    ? 'border-red-500 focus:ring-red-400 bg-red-50'
                    : firstName && !firstNameError
                      ? 'border-green-500 focus:ring-green-400 bg-green-50'
                      : 'border-stone-200 bg-white/50 focus:border-primary focus:ring-primary/20'
                  }`}
              />
              {firstName && !firstNameError && <CheckCircle className="absolute right-3 top-3 text-green-500" size={20} />}
            </div>
            {firstNameError && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} /> {firstNameError}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Last Name
            </label>
            <div className="relative">
              <input
                name="lastName"
                type="text"
                value={lastName}
                onChange={handleLastNameChange}
                placeholder="Doe"
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition text-stone-800 placeholder:text-stone-400
                  ${lastNameError
                    ? 'border-red-500 focus:ring-red-400 bg-red-50'
                    : lastName && !lastNameError
                      ? 'border-green-500 focus:ring-green-400 bg-green-50'
                      : 'border-stone-200 bg-white/50 focus:border-primary focus:ring-primary/20'
                  }`}
              />
              {lastName && !lastNameError && <CheckCircle className="absolute right-3 top-3 text-green-500" size={20} />}
            </div>
            {lastNameError && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} /> {lastNameError}
              </p>
            )}
          </div>

          {/* Email */}
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

          {/* Password */}
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
                placeholder="Min 6 chars, with 1 number"
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

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-stone-600">Strength:</span>
                  <div className="flex-1 bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${passwordStrength?.color}`}
                      style={{
                        width: passwordStrength ? `${(password.length / 15) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${passwordStrength?.color === 'bg-green-500' ? 'text-green-600' : passwordStrength?.color === 'bg-yellow-500' ? 'text-yellow-600' : passwordStrength?.color === 'bg-orange-500' ? 'text-orange-600' : 'text-red-600'}`}>
                    {passwordStrength?.label}
                  </span>
                </div>
              </div>
            )}

            {passwordError && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} /> {passwordError}
              </p>
            )}
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isPending || !isFormValid}
            className="w-full bg-primary text-white p-3 rounded-xl font-semibold hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed mt-6 disabled:shadow-none"
          >
            {isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-stone-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold hover:text-primary/80 underline decoration-2 decoration-primary/30 underline-offset-2">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
