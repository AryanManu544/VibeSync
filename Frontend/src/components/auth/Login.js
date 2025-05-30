import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  change_username,
  change_tag,
  option_profile_pic,
  option_user_id
} from "../../Redux/user_creds_slice";
import {
  setIncomingReqs,
  setOutgoingReqs,
  setBlocked,
  setFriends
} from "../../Redux/user_relations_slice";
import "../../styles/Login.css";
import jwtDecode from 'jwt-decode';

const Login = ({ showAlert }) => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    remember: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Pull relations here so we can log after dispatch
  const relations = useSelector(s => s.user_relations);

  useEffect(() => {
    const saved = localStorage.getItem("loginCreds");
    if (saved) {
      setCredentials(JSON.parse(saved));
    }
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const body = await response.json();
      console.log("Login API response:", body); // Debug log

      if (!response.ok) {
        showAlert(body.error || body.message || "Login failed", "danger");
        setIsLoading(false);
        return;
      }

      const token = body.token || body.authtoken;
      if (!token) {
        showAlert("No token received", "danger");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      const { id: userId } = jwtDecode(token);

      const profileRes = await fetch(
        `${API_BASE_URL}/get_user_by_id`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token
          },
          body: JSON.stringify({ id: userId })
        }
      );
      const profileJson = await profileRes.json();
      const user = profileJson.user;
      localStorage.setItem('userProfile', JSON.stringify(user));
      if (credentials.remember) {
        localStorage.setItem("loginCreds", JSON.stringify(credentials));
      } else {
        localStorage.removeItem("loginCreds");
      }

      dispatch(change_username(user.username));
      dispatch(change_tag(user.tag));
      dispatch(option_profile_pic(user.profile_pic));
      dispatch(option_user_id(user.id));

      console.log("Relations data from login:", {
        incoming_reqs: user.incoming_reqs || [],
        outgoing_reqs: user.outgoing_reqs || [],
        blocked: user.blocked || [],
        friends: user.friends || []
      });

      // Dispatch relations
      dispatch(setIncomingReqs(user.incoming_reqs  || []));
      dispatch(setOutgoingReqs(user.outgoing_reqs  || []));
      dispatch(setBlocked(user.blocked || []));
      dispatch(setFriends(user.friends || []));

      showAlert("Logged in successfully", "success");
      setIsLoading(false);
      navigate("/channels/@me", { replace: true });

    } catch (error) {
      console.error("Network/Login error:", error);
      showAlert("Network error: Unable to login", "danger");
      setIsLoading(false);
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

         {/*<div className="remember-forgot">
            <div>
              <input
                type="checkbox"
                name="remember"
                id="remember"
                checked={credentials.remember}
                onChange={onChange}
                disabled={isLoading}
              />
              <label htmlFor="remember">Remember Me</label>
            </div>
            <Link to="/forgotpassword">Forgot Password?</Link>
          </div>*/}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <div className="text-center">
          Need an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;