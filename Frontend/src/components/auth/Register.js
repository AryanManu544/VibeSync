import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/Register.css";

const DEFAULT_PIC_URL =
  "https://chatgpt.com/s/m_682566fcb41c8191bf6fd3c679799069";

const Register = ({ mode, showAlert }) => {
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
    cpassword: "",
  });
  const [profileFile, setProfileFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(DEFAULT_PIC_URL);

  const navigate = useNavigate();

  // Dark/light theme + background image
  useEffect(() => {
    document.body.setAttribute("data-theme", mode);
    const bg = mode === "dark" ? "/assets/darkmode.jpg" : "/assets/lightmode.jpg";
    Object.assign(document.body.style, {
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      height: "100vh",
      margin: "0",
    });
  }, [mode]);

  // Handle text inputs
  const onChange = (e) =>
    setCredentials({ ...credentials, [e.target.name]: e.target.value });

  // When they pick a file, read it as Data URL for preview & later sending
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setProfileFile(null);
      setPreviewSrc(DEFAULT_PIC_URL);
      return;
    }
    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, cpassword } = credentials;

    if (password !== cpassword) {
      return showAlert("Passwords do not match", "danger");
    }
    if (!name || !email || !password) {
      return showAlert("Please fill out all fields", "danger");
    }

    // Build your payload
    const payload = {
      username: name,
      email,
      password,
      profile_pic: previewSrc, // either base64 data-URL or DEFAULT_PIC_URL
    };

    const API_BASE_URL =
      process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.authtoken) {
        localStorage.setItem("token", json.authtoken);
        showAlert("Account created successfully", "success");
        navigate("/channel");
      } else {
        const msg = json.message || "Invalid credentials";
        showAlert(msg, "danger");
      }
    } catch (err) {
      console.error("Registration error:", err);
      showAlert("An error occurred", "danger");
    }
  };

  return (
    <div className="background">
      <div className={`register-container ${mode === "dark" ? "dark" : "light"}`}>
        <h2>Sign Up</h2>
        {/* Preview + file input */}
        <div className="profile-preview">
          <img src={previewSrc} alt="Profile preview" className="preview-img" />
          <input type="file" accept="image/*" onChange={onFileChange} />
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter your name"
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
              placeholder="Enter your email"
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
              placeholder="Enter your password"
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
              placeholder="Re-enter your password"
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
    </div>
  );
};

export default Register;