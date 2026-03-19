import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-logo">MedNest</div>
      <ul className="footer-links">
        <li><a href="#">Privacy Policy</a></li>
        <li><a href="#">Terms of Service</a></li>
        <li><a href="#">Support</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
      <div className="footer-socials">
        <a href="#" aria-label="Twitter">𝕏</a>
        <a href="#" aria-label="LinkedIn">in</a>
        <a href="#" aria-label="Instagram">📷</a>
      </div>
    </footer>
  );
};

export default Footer;
