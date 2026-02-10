import "./globals.css";

export const metadata = {
  title: "CreditPulse",
  description: "Sprint 0 UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="container">
            <div className="clearfix" style={{ padding: "14px 0" }}>
              <div style={{ float: "left" }}>
                <a href="/" className="logo-box">
                  Logo
                </a>
              </div>

              <nav className="nav" aria-label="Primary">
                <a href="/">Home</a>
                <a href="/about">About Us</a>
                <a href="/contact">Contact Us</a>
                <a href="/signin">Sign In</a>
                <a href="/signup" className="cta">
                  Sign Up
                </a>
              </nav>
            </div>
          </div>
        </header>

        <div className="page">
          <div className="container">{children}</div>
        </div>

        <footer className="footer">Footer</footer>
      </body>
    </html>
  );
}
