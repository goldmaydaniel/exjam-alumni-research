import { createServiceRoleClient } from "@/lib/supabase/server";

interface AuthEvent {
  userId?: string;
  email?: string;
  event: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

interface AuthMetrics {
  totalLogins: number;
  failedLogins: number;
  newRegistrations: number;
  passwordResets: number;
  activeUsers: number;
  averageSessionDuration: number;
  topLoginMethods: Record<string, number>;
  loginsByHour: Record<number, number>;
  deviceTypes: Record<string, number>;
}

/**
 * Track authentication event
 */
export async function trackAuthEvent(event: AuthEvent): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    
    await supabase.from("auth_events").insert({
      user_id: event.userId,
      email: event.email,
      event_type: event.event,
      metadata: event.metadata,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      created_at: event.timestamp,
    });
  } catch (error) {
    console.error("Failed to track auth event:", error);
  }
}

/**
 * Track successful login
 */
export async function trackLogin(
  userId: string,
  email: string,
  method: "password" | "google" | "microsoft" | "github" | "magic_link",
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await trackAuthEvent({
    userId,
    email,
    event: "login_success",
    metadata: { method },
    ipAddress,
    userAgent,
    timestamp: new Date(),
  });
}

/**
 * Track failed login attempt
 */
export async function trackFailedLogin(
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await trackAuthEvent({
    email,
    event: "login_failed",
    metadata: { reason },
    ipAddress,
    userAgent,
    timestamp: new Date(),
  });
}

/**
 * Track new registration
 */
export async function trackRegistration(
  userId: string,
  email: string,
  method: "email" | "google" | "microsoft" | "github",
  metadata?: Record<string, any>
): Promise<void> {
  await trackAuthEvent({
    userId,
    email,
    event: "registration",
    metadata: { method, ...metadata },
    timestamp: new Date(),
  });
}

/**
 * Track logout
 */
export async function trackLogout(
  userId: string,
  sessionDuration: number
): Promise<void> {
  await trackAuthEvent({
    userId,
    event: "logout",
    metadata: { session_duration_seconds: sessionDuration },
    timestamp: new Date(),
  });
}

/**
 * Track password reset
 */
export async function trackPasswordReset(
  email: string,
  stage: "requested" | "completed"
): Promise<void> {
  await trackAuthEvent({
    email,
    event: `password_reset_${stage}`,
    timestamp: new Date(),
  });
}

/**
 * Track 2FA events
 */
export async function trackTwoFactorEvent(
  userId: string,
  action: "enabled" | "disabled" | "verified" | "failed"
): Promise<void> {
  await trackAuthEvent({
    userId,
    event: `2fa_${action}`,
    timestamp: new Date(),
  });
}

/**
 * Get authentication metrics for dashboard
 */
export async function getAuthMetrics(
  startDate: Date,
  endDate: Date
): Promise<AuthMetrics> {
  const supabase = createServiceRoleClient();
  
  // Get events within date range
  const { data: events, error } = await supabase
    .from("auth_events")
    .select("*")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());
  
  if (error || !events) {
    throw new Error("Failed to fetch auth metrics");
  }
  
  // Calculate metrics
  const metrics: AuthMetrics = {
    totalLogins: 0,
    failedLogins: 0,
    newRegistrations: 0,
    passwordResets: 0,
    activeUsers: 0,
    averageSessionDuration: 0,
    topLoginMethods: {},
    loginsByHour: {},
    deviceTypes: {},
  };
  
  const uniqueUsers = new Set<string>();
  const sessionDurations: number[] = [];
  
  events.forEach(event => {
    switch (event.event_type) {
      case "login_success":
        metrics.totalLogins++;
        if (event.user_id) uniqueUsers.add(event.user_id);
        
        // Track login method
        const method = event.metadata?.method || "password";
        metrics.topLoginMethods[method] = (metrics.topLoginMethods[method] || 0) + 1;
        
        // Track login hour
        const hour = new Date(event.created_at).getHours();
        metrics.loginsByHour[hour] = (metrics.loginsByHour[hour] || 0) + 1;
        
        // Track device type
        const deviceType = detectDeviceType(event.user_agent);
        metrics.deviceTypes[deviceType] = (metrics.deviceTypes[deviceType] || 0) + 1;
        break;
        
      case "login_failed":
        metrics.failedLogins++;
        break;
        
      case "registration":
        metrics.newRegistrations++;
        break;
        
      case "password_reset_completed":
        metrics.passwordResets++;
        break;
        
      case "logout":
        if (event.metadata?.session_duration_seconds) {
          sessionDurations.push(event.metadata.session_duration_seconds);
        }
        break;
    }
  });
  
  metrics.activeUsers = uniqueUsers.size;
  
  if (sessionDurations.length > 0) {
    metrics.averageSessionDuration = 
      sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
  }
  
  return metrics;
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent?: string): string {
  if (!userAgent) return "unknown";
  
  userAgent = userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipod/.test(userAgent)) {
    return "mobile";
  } else if (/ipad|tablet/.test(userAgent)) {
    return "tablet";
  } else if (/macintosh|windows|linux/.test(userAgent)) {
    return "desktop";
  }
  
  return "other";
}

/**
 * Get suspicious activity
 */
export async function getSuspiciousActivity(
  threshold: number = 5
): Promise<any[]> {
  const supabase = createServiceRoleClient();
  
  // Get failed login attempts in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const { data: failedAttempts } = await supabase
    .from("auth_events")
    .select("email, ip_address, count")
    .eq("event_type", "login_failed")
    .gte("created_at", oneHourAgo.toISOString());
  
  // Group by email/IP and count
  const suspiciousActivity: Record<string, number> = {};
  
  failedAttempts?.forEach(attempt => {
    const key = `${attempt.email || "unknown"}:${attempt.ip_address || "unknown"}`;
    suspiciousActivity[key] = (suspiciousActivity[key] || 0) + 1;
  });
  
  // Filter by threshold
  return Object.entries(suspiciousActivity)
    .filter(([_, count]) => count >= threshold)
    .map(([key, count]) => {
      const [email, ip] = key.split(":");
      return { email, ip_address: ip, failed_attempts: count };
    });
}

/**
 * Get user authentication history
 */
export async function getUserAuthHistory(
  userId: string,
  limit: number = 50
): Promise<AuthEvent[]> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("auth_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data.map(event => ({
    userId: event.user_id,
    email: event.email,
    event: event.event_type,
    metadata: event.metadata,
    ipAddress: event.ip_address,
    userAgent: event.user_agent,
    timestamp: new Date(event.created_at),
  }));
}

/**
 * Export authentication report
 */
export async function exportAuthReport(
  startDate: Date,
  endDate: Date,
  format: "json" | "csv" = "json"
): Promise<string | object> {
  const metrics = await getAuthMetrics(startDate, endDate);
  
  if (format === "json") {
    return metrics;
  }
  
  // Convert to CSV
  const csv: string[] = [];
  csv.push("Metric,Value");
  csv.push(`Total Logins,${metrics.totalLogins}`);
  csv.push(`Failed Logins,${metrics.failedLogins}`);
  csv.push(`New Registrations,${metrics.newRegistrations}`);
  csv.push(`Password Resets,${metrics.passwordResets}`);
  csv.push(`Active Users,${metrics.activeUsers}`);
  csv.push(`Average Session Duration (seconds),${metrics.averageSessionDuration}`);
  
  csv.push("\nLogin Methods,Count");
  Object.entries(metrics.topLoginMethods).forEach(([method, count]) => {
    csv.push(`${method},${count}`);
  });
  
  csv.push("\nDevice Types,Count");
  Object.entries(metrics.deviceTypes).forEach(([device, count]) => {
    csv.push(`${device},${count}`);
  });
  
  return csv.join("\n");
}