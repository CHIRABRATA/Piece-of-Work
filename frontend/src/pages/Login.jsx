import { useState } from "react";
import { useAuth } from "../context/mainContext";
import LoginUI from "../components/auth/LoginUI";
import LightPillar from "../components/LightPillar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regNo, setRegNo] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password, regNo);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

 return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050505]">
      
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LightPillar
          topColor="#5227FF"
          bottomColor="#FF9FFC"
          intensity={1.2}
          rotationSpeed={0.35}
          glowAmount={0.008}
          pillarWidth={3.5}
          pillarHeight={0.5}
          noiseIntensity={0.6}
          interactive={false}
        />
      </div>

      {/* FOREGROUND LAYER - CENTERED ALIGNMENT */}
      {/* Changed 'justify-start pl-20' to 'justify-center' */}
      <main className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="w-full max-w-md px-4"> 
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
          />
        </div>
      </main>

    </div>
  );
};

export default Login;