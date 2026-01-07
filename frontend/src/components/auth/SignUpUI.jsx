import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SignUpUI = ({ regNo, setRegNo, email, setEmail, password, setPassword, error, isSubmitting, handleSubmit, toggleView, isMobile }) => {
  // Memoize handlers to prevent unnecessary re-renders
  const handleRegNoChange = useCallback((e) => setRegNo(e.target.value), [setRegNo]);
  const handleEmailChange = useCallback((e) => setEmail(e.target.value), [setEmail]);
  const handlePasswordChange = useCallback((e) => setPassword(e.target.value), [setPassword]);

  return (
    <div className="w-full selection:bg-purple-500/30">
      <motion.div 
        initial={!isMobile ? { opacity: 0, x: 20 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: isMobile ? 0.2 : 0.4 }}
        className="relative z-10 w-full max-w-[420px] p-8 md:p-12 bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-2xl"
      >
        <div className="text-left mb-8 md:mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            New <br />
            <span className="text-purple-400">Account</span>
          </h2>
          <p className="text-slate-400 mt-3 md:mt-4 text-xs md:text-sm font-light tracking-wide">
            Register your student details
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: isMobile ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: isMobile ? 1 : 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 text-xs text-center font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
          <div className="space-y-3 md:space-y-4">
            <input
              type="text"
              placeholder="Registration Number"
              value={regNo}
              onChange={handleRegNoChange}
              className="w-full px-5 md:px-7 py-4 md:py-5 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 focus:border-purple-500/50 outline-none transition-colors duration-200 text-sm"
              required
              disabled={isSubmitting}
            />
            <input
              type="email"
              placeholder="University Email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-5 md:px-7 py-4 md:py-5 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 focus:border-purple-500/50 outline-none transition-colors duration-200 text-sm"
              required
              disabled={isSubmitting}
            />
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-5 md:px-7 py-4 md:py-5 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 focus:border-purple-500/50 outline-none transition-colors duration-200 text-sm"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <motion.button
            whileTap={!isMobile ? { scale: 0.99 } : { scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 md:py-5 mt-3 md:mt-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-base shadow-lg disabled:opacity-50 transition-all active:scale-95"
          >
            {isSubmitting ? "Registering..." : "Create Account"}
          </motion.button>
        </form>

        {/* THIS IS THE REVERSE SWITCH BUTTON */}
        <p className="mt-6 md:mt-8 text-center text-slate-500 text-xs md:text-sm">
          Already have an account?{" "}
          <button 
            type="button" 
            onClick={toggleView} 
            disabled={isSubmitting}
            className="text-purple-400 hover:text-purple-300 transition-colors font-medium active:opacity-70"
          >
            Sign In
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUpUI;