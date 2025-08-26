import React, { useEffect, useCallback, useState, useRef } from "react";

// Accessibility utilities and hooks

// Screen reader announcements
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  if (typeof window === 'undefined') return;
  
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('class', 'sr-only');
  announcer.style.position = 'absolute';
  announcer.style.left = '-10000px';
  announcer.style.width = '1px';
  announcer.style.height = '1px';
  announcer.style.overflow = 'hidden';
  
  document.body.appendChild(announcer);
  announcer.textContent = message;
  
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

// Focus management
export const useFocusManagement = () => {
  const focusHistoryRef = useRef<HTMLElement[]>([]);
  
  const saveFocus = useCallback((element?: HTMLElement) => {
    const activeElement = element || (document.activeElement as HTMLElement);
    if (activeElement && activeElement !== document.body) {
      focusHistoryRef.current.push(activeElement);
    }
  }, []);
  
  const restoreFocus = useCallback(() => {
    const lastFocusedElement = focusHistoryRef.current.pop();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }, []);
  
  const focusElement = useCallback((selector: string | HTMLElement) => {
    let element: HTMLElement | null;
    
    if (typeof selector === 'string') {
      element = document.querySelector(selector);
    } else {
      element = selector;
    }
    
    if (element && typeof element.focus === 'function') {
      element.focus();
      return true;
    }
    return false;
  }, []);

  const trapFocus = useCallback((containerElement: HTMLElement) => {
    const focusableElements = containerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    containerElement.addEventListener('keydown', handleTabKey);
    
    return () => {
      containerElement.removeEventListener('keydown', handleTabKey);
    };
  }, []);
  
  return {
    saveFocus,
    restoreFocus,
    focusElement,
    trapFocus,
    focusHistory: focusHistoryRef.current,
  };
};

// Keyboard navigation
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'ArrowUp':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('up');
          }
          break;
        case 'ArrowDown':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('down');
          }
          break;
        case 'ArrowLeft':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('left');
          }
          break;
        case 'ArrowRight':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('right');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onEscape, onArrowKeys]);
};

// Skip links for keyboard users
export const SkipLinks = () => {
  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to navigation
      </a>
    </div>
  );
};

// High contrast mode detection
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };
    
    setIsHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return isHighContrast;
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};

// Color scheme preference
export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'no-preference'>('no-preference');
  
  useEffect(() => {
    const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const updateColorScheme = () => {
      if (darkMediaQuery.matches) {
        setColorScheme('dark');
      } else if (lightMediaQuery.matches) {
        setColorScheme('light');
      } else {
        setColorScheme('no-preference');
      }
    };
    
    updateColorScheme();
    darkMediaQuery.addEventListener('change', updateColorScheme);
    lightMediaQuery.addEventListener('change', updateColorScheme);
    
    return () => {
      darkMediaQuery.removeEventListener('change', updateColorScheme);
      lightMediaQuery.removeEventListener('change', updateColorScheme);
    };
  }, []);
  
  return colorScheme;
};

// ARIA live region for dynamic content
export const useLiveRegion = () => {
  const [liveRegion, setLiveRegion] = useState<HTMLDivElement | null>(null);
  
  useEffect(() => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    setLiveRegion(region);
    
    return () => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    };
  }, []);
  
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }, [liveRegion]);
  
  return announce;
};

// Form validation accessibility
export const useFormAccessibility = () => {
  const associateErrorWithField = useCallback((fieldId: string, errorId: string, errorMessage: string) => {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(errorId);
    
    if (field && errorElement) {
      field.setAttribute('aria-describedby', errorId);
      field.setAttribute('aria-invalid', 'true');
      errorElement.setAttribute('role', 'alert');
      errorElement.textContent = errorMessage;
      
      // Announce error to screen readers
      announce(errorMessage, 'assertive');
    }
  }, []);
  
  const clearFieldError = useCallback((fieldId: string, errorId: string) => {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(errorId);
    
    if (field) {
      field.removeAttribute('aria-describedby');
      field.removeAttribute('aria-invalid');
    }
    
    if (errorElement) {
      errorElement.removeAttribute('role');
      errorElement.textContent = '';
    }
  }, []);
  
  return {
    associateErrorWithField,
    clearFieldError,
  };
};

// Modal/Dialog accessibility
export const useDialogAccessibility = (isOpen: boolean) => {
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();
  const dialogRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      saveFocus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Set up focus trap
      let cleanupFocusTrap: (() => void) | undefined;
      if (dialogRef.current) {
        cleanupFocusTrap = trapFocus(dialogRef.current);
        
        // Focus first focusable element
        setTimeout(() => {
          const firstFocusable = dialogRef.current?.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }, 100);
      }
      
      return () => {
        document.body.style.overflow = '';
        if (cleanupFocusTrap) {
          cleanupFocusTrap();
        }
      };
    } else {
      restoreFocus();
    }
  }, [isOpen, saveFocus, restoreFocus, trapFocus]);
  
  const handleEscape = useCallback(() => {
    if (isOpen) {
      restoreFocus();
    }
  }, [isOpen, restoreFocus]);
  
  useKeyboardNavigation(undefined, handleEscape);
  
  return {
    dialogRef,
    dialogProps: {
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': 'dialog-title',
      'aria-describedby': 'dialog-description',
    },
  };
};

// Table accessibility
export const useTableAccessibility = () => {
  const getTableProps = useCallback((caption?: string) => ({
    role: 'table',
    'aria-label': caption,
  }), []);
  
  const getRowProps = useCallback((rowIndex: number, isHeader = false) => ({
    role: 'row',
    'aria-rowindex': rowIndex + 1,
    ...(isHeader && { 'aria-rowheader': true }),
  }), []);
  
  const getCellProps = useCallback((
    columnIndex: number,
    isHeader = false,
    sortDirection?: 'ascending' | 'descending' | 'none'
  ) => ({
    role: isHeader ? 'columnheader' : 'cell',
    'aria-colindex': columnIndex + 1,
    ...(isHeader && sortDirection && {
      'aria-sort': sortDirection,
      tabIndex: 0,
    }),
  }), []);
  
  return {
    getTableProps,
    getRowProps,
    getCellProps,
  };
};

// Combobox/Select accessibility
export const useComboboxAccessibility = (
  options: { value: string; label: string }[],
  onSelect: (value: string) => void
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setSelectedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (isOpen && selectedIndex >= 0) {
          onSelect(filteredOptions[selectedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, selectedIndex, filteredOptions, onSelect]);
  
  return {
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    inputValue,
    setInputValue,
    filteredOptions,
    handleKeyDown,
    comboboxProps: {
      role: 'combobox',
      'aria-expanded': isOpen,
      'aria-haspopup': 'listbox',
      'aria-autocomplete': 'list' as const,
      onKeyDown: handleKeyDown,
    },
    listboxProps: {
      role: 'listbox',
      'aria-label': 'Options',
    },
    getOptionProps: (index: number) => ({
      role: 'option',
      'aria-selected': index === selectedIndex,
      id: `option-${index}`,
    }),
  };
};