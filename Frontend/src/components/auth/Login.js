import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/Login.css";

const Login = ({ mode, showalert }) => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Apply dark/light theme to <body> (for future use if needed)
    document.body.setAttribute("data-theme", mode);

    // Set the background image
    const backgroundImage =
      mode === "dark"
        ? "/assets/darkmode.jpg"
        : "/assets/lightmode.jpg";

    document.body.style.backgroundImage = `url(${backgroundImage})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.height = "100vh";
    document.body.style.margin = "0";

    // Load saved credentials (if 'Remember Me' was checked)
    const savedCreds = localStorage.getItem("loginCreds");
    if (savedCreds) {
      setCredentials(JSON.parse(savedCreds));
    }
  }, [mode]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials({
      ...credentials,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const json = await response.json();
      if (json.authtoken) {
        // If login is successful
        if (credentials.remember) {
          localStorage.setItem("token", json.authtoken);
          localStorage.setItem("loginCreds", JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            remember: credentials.remember,
          }));
        } else {
          sessionStorage.setItem("token", json.authtoken);
          localStorage.removeItem("loginCreds");
        }
        showalert("Logged in successfully", "success");
        navigate("/");
      } else {
        showalert("Invalid credentials", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showalert("An error occurred", "danger");
    }
  };

  return (
    <div className={`login-container ${mode === "dark" ? "dark" : "light"}`}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            name="email"
            id="email"
            value={credentials.email}
            onChange={onChange}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={credentials.password}
            onChange={onChange}
          />
        </div>

        <button type="submit">Sign In</button>

        <div className="remember-forgot">
          <div>
            <input
              type="checkbox"
              name="remember"
              id="remember"
              checked={credentials.remember}
              onChange={onChange}
            />
            <label htmlFor="remember"> Remember Me</label>
          </div>
          <Link to="/forgotpassword">Forgot Password?</Link>
        </div>
      </form>

      <div className="text-center">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </div>
    </div>
  );
};

export default Login;