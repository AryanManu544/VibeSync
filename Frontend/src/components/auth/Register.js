import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import defaultPic from "../../images/vibesync_logo_2.png";
import "../../styles/Register.css";

const Register = ({ mode, showAlert }) => {
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
    cpassword: "",
  });
  const [profileFile, setProfileFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(defaultPic);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

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

  const onChange = (e) =>
    setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setProfileFile(null);
      setPreviewSrc(defaultPic);
      return;
    }
    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const { name, email, password, cpassword } = credentials;

    if (password !== cpassword) {
      showAlert("Passwords do not match", "danger");
      return;
    }
    if (!name || !email || !password) {
      showAlert("Please fill out all fields", "danger");
      return;
    }

    setIsSubmitting(true);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";
    const formData = new FormData();
    formData.append("username", name);
    formData.append("email", email);
    formData.append("password", password);
    if (profileFile) {
      formData.append("profile_pic", profileFile);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        credentials: 'include',
        body: formData,
      });
      const json = await res.json();

      if (res.status === 409) {
        // Duplicate email error from server
        showAlert(json.message || "Email already in use", "danger");
      } else if (json.accessToken) {
        // Successful registration
        showAlert("Account created successfully", "success");
        navigate("/login");
      } else {
        // Other errors
        showAlert(json.message || "Registration failed", "danger");
      }
    } catch (err) {
      console.error("Registration error:", err);
      showAlert("An unexpected error occurred", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="background">
      <div className={`register-container ${mode === "dark" ? "dark" : "light"}`}>
        <h2>Sign Up</h2>

        <div className="profile-preview">
          <img src={previewSrc} alt="Profile preview" className="preview-img" />
          <input type="file" accept="image/*" onChange={onFileChange} />
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your name"
              value={credentials.name}
              onChange={onChange}
            />
          </div>
          <div>
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={credentials.email}
              onChange={onChange}
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={onChange}
            />
          </div>
          <div>
            <label htmlFor="cpassword">Confirm Password</label>
            <input
              type="password"
              id="cpassword"
              name="cpassword"
              placeholder="Re-enter your password"
              value={credentials.cpassword}
              onChange={onChange}
            />
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;