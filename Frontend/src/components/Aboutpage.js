import React from 'react';
import '../styles/About.css';
import { FaLaugh, FaUsers, FaHandsHelping } from 'react-icons/fa';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>About VibeSync</h1>
        <p>
          VibeSync is a community-driven platform designed to bring people together.
          Whether you&apos;re part of a school club, a gaming squad, or an international
          art collective, VibeSync provides a space to share, connect, and express
          your true self.
        </p>
      </div>

      <div className="about-values">
        <div className="value-card">
          <FaLaugh className="value-icon" />
          <h3>Authenticity</h3>
          <p>
            We believe in being real. Our platform encourages genuine
            expression and honest conversations.
          </p>
        </div>
        <div className="value-card">
          <FaUsers className="value-icon" />
          <h3>Community</h3>
          <p>
            Building connections is at our core. VibeSync is all about sharing
            experiences with like-minded individuals.
          </p>
        </div>
        <div className="value-card">
          <FaHandsHelping className="value-icon" />
          <h3>Support</h3>
          <p>
            We stand by our users. Our aim is to foster a supportive environment
            where everyone feels welcome.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
