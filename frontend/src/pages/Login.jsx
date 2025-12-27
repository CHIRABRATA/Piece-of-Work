import { useState } from "react";
import { useAuth } from "../context/mainContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regNo, setRegNo] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password, regNo);
      navigate("/"); // Redirect to Dashboard on success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Campus Connect Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <input 
          placeholder="Reg No (e.g., 2024CS01)" 
          value={regNo} onChange={(e) => setRegNo(e.target.value)} 
          required style={styles.input}
        />
        <input 
          type="email" placeholder="Email" 
          value={email} onChange={(e) => setEmail(e.target.value)} 
          required style={styles.input}
        />
        <input 
          type="password" placeholder="Password" 
          value={password} onChange={(e) => setPassword(e.target.value)} 
          required style={styles.input}
        />
        <button type="submit" disabled={isSubmitting} style={styles.btn}>
          {isSubmitting ? "Verifying..." : "Enter Campus"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { padding: "50px", color: "white", backgroundColor: "#121212", minHeight: "100vh" },
  form: { maxWidth: "400px", display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "10px", background: "#222", border: "1px solid #444", color: "white" },
  btn: { padding: "12px", background: "#007bff", color: "white", border: "none", cursor: "pointer" }
};

export default Login;