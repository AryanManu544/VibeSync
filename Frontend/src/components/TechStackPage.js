import React from 'react';
import '../styles/Techstack.css';
import { FaReact, FaNode, FaDatabase, FaSass, FaGithub } from 'react-icons/fa';

const techList = [
  { name: 'React', icon: <FaReact />, desc: 'Frontend library for building UIs' },
  { name: 'Node.js', icon: <FaNode />, desc: 'Backend runtime for JavaScript' },
  { name: 'Express', icon: <FaNode />, desc: 'Web framework for Node.js' },
  { name: 'MongoDB', icon: <FaDatabase />, desc: 'NoSQL database for storing data' },
  { name: 'Socket.IO', icon: <FaNode />, desc: 'Real-time, bidirectional communication' },
  { name: 'SASS', icon: <FaSass />, desc: 'CSS preprocessor for enhanced styling' },
  { name: 'Git & GitHub', icon: <FaGithub />, desc: 'Version control and code collaboration' },
];

const TechstackPage = () => {
  return (
    <div className="techstack-page">
      <div className="tech-hero">
        <h1>Technologies We Use</h1>
        <p>
          VibeSync is built with a powerful, modern stack to deliver
          a seamless, real-time communication experience.
        </p>
      </div>

      <div className="tech-grid">
        {techList.map((tech, idx) => (
          <div key={idx} className="tech-card">
            <div className="tech-icon">{tech.icon}</div>
            <h3>{tech.name}</h3>
            <p>{tech.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechstackPage;