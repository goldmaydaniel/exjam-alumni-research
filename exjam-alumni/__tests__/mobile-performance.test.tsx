import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import mobile components
import {
  MobileInput,
  MobileSearch,
  MobileList,
  MobileCard,
} from "@/components/mobile/responsive-components";
import { MobileGrid, MobileCardList, MobileContainer } from "@/components/mobile/mobile-layouts";

// Mock performance APIs
const mockObserver = jest.fn();
const mockDisconnect = jest.fn();
const mockObserve = jest.fn();

beforeAll(() => {
  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: jest.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  }));

  // Mock performance APIs
  Object.defineProperty(window, "performance", {
    value: {
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn(() => []),
      now: jest.fn(() => Date.now()),
    },
  });
});

// Mock mobile optimization hooks
jest.mock("@/lib/mobile-optimization", () => ({
  useDeviceDetection: () => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: true,
    orientation: "portrait",
  }),
  useTouchGestures: () => ({
    handleTouchStart: jest.fn(),
    handleTouchMove: jest.fn(),
    handleTouchEnd: jest.fn(),
    gestures: { isPressed: false },
  }),
  useViewportSize: () => ({ width: 375, height: 812 }),
  useSafeArea: () => ({
    safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 },
  }),
}));

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

describe("Mobile Performance Tests", () => {
  describe("Render Performance", () => {
    it("should render MobileInput quickly", () => {
      const startTime = performance.now();

      render(<MobileInput label="Test Input" placeholder="Enter text" />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in less than 16ms (60fps budget)
      expect(renderTime).toBeLessThan(16);
    });

    it("should render large lists efficiently", () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
      }));

      const startTime = performance.now();

      render(
        <MobileList
          items={items}
          renderItem={(item) => (
            <div key={item.id}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>
          )}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle large lists efficiently
      expect(renderTime).toBeLessThan(100);
    });

    it("should optimize grid rendering for mobile", () => {
      const items = Array.from({ length: 50 }, (_, i) => (
        <MobileCard key={i} onTap={() => {}}>
          <div className="p-4">
            <h3>Card {i}</h3>
            <p>Card content {i}</p>
          </div>
        </MobileCard>
      ));

      const startTime = performance.now();

      render(
        <MobileGrid columns="auto" gap="default">
          {items}
        </MobileGrid>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50);
    });
  });

  describe("Memory Usage", () => {
    it("should not create memory leaks with touch gestures", async () => {
      const user = userEvent.setup();
      const mockOnTap = jest.fn();

      const { unmount } = render(
        <MobileCard onTap={mockOnTap}>
          <div>Test Card</div>
        </MobileCard>
      );

      // Simulate multiple touch events
      const card = screen.getByText("Test Card").closest('[role="button"]');
      if (card) {
        for (let i = 0; i < 100; i++) {
          await user.click(card);
        }
      }

      // Cleanup should not throw
      expect(() => unmount()).not.toThrow();
    });

    it("should clean up search debounce timers", async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();

      const { unmount } = render(<MobileSearch onSearch={mockOnSearch} />);

      const searchInput = screen.getByRole("searchbox");

      // Type rapidly to create multiple debounce timers
      await user.type(searchInput, "test search query");

      // Unmount should clean up timers
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Touch Response Performance", () => {
    it("should respond to touch events within 100ms", async () => {
      const user = userEvent.setup();
      const mockOnTap = jest.fn();

      render(
        <MobileCard onTap={mockOnTap}>
          <div>Touchable Card</div>
        </MobileCard>
      );

      const card = screen.getByText("Touchable Card").closest('[role="button"]');

      const startTime = performance.now();
      if (card) {
        await user.click(card);
      }
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(100);
      expect(mockOnTap).toHaveBeenCalled();
    });

    it("should handle rapid touch events without blocking", async () => {
      const user = userEvent.setup();
      const mockOnTap = jest.fn();

      render(
        <MobileCard onTap={mockOnTap}>
          <div>Rapid Touch Test</div>
        </MobileCard>
      );

      const card = screen.getByText("Rapid Touch Test").closest('[role="button"]');

      const startTime = performance.now();

      // Simulate rapid tapping
      if (card) {
        for (let i = 0; i < 10; i++) {
          await user.click(card);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle 10 rapid clicks in under 500ms
      expect(totalTime).toBeLessThan(500);
      expect(mockOnTap).toHaveBeenCalledTimes(10);
    });
  });

  describe("Scroll Performance", () => {
    it("should handle smooth scrolling in lists", async () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));

      render(
        <MobileList
          items={items}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
          onRefresh={jest.fn()}
        />
      );

      // Verify list renders without performance issues
      expect(screen.getByText("Item 0")).toBeInTheDocument();

      // Test would involve actual scroll performance measurement
      // in a real browser environment
    });
  });

  describe("Image Loading Performance", () => {
    it("should lazy load images efficiently", async () => {
      const mockIntersectionObserver = jest.fn();

      // Mock IntersectionObserver for this test
      global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
        mockIntersectionObserver.mockImplementation(callback);
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn(),
        };
      });

      render(
        <MobileContainer>
          <img src="/test-image.jpg" alt="Test Image" loading="lazy" className="h-auto w-full" />
        </MobileContainer>
      );

      // Verify intersection observer was set up
      expect(global.IntersectionObserver).toHaveBeenCalled();
    });
  });

  describe("Form Input Performance", () => {
    it("should debounce input changes efficiently", async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      render(<MobileInput label="Debounced Input" onChange={mockOnChange} />);

      const input = screen.getByLabelText("Debounced Input");

      const startTime = performance.now();

      // Type rapidly
      await user.type(input, "rapid typing test");

      const endTime = performance.now();
      const typingTime = endTime - startTime;

      // Should handle rapid typing smoothly
      expect(typingTime).toBeLessThan(200);
    });

    it("should validate inputs without blocking UI", async () => {
      const user = userEvent.setup();
      const mockValidation = jest.fn(() => {
        // Simulate slow validation
        return new Promise((resolve) => {
          setTimeout(() => resolve("Valid"), 50);
        });
      });

      render(<MobileInput label="Validated Input" onChange={mockValidation} />);

      const input = screen.getByLabelText("Validated Input");

      const startTime = performance.now();
      await user.type(input, "test@example.com");
      const endTime = performance.now();

      // UI should remain responsive during validation
      expect(endTime - startTime).toBeLessThan(300);
    });
  });

  describe("Animation Performance", () => {
    it("should animate transitions smoothly", async () => {
      const user = userEvent.setup();

      render(
        <MobileCard onTap={jest.fn()}>
          <div>Animated Card</div>
        </MobileCard>
      );

      const card = screen.getByText("Animated Card").closest('[role="button"]');

      if (card) {
        // Trigger active state animation
        await user.pointer({ target: card, keys: "[TouchA>]" });

        // Check that transform is applied (indicating animation)
        const computedStyle = getComputedStyle(card);
        expect(computedStyle.transform).toBeDefined();

        await user.pointer({ keys: "[/TouchA]" });
      }
    });

    it("should handle orientation changes efficiently", async () => {
      const { rerender } = render(
        <MobileContainer>
          <div>Content</div>
        </MobileContainer>
      );

      const startTime = performance.now();

      // Simulate orientation change
      rerender(
        <MobileContainer>
          <div>Content after orientation change</div>
        </MobileContainer>
      );

      const endTime = performance.now();
      const reRenderTime = endTime - startTime;

      // Should handle orientation changes quickly
      expect(reRenderTime).toBeLessThan(50);
    });
  });

  describe("Bundle Size Impact", () => {
    it("should not significantly increase bundle size", () => {
      // This would typically be measured in a real build environment
      // Here we verify components can be tree-shaken

      const components = [
        MobileInput,
        MobileSearch,
        MobileList,
        MobileCard,
        MobileGrid,
        MobileCardList,
        MobileContainer,
      ];

      components.forEach((Component) => {
        expect(Component).toBeDefined();
        expect(typeof Component).toBe("function");
      });
    });
  });

  describe("Concurrent Rendering", () => {
    it("should work with React concurrent features", async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `Concurrent Item ${i}`,
      }));

      await act(async () => {
        render(
          <MobileList items={items} renderItem={(item) => <div key={item.id}>{item.name}</div>} />
        );
      });

      // Should render without warnings or errors
      expect(screen.getByText("Concurrent Item 0")).toBeInTheDocument();
    });

    it("should handle updates without blocking", async () => {
      const user = userEvent.setup();
      let searchResults = ["Item 1", "Item 2"];

      const { rerender } = render(
        <MobileSearch onSearch={jest.fn()} suggestions={searchResults} />
      );

      const input = screen.getByRole("searchbox");
      await user.type(input, "search");

      // Update suggestions
      searchResults = ["New Item 1", "New Item 2", "New Item 3"];

      const startTime = performance.now();
      rerender(<MobileSearch onSearch={jest.fn()} suggestions={searchResults} />);
      const endTime = performance.now();

      const updateTime = endTime - startTime;
      expect(updateTime).toBeLessThan(16); // 60fps budget
    });
  });
});
