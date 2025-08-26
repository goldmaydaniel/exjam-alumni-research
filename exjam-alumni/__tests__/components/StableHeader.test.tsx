import { render, screen } from "@testing-library/react";
import { StableHeader } from "@/components/layouts/stable-header";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockedLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe("StableHeader", () => {
  it("renders conference banner with countdown", () => {
    render(<StableHeader />);

    expect(screen.getByText("PG Conference 2025 - Maiden Flight")).toBeInTheDocument();
    expect(screen.getByText("94 days to go")).toBeInTheDocument();
    expect(screen.getByText("📅 Nov 28-30, 2025")).toBeInTheDocument();
    expect(screen.getByText("📍 Abuja")).toBeInTheDocument();
  });

  it("renders main navigation links", () => {
    render(<StableHeader />);

    expect(screen.getByText("EXJAM Association")).toBeInTheDocument();
    expect(screen.getByText("Strive to Excel")).toBeInTheDocument();

    // Navigation links
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alumni/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /events/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
  });

  it("renders register button prominently", () => {
    render(<StableHeader />);

    const registerButtons = screen.getAllByText(/register/i);
    expect(registerButtons.length).toBeGreaterThan(0);

    // Check for PG'25 register button
    expect(screen.getByText("🎫 Register for PG'25")).toBeInTheDocument();
  });

  it("has proper link navigation structure", () => {
    render(<StableHeader />);

    // Check that navigation links have correct href attributes
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /about/i })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: /alumni/i })).toHaveAttribute("href", "/alumni");
    expect(screen.getByRole("link", { name: /events/i })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: /contact/i })).toHaveAttribute("href", "/contact");
  });

  it("applies correct CSS classes for styling", () => {
    render(<StableHeader />);

    // Check for gradient banner
    const banner = screen.getByText("PG Conference 2025 - Maiden Flight").closest("div");
    expect(banner).toHaveClass(
      "bg-gradient-to-r",
      "from-blue-600",
      "via-indigo-600",
      "to-purple-600"
    );

    // Check for sticky header
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky", "top-0", "z-50");
  });
});
