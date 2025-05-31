import React, { useState } from 'react';
import '../styles/Home.css';
import logoImg from '../images/vibesync_logo_2.png';
import AboutPage from './Aboutpage';
import TechstackPage from './TechStackPage';

const HomePage = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isTechOpen, setIsTechOpen] = useState(false);

  const openAbout = () => setIsAboutOpen(true);
  const closeAbout = () => setIsAboutOpen(false);

  const openTech = () => setIsTechOpen(true);
  const closeTech = () => setIsTechOpen(false);

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="navbar-left">
          <img
            src={logoImg}
            alt="VibeSync Logo"
            className="navbar-logo-icon"
          />
          <span className="navbar-logo">VibeSync</span>

          <button className="navbar-link" onClick={openAbout}>
            About
          </button>
          <button className="navbar-link" onClick={openTech}>
            Technologies used
          </button>
        </div>

        <div className="navbar-right">
          <a href="/register">
            <button className="btn btn-primary">Register</button>
          </a>
          <a href="/login">
            <button className="btn btn-primary">Login</button>
          </a>
        </div>
      </nav>

      <div className="hero-content">
        <h1 className="hero-title">IMAGINE A PLACE</h1>
        <p className="hero-subtitle">
          …where you can belong to a school club, a gaming group<br />
          or a worldwide art community. Where just you and a handful<br />
          of friends can spend time together. A place that makes it<br />
          easy to talk every day and hang out more often.
        </p>
      </div>

      {isAboutOpen && (
        <div className="modal-overlay" onClick={closeAbout}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeAbout}>
              ×
            </button>
            <AboutPage />
          </div>
        </div>
      )}

      {isTechOpen && (
        <div className="modal-overlay" onClick={closeTech}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeTech}>
              ×
            </button>
            <TechstackPage />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;