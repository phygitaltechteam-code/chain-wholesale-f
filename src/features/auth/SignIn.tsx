// pages/SignInPage.tsx
import { Link, useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gem,
  Lock,
  ArrowRight,
  LayoutGrid,
  User,
  Smartphone,
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useLogin } from '@/lib/api/auth';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/context/AuthContext';

type Tab = 'LOGIN' | 'REGISTER';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    companyName: '',
    ownerName: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });

  const { mutateAsync: login, isPending, isSuccess } = useLogin();
  const { user, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (isSuccess || isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [isSuccess, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Attempting login with:', credentials);

    if (!credentials.username || !credentials.password) {
      toast.error('Please enter username and password');
      return;
    }

    try {
      await login({
        username: credentials.username,
        password: credentials.password,
      });
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Registration successful! Please login.');
    setActiveTab('LOGIN');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 selection:bg-amber-500/30 overflow-hidden">
      {/* Header / Logo Section - Compact */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center flex-shrink-0"
      >
        <div className="mb-1 flex items-center justify-center gap-2">
          <Gem className="h-8 w-8 text-amber-500" />
          <h1 className="font-serif text-3xl font-bold tracking-tight text-amber-400">
            Sona ERP
          </h1>
        </div>
        <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-slate-400">
          The Gilded Ledger
        </p>
      </motion.div>

      {/* Main Card - Compact */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50 shadow-2xl backdrop-blur-xl flex-shrink-0"
      >
        {/* Tabs - Compact */}
        <div className="flex border-b border-slate-700/50">
          {(['LOGIN', 'REGISTER'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 py-3 text-[10px] font-semibold tracking-widest transition-all ${activeTab === tab
                  ? 'text-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500"
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'LOGIN' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="mb-3 text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                    <Lock className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="text-base font-medium text-slate-200">
                    Welcome Back
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sign in to your account
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  <InputField
                    label="USERNAME / PHONE"
                    name="username"
                    placeholder="Enter your username"
                    icon={<User className="h-3.5 w-3.5" />}
                    value={credentials.username}
                    onChange={handleInputChange}
                    autoComplete="username"
                  />

                  <InputField
                    label="PASSWORD"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    icon={<Lock className="h-3.5 w-3.5" />}
                    value={credentials.password}
                    onChange={handleInputChange}
                    autoComplete="current-password"
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5 text-slate-500 hover:text-amber-400" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-slate-500 hover:text-amber-400" />
                        )}
                      </button>
                    }
                  />

                  <div className="flex items-center justify-end">
                    <a
                      href="#"
                      className="text-[9px] text-amber-500/70 transition-colors hover:text-amber-400"
                    >
                      Forgot Password?
                    </a>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isPending}
                    className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 font-bold text-amber-950 shadow-lg shadow-amber-900/20 transition-all hover:from-amber-500 hover:to-amber-400"
                  >
                    <span className="text-xs uppercase tracking-widest">
                      {isPending ? 'Signing in...' : 'Sign In'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="mb-1 text-center">
                  <h3 className="text-base font-medium text-slate-200">
                    Register Company
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create your business account
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-2.5">
                  <InputField
                    label="COMPANY NAME"
                    name="companyName"
                    placeholder="Goldsmith & Co."
                    icon={<Building2 className="h-3.5 w-3.5" />}
                    value={registerData.companyName}
                    onChange={handleRegisterChange}
                    required
                    autoComplete="organization"
                  />

                  <InputField
                    label="OWNER NAME"
                    name="ownerName"
                    placeholder="Julian Sterling"
                    icon={<User className="h-3.5 w-3.5" />}
                    value={registerData.ownerName}
                    onChange={handleRegisterChange}
                    required
                    autoComplete="name"
                  />

                  <InputField
                    label="MOBILE NUMBER"
                    name="mobileNumber"
                    placeholder="+91 98765 43210"
                    icon={<Smartphone className="h-3.5 w-3.5" />}
                    value={registerData.mobileNumber}
                    onChange={handleRegisterChange}
                    required
                    autoComplete="tel"
                  />

                  <InputField
                    label="PASSWORD"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock className="h-3.5 w-3.5" />}
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    autoComplete="new-password"
                  />

                  <InputField
                    label="CONFIRM PASSWORD"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock className="h-3.5 w-3.5" />}
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                    autoComplete="new-password"
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 font-bold text-amber-950 shadow-lg shadow-amber-900/20 transition-all hover:from-amber-500 hover:to-amber-400"
                  >
                    <span className="text-xs uppercase tracking-widest">
                      Register
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </motion.button>

                  <p className="mt-2 text-center text-[8px] text-slate-500">
                    By registering, you agree to our{' '}
                    <a
                      href="#"
                      className="text-amber-500/80 transition-colors hover:text-amber-400"
                    >
                      Terms of Service
                    </a>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Decorative Footer - Compact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-center gap-4 opacity-30 flex-shrink-0"
      >
        <div className="h-[1px] w-10 bg-slate-600" />
        <LayoutGrid className="h-3 w-3 text-slate-500" />
        <div className="h-[1px] w-10 bg-slate-600" />
      </motion.div>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  name: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rightIcon?: React.ReactNode;
  required?: boolean;
  autoComplete?: string;
}

function InputField({
  label,
  name,
  placeholder,
  icon,
  type = 'text',
  value,
  onChange,
  rightIcon,
  required = false,
  autoComplete,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 text-[8px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="group relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-amber-500">
          {icon}
        </div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 py-2.5 pl-10 pr-10 text-sm text-slate-200 transition-all placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  );
}

export default SignIn;