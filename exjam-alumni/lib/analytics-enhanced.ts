/**
 * Enhanced Analytics System for ExJAM Alumni Platform
 * Tracks user journeys, conversion rates, and performance metrics
 */

// Analytics Event Types
export type AnalyticsEvent = 
  | 'page_view'
  | 'event_view'
  | 'registration_start'
  | 'registration_step_complete'
  | 'registration_complete'
  | 'registration_abandon'
  | 'form_error'
  | 'payment_start'
  | 'payment_complete'
  | 'payment_error'
  | 'search_query'
  | 'filter_applied'
  | 'error_encountered'
  | 'performance_metric'
  | 'user_engagement'
  | 'api_call'
  | 'offline_usage';

interface AnalyticsData {
  event: AnalyticsEvent;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  page?: string;
  userAgent?: string;
  viewport?: { width: number; height: number };
  connection?: string;
}

interface UserJourneyStep {
  step: string;
  timestamp: number;
  duration?: number;
  completed: boolean;
  metadata?: Record<string, any>;
}

interface ConversionFunnel {
  name: string;
  steps: string[];
  currentStep?: string;
  startTime?: number;
  completions: Record<string, number>;
  abandons: Record<string, number>;
}

class AnalyticsEngine {
  private isEnabled: boolean;
  private userId: string | null = null;
  private sessionId: string;
  private journeySteps: UserJourneyStep[] = [];
  private performanceMetrics: Record<string, any> = {};
  private funnels: Map<string, ConversionFunnel> = new Map();

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
    this.sessionId = this.generateSessionId();
    
    if (this.isEnabled) {
      this.initializeTracking();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    // Track page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.trackPerformance('page_load', {
          loadTime: performance.now(),
          timing: performance.timing,
        });
      });

      // Track viewport changes
      window.addEventListener('resize', () => {
        this.track('user_engagement', {
          action: 'viewport_change',
          viewport: this.getViewportSize(),
        });
      });

      // Track offline/online status
      window.addEventListener('offline', () => {
        this.track('offline_usage', { status: 'offline' });
      });

      window.addEventListener('online', () => {
        this.track('offline_usage', { status: 'online' });
      });
    }
  }

  private getViewportSize() {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  private getConnectionInfo() {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return 'unknown';
    }
    const conn = (navigator as any).connection;
    return conn.effectiveType || conn.type || 'unknown';
  }

  // Set user information
  setUser(userId: string, properties?: Record<string, any>) {
    this.userId = userId;
    
    if (this.isEnabled) {
      this.track('user_engagement', {
        action: 'user_identified',
        userId,
        ...properties,
      });
    }
  }

  // Main tracking method
  track(event: AnalyticsEvent, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const analyticsData: AnalyticsData = {
      event,
      properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      viewport: this.getViewportSize(),
      connection: this.getConnectionInfo(),
    };

    // Send to analytics services
    this.sendToServices(analyticsData);

    // Store locally for offline usage
    this.storeLocally(analyticsData);

    // Update user journey
    if (event.includes('registration') || event.includes('payment')) {
      this.updateJourney(event, properties);
    }
  }

  // Track page views
  trackPageView(page: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page,
      ...properties,
    });
  }

  // Track form interactions
  trackFormInteraction(formId: string, action: string, properties?: Record<string, any>) {
    this.track('user_engagement', {
      action: `form_${action}`,
      formId,
      ...properties,
    });
  }

  // Track registration funnel
  trackRegistrationStep(step: string, completed: boolean = true, properties?: Record<string, any>) {
    const funnelName = 'registration';
    
    if (!this.funnels.has(funnelName)) {
      this.funnels.set(funnelName, {
        name: funnelName,
        steps: ['start', 'personal_info', 'alumni_info', 'additional_info', 'payment', 'complete'],
        completions: {},
        abandons: {},
        startTime: Date.now(),
      });
    }

    const funnel = this.funnels.get(funnelName)!;
    
    if (completed) {
      funnel.completions[step] = (funnel.completions[step] || 0) + 1;
      this.track('registration_step_complete', {
        step,
        funnelProgress: this.getFunnelProgress(funnelName),
        ...properties,
      });
    } else {
      funnel.abandons[step] = (funnel.abandons[step] || 0) + 1;
      this.track('registration_abandon', {
        step,
        funnelProgress: this.getFunnelProgress(funnelName),
        ...properties,
      });
    }
  }

  // Track API calls for performance monitoring
  trackApiCall(endpoint: string, method: string, duration: number, success: boolean, properties?: Record<string, any>) {
    this.track('api_call', {
      endpoint,
      method,
      duration,
      success,
      ...properties,
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error_encountered', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, data: Record<string, any>) {
    this.performanceMetrics[metric] = {
      ...data,
      timestamp: Date.now(),
    };

    this.track('performance_metric', {
      metric,
      ...data,
    });
  }

  // Get conversion rates for funnels
  getFunnelProgress(funnelName: string) {
    const funnel = this.funnels.get(funnelName);
    if (!funnel) return null;

    const progress: Record<string, number> = {};
    funnel.steps.forEach((step, index) => {
      const completions = funnel.completions[step] || 0;
      const totalStarts = funnel.completions[funnel.steps[0]] || 1;
      progress[step] = (completions / totalStarts) * 100;
    });

    return progress;
  }

  // Update user journey tracking
  private updateJourney(event: AnalyticsEvent, properties?: Record<string, any>) {
    const step: UserJourneyStep = {
      step: event,
      timestamp: Date.now(),
      completed: !event.includes('abandon') && !event.includes('error'),
      metadata: properties,
    };

    // Calculate duration from previous step
    if (this.journeySteps.length > 0) {
      const lastStep = this.journeySteps[this.journeySteps.length - 1];
      step.duration = step.timestamp - lastStep.timestamp;
    }

    this.journeySteps.push(step);

    // Keep only last 50 steps to prevent memory issues
    if (this.journeySteps.length > 50) {
      this.journeySteps = this.journeySteps.slice(-50);
    }
  }

  // Send data to analytics services
  private sendToServices(data: AnalyticsData) {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', data.event, {
        event_category: this.getEventCategory(data.event),
        event_label: data.properties?.label || data.page,
        value: data.properties?.value || 1,
        user_id: data.userId,
        session_id: data.sessionId,
        custom_parameters: data.properties,
      });
    }

    // Custom analytics endpoint
    this.sendToCustomEndpoint(data);
  }

  private getEventCategory(event: AnalyticsEvent): string {
    if (event.includes('registration')) return 'Registration';
    if (event.includes('payment')) return 'Payment';
    if (event.includes('page')) return 'Navigation';
    if (event.includes('error')) return 'Errors';
    if (event.includes('performance')) return 'Performance';
    return 'Engagement';
  }

  private async sendToCustomEndpoint(data: AnalyticsData) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Store failed requests for retry
      this.storeFailedRequest(data);
    }
  }

  // Store analytics data locally for offline usage
  private storeLocally(data: AnalyticsData) {
    try {
      const key = `analytics_${data.timestamp}`;
      const stored = localStorage.getItem('analytics_queue') || '[]';
      const queue = JSON.parse(stored);
      
      queue.push({ key, data });
      
      // Keep only last 100 events
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }
      
      localStorage.setItem('analytics_queue', JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to store analytics data locally:', error);
    }
  }

  private storeFailedRequest(data: AnalyticsData) {
    try {
      const stored = localStorage.getItem('analytics_failed') || '[]';
      const failed = JSON.parse(stored);
      failed.push(data);
      
      if (failed.length > 50) {
        failed.splice(0, failed.length - 50);
      }
      
      localStorage.setItem('analytics_failed', JSON.stringify(failed));
    } catch (error) {
      console.warn('Failed to store failed analytics request:', error);
    }
  }

  // Retry failed requests when online
  async retryFailedRequests() {
    try {
      const stored = localStorage.getItem('analytics_failed') || '[]';
      const failed = JSON.parse(stored);
      
      for (const data of failed) {
        await this.sendToCustomEndpoint(data);
      }
      
      localStorage.removeItem('analytics_failed');
    } catch (error) {
      console.warn('Failed to retry analytics requests:', error);
    }
  }

  // Get analytics summary
  getSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      journeySteps: this.journeySteps.length,
      funnels: Array.from(this.funnels.entries()).map(([name, funnel]) => ({
        name,
        progress: this.getFunnelProgress(name),
      })),
      performanceMetrics: this.performanceMetrics,
    };
  }
}

// Singleton instance
const analytics = new AnalyticsEngine();

export default analytics;

// Convenience functions
export const trackPageView = (page: string, properties?: Record<string, any>) => {
  analytics.trackPageView(page, properties);
};

export const trackEvent = (event: AnalyticsEvent, properties?: Record<string, any>) => {
  analytics.track(event, properties);
};

export const trackRegistration = (step: string, completed: boolean = true, properties?: Record<string, any>) => {
  analytics.trackRegistrationStep(step, completed, properties);
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  analytics.trackError(error, context);
};

export const trackApiCall = (endpoint: string, method: string, duration: number, success: boolean, properties?: Record<string, any>) => {
  analytics.trackApiCall(endpoint, method, duration, success, properties);
};

export const setUserId = (userId: string, properties?: Record<string, any>) => {
  analytics.setUser(userId, properties);
};

// React Hook for analytics
export function useAnalytics() {
  const trackPageView = (page: string, properties?: Record<string, any>) => {
    analytics.trackPageView(page, properties);
  };

  const track = (event: AnalyticsEvent, properties?: Record<string, any>) => {
    analytics.track(event, properties);
  };

  const trackFormStep = (step: string, completed: boolean = true, properties?: Record<string, any>) => {
    analytics.trackRegistrationStep(step, completed, properties);
  };

  return {
    trackPageView,
    track,
    trackFormStep,
    trackError,
    trackApiCall,
    setUserId,
  };
}