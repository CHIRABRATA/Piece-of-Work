import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const SignUpUI = ({ regNo, setRegNo, email, setEmail, password, setPassword, error, isSubmitting, handleSubmit, toggleView }) => {
  return (
    <div className="w-full selection:bg-purple-500/30">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative z-10 w-full max-w-[420px] p-12 bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-2xl"
      >
        <div className="text-left mb-10">
          <h2 className="text-5xl font-bold text-white tracking-tight leading-tight">
            New <br />
            <span className="text-purple-400">Account</span>
          </h2>
          <p className="text-slate-400 mt-4 text-sm font-light tracking-wide">
            Register your student details
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 text-xs text-center font-medium">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Registration Number"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              className="w-full px-7 py-5 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 focus:border-purple-500/50 outline-none text-sm"
              required
            />
            <input
              type="email"
              placeholder="University Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-7 py-5 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 focus:border-purple-500/50 outline-none text-sm"
              required
            />
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-7 py-5 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 focus:border-purple-500/50 outline-none text-sm"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 mt-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-base shadow-lg disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "Registering..." : "Create Account"}
          </button>
        </form>

        {/* THIS IS THE REVERSE SWITCH BUTTON */}
        <p className="mt-8 text-center text-slate-500 text-sm">
          Already have an account?{" "}
          <button 
            type="button" 
            onClick={toggleView} 
            className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Sign In
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUpUI;