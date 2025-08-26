"use client";

import Link from "next/link";
import Image from "next/image";

export function EnhancedFooter() {
  const footerSections = {
    quickLinks: [
      { name: "About Us", href: "/about" },
      { name: "Events", href: "/events" },
      { name: "Membership", href: "/register" },
      { name: "Contact", href: "/contact" },
    ],
    resources: [
      { name: "Conference Details", href: "/events" },
      { name: "Alumni Directory", href: "/directory" },
      { name: "Scholarships", href: "/scholarships" },
      { name: "Career Center", href: "/careers" },
    ],
    connect: [
      { name: "LinkedIn", href: "https://linkedin.com/company/exjam-association" },
      { name: "Twitter", href: "https://twitter.com/exjamassociation" },
      { name: "Facebook", href: "https://facebook.com/exjamassociation" },
      { name: "Instagram", href: "https://instagram.com/exjamassociation" },
    ],
  };

  const squadrons = [
    { name: "GREEN", color: "#059669" },
    { name: "RED", color: "#dc2626" },
    { name: "PURPLE", color: "#7c3aed" },
    { name: "YELLOW", color: "#d97706" },
    { name: "DORNIER", color: "#2563eb" },
    { name: "PUMA", color: "#4b5563" },
  ];

  return (
    <footer
      style={{
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        color: "white",
      }}
    >
      {/* Main Footer Content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "64px 24px 32px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "48px",
            marginBottom: "48px",
          }}
        >
          {/* Logo and Description */}
          <div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                }}
              >
                <Image
                  src="/exjam-logo.svg"
                  alt="EXJAM Logo"
                  width={32}
                  height={32}
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    margin: 0,
                    background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  The EXJAM Association
                </h3>
              </div>
            </div>
            <p
              style={{
                color: "#94a3b8",
                lineHeight: "1.6",
                marginBottom: "24px",
                fontSize: "15px",
              }}
            >
              Air Force Military School Alumni Association • "Strive to Excel" • United by honor,
              driven by excellence, committed to service and brotherhood.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "4px 12px",
                  backgroundColor: "rgba(251, 191, 36, 0.1)",
                  color: "#fbbf24",
                  borderRadius: "6px",
                  border: "1px solid rgba(251, 191, 36, 0.2)",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                AFMS Jos
              </span>
              <span
                style={{
                  padding: "4px 12px",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  color: "#60a5fa",
                  borderRadius: "6px",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                Est. 1980
              </span>
              <span
                style={{
                  padding: "4px 12px",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  color: "#4ade80",
                  borderRadius: "6px",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                6,000+ Alumni
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "24px",
                color: "#f1f5f9",
              }}
            >
              Quick Links
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {footerSections.quickLinks.map((link) => (
                <li key={link.name} style={{ marginBottom: "12px" }}>
                  <Link
                    href={link.href}
                    style={{
                      color: "#94a3b8",
                      textDecoration: "none",
                      fontSize: "15px",
                      transition: "color 0.2s ease",
                    }}
                    className="footer-link"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "24px",
                color: "#f1f5f9",
              }}
            >
              Resources
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {footerSections.resources.map((link) => (
                <li key={link.name} style={{ marginBottom: "12px" }}>
                  <Link
                    href={link.href}
                    style={{
                      color: "#94a3b8",
                      textDecoration: "none",
                      fontSize: "15px",
                      transition: "color 0.2s ease",
                    }}
                    className="footer-link"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "24px",
                color: "#f1f5f9",
              }}
            >
              Get in Touch
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <a
                href="mailto:info@exjam.org.ng"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontSize: "15px",
                  transition: "color 0.2s ease",
                }}
                className="footer-link"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
                info@exjam.org.ng
              </a>
              <a
                href="tel:+2348012345678"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontSize: "15px",
                  transition: "color 0.2s ease",
                }}
                className="footer-link"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                    clipRule="evenodd"
                  />
                </svg>
                +234 801 234 5678
              </a>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  color: "#94a3b8",
                  fontSize: "15px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                >
                  <path
                    fillRule="evenodd"
                    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Jos, Plateau State
                  <br />
                  Nigeria
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Squadron Colors */}
        <div
          style={{
            padding: "32px 0",
            borderTop: "1px solid #374151",
            borderBottom: "1px solid #374151",
            marginBottom: "32px",
          }}
        >
          <h4
            style={{
              textAlign: "center",
              marginBottom: "24px",
              fontSize: "16px",
              fontWeight: "600",
              color: "#f1f5f9",
            }}
          >
            Squadron Colors
          </h4>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            {squadrons.map((squadron) => (
              <div
                key={squadron.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: squadron.color,
                    boxShadow: `0 0 8px ${squadron.color}50`,
                  }}
                ></div>
                <span
                  style={{
                    color: squadron.color,
                    fontWeight: "bold",
                    fontSize: "14px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {squadron.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            © {new Date().getFullYear()} The EXJAM Association • Ex-Junior Airmen • AFMS Jos Alumni
            <br />
            All rights reserved. "Strive to Excel" - Our motto, our way of life.
          </p>
          <div
            style={{
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link
              href="/privacy"
              style={{
                color: "#64748b",
                textDecoration: "none",
                fontSize: "13px",
                transition: "color 0.2s ease",
              }}
              className="footer-link"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              style={{
                color: "#64748b",
                textDecoration: "none",
                fontSize: "13px",
                transition: "color 0.2s ease",
              }}
              className="footer-link"
            >
              Terms of Service
            </Link>
            <Link
              href="/code-of-conduct"
              style={{
                color: "#64748b",
                textDecoration: "none",
                fontSize: "13px",
                transition: "color 0.2s ease",
              }}
              className="footer-link"
            >
              Code of Conduct
            </Link>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .footer-link:hover {
            color: #60a5fa !important;
          }
        `,
        }}
      />
    </footer>
  );
}
