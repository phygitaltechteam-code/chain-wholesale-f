import {Link, useNavigate} from '@tanstack/react-router';
import React, {useState} from 'react';
import {
  MdArrowBack,
  MdPerson,
  MdLock,
  MdVisibilityOff,
  MdVisibility,
  MdLogin,
} from 'react-icons/md';

const SignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen justify-center bg-[#132210]">
      <div className="flex min-h-screen w-full flex-col bg-[#132210]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 flex w-full items-center justify-center bg-[#132210]/90 px-6 pb-4 pt-12 backdrop-blur-sm">
          {/* <button className="hover:bg-gray-200 -ml-2 rounded-full p-2 text-white transition-colors">
            <MdArrowBack className="text-2xl" />
          </button> */}
          <div className="text-sm font-bold uppercase tracking-wide text-[#37ec13]/80">
            Gold Trader Pro
          </div>
          {/* <button className="text-sm font-medium text-white transition-colors hover:text-[#37ec13]">
            Sign Up
          </button> */}
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col justify-center px-6 pb-8">
          <div className="mb-10">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
              Welcome Back
            </h1>
            <p className="text-white">
              Login to your institutional-grade portfolio securely.
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Email/Phone Field */}
            <div className="group relative">
              <label className="sr-only" htmlFor="identifier">
                Email or Phone Number
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MdPerson className="text-xl text-white transition-colors group-focus-within:text-[#37ec13]" />
              </div>
              <input
                className="placeholder-gray-400 block w-full rounded-full border-transparent bg-[#223b1d] py-4 pl-12 pr-4 text-sm font-medium text-white shadow-sm transition-all focus:border-[#37ec13] focus:ring-1 focus:ring-[#37ec13]"
                id="identifier"
                name="identifier"
                placeholder="Email or Phone Number"
                type="text"
              />
            </div>

            {/* Password Field */}
            <div className="group relative">
              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MdLock className="text-xl text-white transition-colors group-focus-within:text-[#37ec13]" />
              </div>
              <input
                className="placeholder-gray-400 block w-full rounded-full border-transparent bg-[#223b1d] py-4 pl-12 pr-12 text-sm font-medium text-white shadow-sm transition-all focus:border-[#37ec13] focus:ring-1 focus:ring-[#37ec13]"
                id="password"
                name="password"
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
              />
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-white transition-colors hover:text-white focus:outline-none"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <MdVisibility className="text-xl" />
                ) : (
                  <MdVisibilityOff className="text-xl" />
                )}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center">
                <input
                  className="border-gray-600 h-4 w-4 cursor-pointer rounded accent-[#37ec13] hover:accent-[#2ed10f] focus:ring-[#37ec13]"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                />
                <label
                  className="ml-2 block text-sm text-white"
                  htmlFor="remember-me"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a
                  className="font-medium text-[#37ec13] transition-colors hover:text-[#37ec13]/80"
                  href="#"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={() => {
                navigate({to: '/market'});
              }}
              className="group mt-2 flex w-full transform items-center justify-center rounded-full bg-[#37ec13] px-6 py-4 font-bold text-[#132210] shadow-lg shadow-[#37ec13]/20 transition-all hover:bg-opacity-90 active:scale-[0.98]"
              type="submit"
            >
              Log In
              <MdLogin className="ml-2 text-lg transition-transform group-hover:translate-x-1" />
            </button>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-white">
                Don't have an account?
                <Link
                  className="ml-1 font-bold text-[#37ec13] hover:underline"
                  to="/signup"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-white">
            Secure • Regulated • Trusted
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SignIn;
