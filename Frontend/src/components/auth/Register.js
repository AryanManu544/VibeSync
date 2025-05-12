import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/Login.css";

const Register = ({ mode, showAlert }) => {
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
    cpassword: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    document.body.setAttribute("data-theme", mode);

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
  }, [mode]);

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (credentials.password !== credentials.cpassword) {
      showAlert("Passwords do not match", "danger");
      return;
    }

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";
    const { name, email, password } = credentials;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/createuser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await response.json();

      if (json.authtoken) {
        localStorage.setItem("token", json.authtoken);
        showAlert("Account created successfully", "success");
        navigate("/");
      } else {
        showAlert("Invalid credentials", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("An error occurred", "danger");
    }
  };

  return (
    <div className={`login-container ${mode === "dark" ? "dark" : "light"}`}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={credentials.name}
            onChange={onChange}
          />
        </div>
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
        <div>
          <label htmlFor="cpassword">Confirm Password</label>
          <input
            type="password"
            name="cpassword"
            id="cpassword"
            value={credentials.cpassword}
            onChange={onChange}
          />
        </div>

        <button type="submit">Sign Up</button>
      </form>

      <div className="text-center">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default Register;