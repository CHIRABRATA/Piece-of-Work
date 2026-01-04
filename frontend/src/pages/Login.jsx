import { useState } from "react";
import { useAuth } from "../context/mainContext";
import LoginUI from "../components/auth/LoginUI";
import SignUpUI from "../components/auth/SignUpUI"; // Import the new Sign Up UI
import LightPillar from "../components/LightPillar";

const Login = () => {
  // 1. Toggle State: true for Login, false for Sign Up
  const [isLoginView, setIsLoginView] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regNo, setRegNo] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLoginView) {
        // Run Login Logic
        await login(email, password, regNo);
      } else {
        // Run Sign Up Logic
        await signup(email, password, regNo);
      }
    } catch (err) {
      console.error(err);
      // Friendly error mapping
      const msg = err.code === 'auth/email-already-in-use' 
        ? "This email is already registered." 
        : err.message;
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset fields when switching views
  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError("");
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050505]">
      
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LightPillar
          // Change colors based on the mode for a nice visual cue
          topColor={isLoginView ? "#5227FF" : "#A855F7"} 
          bottomColor={isLoginView ? "#FF9FFC" : "#3B82F6"}
          intensity={1.0}
          rotationSpeed={0.55}
          glowAmount={0.001}
          pillarWidth={4.5}
          pillarHeight={1.5}
          noiseIntensity={0.1}
          interactive={false}
        />
      </div>

      {/* FOREGROUND LAYER */}
      <main className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="w-full max-w-md px-4"> 
          {isLoginView ? (
            <LoginUI
              regNo={regNo}
              setRegNo={setRegNo}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              error={error}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              toggleView={toggleView} // Pass toggle function
            />
          ) : (
            <SignUpUI
              regNo={regNo}
              setRegNo={setRegNo}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              error={error}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              toggleView={toggleView} // Pass toggle function
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;