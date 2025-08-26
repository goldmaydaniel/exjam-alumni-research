import Link from "next/link";

export function SimpleHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
      }}
    >
      <nav
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          height: "64px",
          padding: "0 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              EX
            </div>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "18px" }}>The EXJAM Association</div>
              <div style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>
                Strive to Excel
              </div>
            </div>
          </Link>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#374151", fontWeight: "500" }}>
            Home
          </Link>
          <Link
            href="/about"
            style={{ textDecoration: "none", color: "#6b7280", fontWeight: "500" }}
          >
            About
          </Link>
          <Link
            href="/events"
            style={{ textDecoration: "none", color: "#6b7280", fontWeight: "500" }}
          >
            Events
          </Link>
          <Link
            href="/contact"
            style={{ textDecoration: "none", color: "#6b7280", fontWeight: "500" }}
          >
            Contact
          </Link>
        </div>

        <div style={{ marginLeft: "24px", display: "flex", gap: "8px" }}>
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              color: "#374151",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Login
          </Link>
          <Link
            href="/register"
            style={{
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              backgroundColor: "#3b82f6",
              color: "white",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Register
          </Link>
        </div>
      </nav>
    </header>
  );
}
