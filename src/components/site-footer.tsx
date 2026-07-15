import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="logo">
            <em>Nyals</em> (K) Ltd
            <span>Exclusive Menswear</span>
          </div>
          <p>Nairobi's premier destination for exclusive menswear.</p>
        </div>
        <div className="footer-col">
          <h4>Collections</h4>
          <ul>
            {["Suits", "Shirts", "Trousers", "Footwear", "Accessories"].map((c) => (
              <li key={c}>
                <Link to="/products" search={{ cat: c }} style={{ color: "inherit" }}>
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h4>Information</h4>
          <ul>
            <li>About Nyals</li>
            <li>Ethics &amp; Values</li>
            <li>Size Guide</li>
            <li>Returns Policy</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li>Moi Avenue, opposite Galitos</li>
            <li>Nairobi, Kenya</li>
            <li><a href="tel:+254722356316" style={{ color: "inherit" }}>0722 356 316</a></li>
            <li><a href="mailto:nyalskenya@yahoo.com" style={{ color: "inherit" }}>nyalskenya@yahoo.com</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Nyals (K) Ltd · Nairobi, Kenya</span>
        <div className="social-links">
          <div className="soc-btn">f</div>
          <div className="soc-btn">in</div>
          <div className="soc-btn">ig</div>
        </div>
      </div>
    </footer>
  );
}
