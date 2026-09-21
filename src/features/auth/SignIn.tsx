import {Link, useNavigate} from '@tanstack/react-router';
import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {Lock, ArrowRight, User, Eye, EyeOff, Gem} from 'lucide-react';
import {useLogin} from '@/lib/api/auth';
import toast from 'react-hot-toast';
import {useAuthContext} from '@/context/AuthContext';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import logoImg from '@/assets/logo/logo1.png';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const {mutateAsync: login, isPending, isSuccess} = useLogin();
  const {user, isAuthenticated} = useAuthContext();

  useEffect(() => {
    if (isSuccess || isAuthenticated) {
      let currentRole = user?.role;
      if (!currentRole) {
        try {
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          currentRole = localUser?.role;
        } catch (e) {}
      }

      if (currentRole === 'SUPERADMIN' || currentRole === 'SuperAdmin') {
        window.location.href = '/addadmin';
      } else {
        window.location.href = '/reports/realtimegoldreport';
      }
    }
  }, [isSuccess, isAuthenticated, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setCredentials((prev) => ({...prev, [name]: value}));
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      {/* Main Card */}
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        transition={{delay: 0.1}}
        className="w-full max-w-[400px] flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl"
      >
        <div className="p-6 sm:p-8">
          <motion.div
            key="login"
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            className="space-y-5"
          >
            <div className="mb-4 text-center">
              {/* Logo */}
              <div className="mx-auto mb-4 flex w-full items-center justify-center">
                <img
                  src={logoImg}
                  alt="FineWt Logo"
                  className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                />
              </div>

              <h3 className="text-xl font-semibold text-slate-800">
                Welcome Back
              </h3>

              <p className="text-sm text-slate-500">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <InputField
                label="USERNAME / PHONE"
                name="username"
                placeholder="Enter your username"
                icon={<User className="h-4 w-4" />}
                value={credentials.username}
                onChange={handleInputChange}
                autoComplete="username"
              />

              <InputField
                label="PASSWORD"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
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
                      <EyeOff className="h-4 w-4 text-slate-400 transition-colors hover:text-[#785600]" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400 transition-colors hover:text-[#785600]" />
                    )}
                  </button>
                }
              />

              <GenericButton
                type="submit"
                disabled={isPending}
                variant="primary"
                size="lg"
                fullWidth
                className="!shadow-lg !shadow-[#785600]/25 hover:!shadow-[#785600]/35"
              >
                <span className="text-sm uppercase tracking-wider">
                  {isPending ? 'Signing in...' : 'Sign In'}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </GenericButton>
            </form>
          </motion.div>
        </div>
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
      <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <div className="group relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#785600]">
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
          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-11 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-[#785600] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#785600]/20"
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  );
}

export default SignIn;
