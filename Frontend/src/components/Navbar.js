import React from 'react';
import '../styles/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-brand">
          <img src="/logo.png" alt="Logo" />
          <span className="site-name">My Website</span>
        </div>
        <div className="navbar-menu">
          <a href="/discover">Discover</a>
          <a href="/register">Register</a>
          <a href="/login">Login</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
