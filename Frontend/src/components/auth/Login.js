import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/Login.css";

const Login = ({ showAlert }) => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // If previously opted to remember, load from localStorage
    const saved = localStorage.getItem("loginCreds");
    if (saved) {
      setCredentials(JSON.parse(saved));
    }
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const json = await response.json();
      if (json.authtoken) {
        // Save token
        localStorage.setItem("token", json.authtoken);
        // Handle remember me
        if (credentials.remember) {
          localStorage.setItem("loginCreds", JSON.stringify(credentials));
        } else {
          localStorage.removeItem("loginCreds");
        }
        showAlert("Logged in successfully", "success");
        navigate("/channel");
      } else {
        showAlert("Invalid credentials", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("An error occurred", "danger");
    }
  };

  return (
    <div className="background">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Enter your email"
              value={credentials.email}
              onChange={onChange}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={onChange}
              required
            />
          </div>

          <div className="remember-forgot">
            <div>
              <input
                type="checkbox"
                name="remember"
                id="remember"
                checked={credentials.remember}
                onChange={onChange}
              />{' '}
              <label htmlFor="remember">Remember Me</label>
            </div>
            <Link to="/forgotpassword">Forgot Password?</Link>
          </div>

          <button type="submit">Log In</button>
        </form>
        <div className="text-center">
          Need an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;