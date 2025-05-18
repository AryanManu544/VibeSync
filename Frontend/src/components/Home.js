import React from 'react';
import '../styles/Home.css';
import { Link } from 'react-router-dom';
import logoImg from '../images/vibesync_logo_2.png';

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <img src={logoImg} alt="VibeSync Logo" className="navbar-logo-icon" />
          <span className="navbar-logo">VibeSync</span>
        </div>
        <div className="navbar-right">
          <Link to="/register">
            <button className="btn btn-primary">Register</button>
          </Link>
          <Link to="/login">
            <button className="btn btn-primary">Login</button>
          </Link>
        </div>
      </nav>

      {/* Hero content */}
      <div className="hero-content">
        <h1 className="hero-title">IMAGINE A PLACE</h1>
        <p className="hero-subtitle">
          …where you can belong to a school club, a gaming group<br/>
          or a worldwide art community. Where just you and a handful<br/>
          of friends can spend time together. A place that makes it<br/>
          easy to talk every day and hang out more often.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
