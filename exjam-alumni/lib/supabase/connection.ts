/**
 * Robust Supabase Connection Strategy
 * Handles connection pooling, retries, and graceful degradation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Connection configuration
const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  connectionTimeout: 10000, // 10 seconds
  requestTimeout: 30000, // 30 seconds
};

// Connection pool for different client types
class SupabaseConnectionPool {
  private static instance: SupabaseConnectionPool;
  private clientPool: Map<string, SupabaseClient<Database>> = new Map();
  private connectionHealth: Map<string, { isHealthy: boolean; lastCheck: number }> = new Map();

  private constructor() {}

  static getInstance(): SupabaseConnectionPool {
    if (!SupabaseConnectionPool.instance) {
      SupabaseConnectionPool.instance = new SupabaseConnectionPool();
    }
    return SupabaseConnectionPool.instance;
  }

  /**
   * Get or create a Supabase client with connection pooling
   */
  getClient(type: 'anon' | 'service' = 'anon'): SupabaseClient<Database> {
    const clientId = `${type}-client`;
    
    if (!this.clientPool.has(clientId)) {
      const key = type === 'service' ? SUPABASE_CONFIG.serviceRoleKey : SUPABASE_CONFIG.anonKey;
      
      const client = createClient<Database>(SUPABASE_CONFIG.url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
          detectSessionInUrl: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-client-info': 'exjam-alumni-v1.0',
          },
        },
        realtime: {
          params: {
            eventsPerSecond: 2,
          },
        },
      });

      this.clientPool.set(clientId, client);
      this.connectionHealth.set(clientId, { isHealthy: true, lastCheck: Date.now() });
    }

    return this.clientPool.get(clientId)!;
  }

  /**
   * Health check for connections
   */
  async checkConnectionHealth(type: 'anon' | 'service' = 'anon'): Promise<boolean> {
    const clientId = `${type}-client`;
    const health = this.connectionHealth.get(clientId);
    
    // Check every 5 minutes
    if (health && Date.now() - health.lastCheck < 300000 && health.isHealthy) {
      return true;
    }

    try {
      const client = this.getClient(type);
      const { error } = await client.from('Event').select('id').limit(1);
      
      const isHealthy = !error;
      this.connectionHealth.set(clientId, { isHealthy, lastCheck: Date.now() });
      
      return isHealthy;
    } catch (error) {
      console.warn(`Supabase ${type} connection health check failed:`, error);
      this.connectionHealth.set(clientId, { isHealthy: false, lastCheck: Date.now() });
      return false;
    }
  }

  /**
   * Execute operation with retry logic and graceful degradation
   */
  async executeWithRetry<T>(
    operation: (client: SupabaseClient<Database>) => Promise<T>,
    options: {
      clientType?: 'anon' | 'service';
      maxRetries?: number;
      fallback?: () => Promise<T> | T;
    } = {}
  ): Promise<T> {
    const { clientType = 'anon', maxRetries = SUPABASE_CONFIG.retryAttempts, fallback } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check connection health before operation
        const isHealthy = await this.checkConnectionHealth(clientType);
        if (!isHealthy && attempt === 1) {
          console.warn(`Supabase ${clientType} connection unhealthy, attempting anyway...`);
        }

        const client = this.getClient(clientType);
        const result = await Promise.race([
          operation(client),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), SUPABASE_CONFIG.requestTimeout)
          ),
        ]);

        // Operation successful, mark connection as healthy
        this.connectionHealth.set(`${clientType}-client`, { isHealthy: true, lastCheck: Date.now() });
        return result;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`Supabase operation attempt ${attempt}/${maxRetries} failed:`, error);
        
        // Mark connection as unhealthy
        this.connectionHealth.set(`${clientType}-client`, { isHealthy: false, lastCheck: Date.now() });
        
        if (attempt < maxRetries) {
          const delay = SUPABASE_CONFIG.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed, try fallback if available
    if (fallback) {
      console.info('Using fallback after all Supabase attempts failed');
      return await fallback();
    }

    throw lastError || new Error('Supabase operation failed after all retries');
  }

  /**
   * Clear connection pool (useful for testing or reset)
   */
  clearPool(): void {
    this.clientPool.clear();
    this.connectionHealth.clear();
  }
}

// Export singleton instance methods
const connectionPool = SupabaseConnectionPool.getInstance();

export const supabaseAnon = () => connectionPool.getClient('anon');
export const supabaseService = () => connectionPool.getClient('service');
export const executeWithRetry = connectionPool.executeWithRetry.bind(connectionPool);
export const checkConnectionHealth = connectionPool.checkConnectionHealth.bind(connectionPool);

// Default export for convenience
export default {
  anon: supabaseAnon,
  service: supabaseService,
  executeWithRetry,
  checkConnectionHealth,
  clearPool: connectionPool.clearPool.bind(connectionPool),
};