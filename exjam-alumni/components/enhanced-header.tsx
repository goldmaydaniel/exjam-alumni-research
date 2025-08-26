"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export function EnhancedHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Events", href: "/events" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <nav
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
          padding: "0 24px",
        }}
      >
        {/* Logo Section */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1e40af, #3730a3)",
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
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "20px",
                  background: "linear-gradient(135deg, #1e40af, #3730a3)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                The EXJAM Association
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  fontStyle: "italic",
                  fontWeight: "500",
                  letterSpacing: "0.5px",
                }}
              >
                "Strive to Excel"
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div
          style={{
            display: "none",
            gap: "32px",
            alignItems: "center",
          }}
          className="desktop-nav"
        >
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              style={{
                textDecoration: "none",
                color: "#374151",
                fontWeight: "500",
                fontSize: "15px",
                padding: "8px 16px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              className="nav-link"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div
          style={{
            display: "none",
            gap: "12px",
            alignItems: "center",
          }}
          className="desktop-auth"
        >
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              color: "#374151",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
            }}
            className="login-btn"
          >
            Login
          </Link>
          <Link
            href="/register"
            style={{
              textDecoration: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              transition: "all 0.2s ease",
            }}
            className="register-btn"
          >
            Register Now
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "transparent",
            color: "#374151",
            cursor: "pointer",
          }}
          className="mobile-menu-btn"
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            padding: "24px",
            zIndex: 40,
          }}
          className="mobile-menu"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  color: "#374151",
                  fontWeight: "500",
                  fontSize: "16px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                className="mobile-nav-link"
              >
                {item.name}
              </Link>
            ))}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  fontWeight: "500",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                }}
                className="mobile-login-btn"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "600",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.2s ease",
                }}
                className="mobile-register-btn"
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-auth {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
        
        @media (max-width: 767px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
        
        .nav-link:hover {
          background-color: #f3f4f6 !important;
          color: #1d4ed8 !important;
        }
        
        .login-btn:hover {
          background-color: #f9fafb !important;
          border-color: #9ca3af !important;
        }
        
        .register-btn:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4) !important;
        }
        
        .mobile-nav-link:hover {
          background-color: #f3f4f6 !important;
          color: #1d4ed8 !important;
        }
        
        .mobile-login-btn:hover {
          background-color: #f9fafb !important;
          border-color: #9ca3af !important;
        }
        
        .mobile-register-btn:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4) !important;
        }
        `,
        }}
      />
    </header>
  );
}
