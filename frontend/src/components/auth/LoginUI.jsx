import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const LoginUI = ({ regNo, setRegNo, email, setEmail, password, setPassword, error, isSubmitting, handleSubmit, toggleView }) => {

  const navigate = useNavigate()
  return (
    <div className="h-180 w-full selection:bg-purple-500/30">
      
      {/* Login Card with Shake Animation on Error */}
      <motion.div 
        initial={!isMobile ? { opacity: 0, x: -20 } : { opacity: 0, y: 20 }}
        animate={error && !isMobile ? { x: [-2, 2, -2, 2, 0], opacity: 1 } : { opacity: 1, x: 0, y: 0 }}
        transition={{ duration: isMobile ? 0.2 : 0.4 }}
        className="relative z-10 w-full max-w-[420px] p-8 md:p-12 bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-2xl"
      >
        {/* Header Section */}
        <div className="text-left mb-8 md:mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Campus <br />
            <span className="text-blue-400">Connect</span>
          </h2>
          <p className="text-slate-400 mt-3 md:mt-4 text-xs md:text-sm font-light tracking-wide">
            Sign in to your student portal
          </p>
        </div>

        {/* Error Message Box */}
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

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
          <div className="space-y-3 md:space-y-4">
            <input
              type="text"
              placeholder="Registration Number"
              value={regNo}
              onChange={handleRegNoChange}
              className="w-full px-5 md:px-7 py-4 md:py-5 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 focus:border-blue-500/50 outline-none transition-colors duration-200 text-sm"
              required
              disabled={isSubmitting}
            />
            <input
              type="email"
              placeholder="University Email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-5 md:px-7 py-4 md:py-5 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 focus:border-blue-500/50 outline-none transition-colors duration-200 text-sm"
              required
              disabled={isSubmitting}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-5 md:px-7 py-4 md:py-5 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 focus:border-blue-500/50 outline-none transition-colors duration-200 text-sm"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <motion.button
            whileHover={!isMobile ? { brightness: 1.1 } : undefined}
            whileTap={!isMobile ? { scale: 0.99 } : { scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 md:py-5 mt-3 md:mt-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-base shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 md:gap-3">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : "Enter Campus"}
          </motion.button>
        </form>

        {/* Toggle View Link */}
        <p className="mt-4 text-center text-slate-500 text-sm">
          Don't have an account?{" "}
          <button 
            type="button" 
            onClick={toggleView} 
            disabled={isSubmitting}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium active:opacity-70"
          >
            Create one
          </button>
        </p>
        {/* <div style={{ marginTop: "20px", textAlign: "center", zIndex : "12" }}> */}
            <p style={{ marginTop: "20px", textAlign: "center", zIndex : "12", color: "#666", fontSize: "14px" }}>
                Trouble logging in?{" "}
                <span 
                    onClick={() => navigate('/feedback')} 
                    style={{ color: "#05d9e8", cursor: "pointer", fontWeight: "bold", textDecoration : "underline" }}
                >
                    Report Issue
                </span>
            </p>
        {/* </div> */}

        {/* Footer Text */}
        <footer className="mt-10 text-center">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-semibold opacity-40">
            Secure Student Access
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

export default LoginUI;