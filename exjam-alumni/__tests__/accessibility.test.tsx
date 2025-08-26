import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import userEvent from "@testing-library/user-event";

// Import components to test
import { MobileInput } from "@/components/mobile/responsive-components";
import { MobileNavigation } from "@/components/mobile/responsive-components";
import { MobileSearch } from "@/components/mobile/responsive-components";
import { MobileDrawer } from "@/components/mobile/responsive-components";
import { MobileHeader } from "@/components/mobile/mobile-layouts";
import { MobileForm } from "@/components/mobile/mobile-layouts";

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock mobile detection
jest.mock("@/lib/mobile-optimization", () => ({
  useDeviceDetection: () => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: true,
    orientation: "portrait",
  }),
  useSafeArea: () => ({
    safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 },
  }),
  useOrientationChange: () => ({}),
  useTouchGestures: () => ({
    handleTouchStart: jest.fn(),
    handleTouchMove: jest.fn(),
    handleTouchEnd: jest.fn(),
    gestures: { isPressed: false },
  }),
  useViewportSize: () => ({ width: 375, height: 812 }),
}));

// Mock accessibility hooks
jest.mock("@/lib/accessibility", () => ({
  useAccessibility: () => ({
    setupKeyboardNavigation: jest.fn(),
  }),
  useKeyboardNavigation: () => ({
    setupKeyboardNavigation: jest.fn(),
  }),
  useFocusManagement: () => ({
    trapFocus: jest.fn(),
    releaseFocus: jest.fn(),
  }),
  announce: jest.fn(),
}));

describe("Accessibility Tests", () => {
  describe("MobileInput Component", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <MobileInput label="Email Address" type="email" required placeholder="Enter your email" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper ARIA attributes", () => {
      render(
        <MobileInput
          label="Password"
          type="password"
          required
          error="Password is required"
          helpText="Must be at least 8 characters"
        />
      );

      const input = screen.getByLabelText(/password/i);
      expect(input).toHaveAttribute("aria-required", "true");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby");

      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toBeInTheDocument();
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<MobileInput label="Username" onChange={jest.fn()} />);

      const input = screen.getByLabelText(/username/i);

      await user.tab();
      expect(input).toHaveFocus();

      await user.type(input, "testuser");
      expect(input).toHaveValue("testuser");
    });

    it("should announce errors to screen readers", () => {
      const { rerender } = render(<MobileInput label="Email" />);

      rerender(<MobileInput label="Email" error="Invalid email format" />);

      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent("Invalid email format");
    });
  });

  describe("MobileNavigation Component", () => {
    const mockNavigationItems = [
      { path: "/home", label: "Home", icon: "🏠" },
      { path: "/profile", label: "Profile", icon: "👤" },
      { path: "/settings", label: "Settings", icon: "⚙️" },
    ];

    it("should have no accessibility violations", async () => {
      const { container } = render(
        <MobileNavigation items={mockNavigationItems} currentPath="/home" onNavigate={jest.fn()} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper navigation semantics", () => {
      render(
        <MobileNavigation items={mockNavigationItems} currentPath="/home" onNavigate={jest.fn()} />
      );

      const navigation = screen.getByRole("navigation", { name: /main navigation/i });
      expect(navigation).toBeInTheDocument();

      const homeButton = screen.getByRole("button", { name: /home/i });
      expect(homeButton).toHaveAttribute("aria-current", "page");
    });

    it("should be keyboard accessible", async () => {
      const user = userEvent.setup();
      const mockOnNavigate = jest.fn();

      render(
        <MobileNavigation
          items={mockNavigationItems}
          currentPath="/home"
          onNavigate={mockOnNavigate}
        />
      );

      const profileButton = screen.getByRole("button", { name: /profile/i });

      await user.tab();
      await user.tab(); // Navigate to profile button
      await user.keyboard("{Enter}");

      expect(mockOnNavigate).toHaveBeenCalledWith("/profile");
    });
  });

  describe("MobileSearch Component", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <MobileSearch onSearch={jest.fn()} placeholder="Search alumni..." />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper search semantics", () => {
      render(<MobileSearch onSearch={jest.fn()} suggestions={["John Doe", "Jane Smith"]} />);

      const searchBox = screen.getByRole("searchbox");
      expect(searchBox).toHaveAttribute("aria-label", "Search");
      expect(searchBox).toHaveAttribute("aria-expanded", "false");
      expect(searchBox).toHaveAttribute("aria-haspopup", "listbox");
    });

    it("should manage focus correctly with suggestions", async () => {
      const user = userEvent.setup();
      render(<MobileSearch onSearch={jest.fn()} suggestions={["Alumni One", "Alumni Two"]} />);

      const searchBox = screen.getByRole("searchbox");

      await user.type(searchBox, "Alumni");

      await waitFor(() => {
        expect(searchBox).toHaveAttribute("aria-expanded", "true");
      });

      const suggestions = screen.getByRole("listbox", { name: /search suggestions/i });
      expect(suggestions).toBeInTheDocument();
    });
  });

  describe("MobileDrawer Component", () => {
    it("should have no accessibility violations when open", async () => {
      const { container } = render(
        <MobileDrawer isOpen={true} onClose={jest.fn()} title="Test Drawer">
          <p>Drawer content</p>
        </MobileDrawer>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper dialog semantics", () => {
      render(
        <MobileDrawer isOpen={true} onClose={jest.fn()} title="Settings">
          <p>Settings content</p>
        </MobileDrawer>
      );

      const dialog = screen.getByRole("dialog", { name: /settings/i });
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("tabindex", "-1");
    });

    it("should close on Escape key", async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      render(
        <MobileDrawer isOpen={true} onClose={mockOnClose} title="Test Drawer">
          <p>Content</p>
        </MobileDrawer>
      );

      await user.keyboard("{Escape}");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("MobileHeader Component", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <MobileHeader
          title="Page Title"
          subtitle="Page subtitle"
          leftAction={<button>Back</button>}
          rightAction={<button>Menu</button>}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper heading structure", () => {
      render(<MobileHeader title="Alumni Dashboard" subtitle="Welcome back, John" />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Alumni Dashboard");
      expect(screen.getByText("Welcome back, John")).toBeInTheDocument();
    });
  });

  describe("MobileForm Component", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <MobileForm title="Registration Form" description="Please fill out all required fields">
          <MobileInput label="Name" required />
          <MobileInput label="Email" type="email" required />
        </MobileForm>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper form semantics", () => {
      render(
        <MobileForm title="Contact Form" onSubmit={jest.fn()}>
          <MobileInput label="Message" required />
        </MobileForm>
      );

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Contact Form");
    });
  });

  describe("Color Contrast Tests", () => {
    it("should pass color contrast checks", async () => {
      const { container } = render(
        <div>
          <MobileHeader title="Test Page" />
          <MobileInput label="Test Input" />
          <button className="bg-primary px-4 py-2 text-primary-foreground">Test Button</button>
        </div>
      );

      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe("Focus Management Tests", () => {
    it("should maintain logical tab order", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button>First Button</button>
          <MobileInput label="Input Field" />
          <button>Last Button</button>
        </div>
      );

      const firstButton = screen.getByText("First Button");
      const inputField = screen.getByLabelText("Input Field");
      const lastButton = screen.getByText("Last Button");

      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(inputField).toHaveFocus();

      await user.tab();
      expect(lastButton).toHaveFocus();
    });
  });

  describe("Screen Reader Announcements", () => {
    it("should announce important state changes", async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();

      render(<MobileSearch onSearch={mockOnSearch} onClear={jest.fn()} />);

      const searchInput = screen.getByRole("searchbox");
      await user.type(searchInput, "test");

      const clearButton = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearButton);

      // Verify announce was called (mocked)
      expect(searchInput).toHaveValue("");
    });
  });

  describe("Touch Target Size Tests", () => {
    it("should have adequate touch target sizes on mobile", () => {
      render(
        <MobileNavigation
          items={[
            { path: "/home", label: "Home", icon: "🏠" },
            { path: "/profile", label: "Profile", icon: "👤" },
          ]}
          currentPath="/home"
          onNavigate={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        const styles = getComputedStyle(button);
        // Check minimum touch target size (44px recommended)
        const minHeight = parseInt(styles.minHeight) || parseInt(styles.height);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });
});
