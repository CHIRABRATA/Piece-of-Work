import { useState } from "react";
import { useAuth } from "../context/mainContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regNo, setRegNo] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth(); // <--- consuming the Context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password, regNo);
      // Context listener in mainContext.jsx will detect the login and update 'user' state automatically
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "50px", color: "white", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "350px" }}>
        <h2 style={{ marginBottom: "20px" }}>Login</h2>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input 
            placeholder="Reg No (e.g., 2024CS01)" 
            value={regNo} onChange={(e) => setRegNo(e.target.value)} 
            required style={inputStyle}
          />
          <input 
            type="email" placeholder="Email" 
            value={email} onChange={(e) => setEmail(e.target.value)} 
            required style={inputStyle}
          />
          <input 
            type="password" placeholder="Password" 
            value={password} onChange={(e) => setPassword(e.target.value)} 
            required style={inputStyle}
          />
          <button type="submit" disabled={isSubmitting} style={btnStyle}>
            {isSubmitting ? "Verifying..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
};

const inputStyle = { padding: "12px", background: "#222", border: "1px solid #444", color: "white", borderRadius: "5px" };
const btnStyle = { padding: "12px", background: "#007bff", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" };

export default Login;