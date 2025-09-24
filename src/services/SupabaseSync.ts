// Supabase Sync Service - Handles cloud synchronization of analysis events
// Sends structured data (no images) to Supabase for storage and analytics

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AnalysisEvent, RealtimeAlert, OperationStats } from '../types/analysis';

// Supabase configuration (should be in environment variables)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export class SupabaseSync {
  private supabase: SupabaseClient | null = null;
  private syncQueue: AnalysisEvent[] = [];
  private syncInterval: NodeJS.Timer | null = null;
  private isInitialized: boolean = false;
  private batchSize: number = 10;
  private syncIntervalMs: number = 5000; // Sync every 5 seconds

  constructor() {
    this.initialize();
  }

  // Initialize Supabase client
  private initialize(): void {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('SupabaseSync: Missing credentials. Cloud sync disabled.');
      return;
    }

    try {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      this.isInitialized = true;
      console.log('SupabaseSync: Initialized successfully');

      // Start sync interval
      this.startSyncInterval();

      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions();

    } catch (error) {
      console.error('SupabaseSync: Failed to initialize:', error);
    }
  }

  // Add event to sync queue
  public queueEvent(event: AnalysisEvent): void {
    this.syncQueue.push(event);
    console.log(`SupabaseSync: Event queued. Queue size: ${this.syncQueue.length}`);

    // If queue is getting large, sync immediately
    if (this.syncQueue.length >= this.batchSize * 2) {
      this.syncBatch();
    }
  }

  // Start automatic sync interval
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncBatch();
    }, this.syncIntervalMs);
  }

  // Sync batch of events to Supabase
  private async syncBatch(): Promise<void> {
    if (!this.isInitialized || !this.supabase || this.syncQueue.length === 0) {
      return;
    }

    // Get batch of events
    const batch = this.syncQueue.splice(0, this.batchSize);

    try {
      console.log(`SupabaseSync: Syncing ${batch.length} events`);

      // Insert batch into Supabase
      const { data, error } = await this.supabase
        .from('analysis_events')
        .insert(batch.map(event => ({
          id: event.id,
          timestamp: event.timestamp,
          zone: event.zone,
          event_type: event.event_type,
          priority: event.priority,
          detection: event.detection,
          analysis: event.analysis,
          metadata: event.metadata,
          processed: event.processed,
          acknowledged: event.acknowledged,
          store_id: event.metadata.store_location,
          camera_id: event.metadata.camera_id
        })));

      if (error) {
        throw error;
      }

      console.log(`SupabaseSync: Successfully synced ${batch.length} events`);

      // Check for critical events that need alerts
      batch.forEach(event => {
        if (event.priority === 'CRITICAL' && !event.acknowledged) {
          this.createAlert(event);
        }
      });

    } catch (error) {
      console.error('SupabaseSync: Failed to sync batch:', error);
      // Re-queue failed events
      this.syncQueue.unshift(...batch);
    }
  }

  // Create real-time alert for critical events
  private async createAlert(event: AnalysisEvent): Promise<void> {
    if (!this.supabase) return;

    const alert: Partial<RealtimeAlert> = {
      event_id: event.id,
      title: `${event.event_type} Alert`,
      message: event.analysis.description,
      priority: event.priority,
      zone: event.zone,
      created_at: new Date(),
      requires_acknowledgment: true
    };

    try {
      const { error } = await this.supabase
        .from('realtime_alerts')
        .insert(alert);

      if (error) {
        console.error('SupabaseSync: Failed to create alert:', error);
      } else {
        console.log('SupabaseSync: Alert created for event', event.id);
      }
    } catch (error) {
      console.error('SupabaseSync: Alert creation error:', error);
    }
  }

  // Set up real-time subscriptions
  private setupRealtimeSubscriptions(): void {
    if (!this.supabase) return;

    // Subscribe to acknowledgments
    this.supabase
      .channel('acknowledgments')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analysis_events',
          filter: 'acknowledged=eq.true'
        },
        (payload) => {
          console.log('SupabaseSync: Event acknowledged:', payload.new);
          this.handleAcknowledgment(payload.new as any);
        }
      )
      .subscribe();

    // Subscribe to configuration changes
    this.supabase
      .channel('config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_config'
        },
        (payload) => {
          console.log('SupabaseSync: Configuration changed:', payload);
          this.handleConfigChange(payload.new as any);
        }
      )
      .subscribe();
  }

  // Handle event acknowledgment
  private handleAcknowledgment(event: any): void {
    // Emit custom event for UI update
    window.dispatchEvent(new CustomEvent('eventAcknowledged', {
      detail: { eventId: event.id }
    }));
  }

  // Handle configuration changes
  private handleConfigChange(config: any): void {
    // Emit custom event for configuration update
    window.dispatchEvent(new CustomEvent('configChanged', {
      detail: config
    }));
  }

  // Get operation statistics from Supabase
  public async getStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<OperationStats | null> {
    if (!this.supabase) return null;

    try {
      // Build date filter
      let query = this.supabase
        .from('analysis_events')
        .select('*');

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const stats: OperationStats = {
        total_events_today: 0,
        events_by_priority: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
        events_by_zone: {},
        average_queue_length: 0,
        average_wait_time: 0,
        inventory_alerts: 0,
        safety_incidents: 0,
        processing_time_avg: 0,
        system_uptime: 0
      };

      if (data && data.length > 0) {
        stats.total_events_today = data.length;

        // Count by priority and zone
        data.forEach((event: any) => {
          stats.events_by_priority[event.priority as keyof typeof stats.events_by_priority]++;
          stats.events_by_zone[event.zone] = (stats.events_by_zone[event.zone] || 0) + 1;

          // Calculate specific metrics
          if (event.event_type === 'queue_forming' && event.analysis?.queue_metrics) {
            stats.average_queue_length += event.analysis.queue_metrics.people_count || 0;
            stats.average_wait_time += event.analysis.queue_metrics.estimated_wait_minutes || 0;
          }

          if (event.event_type === 'inventory_low' || event.event_type === 'shelf_gap') {
            stats.inventory_alerts++;
          }

          if (event.event_type === 'safety_alert') {
            stats.safety_incidents++;
          }

          stats.processing_time_avg += event.metadata?.processing_time_ms || 0;
        });

        // Calculate averages
        const queueEvents = data.filter((e: any) => e.event_type === 'queue_forming').length;
        if (queueEvents > 0) {
          stats.average_queue_length /= queueEvents;
          stats.average_wait_time /= queueEvents;
        }

        if (data.length > 0) {
          stats.processing_time_avg /= data.length;
        }
      }

      return stats;

    } catch (error) {
      console.error('SupabaseSync: Failed to get statistics:', error);
      return null;
    }
  }

  // Get recent events
  public async getRecentEvents(limit: number = 50): Promise<AnalysisEvent[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('analysis_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('SupabaseSync: Failed to get recent events:', error);
      return [];
    }
  }

  // Acknowledge an event
  public async acknowledgeEvent(
    eventId: string,
    acknowledgedBy: string,
    notes?: string
  ): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { error } = await this.supabase
        .from('analysis_events')
        .update({
          acknowledged: true,
          resolution_time: new Date().toISOString(),
          notes: notes
        })
        .eq('id', eventId);

      if (error) throw error;

      console.log(`SupabaseSync: Event ${eventId} acknowledged`);
      return true;

    } catch (error) {
      console.error('SupabaseSync: Failed to acknowledge event:', error);
      return false;
    }
  }

  // Force sync all pending events
  public async forceSyncAll(): Promise<void> {
    while (this.syncQueue.length > 0) {
      await this.syncBatch();
    }
  }

  // Get sync status
  public getStatus(): {
    isConnected: boolean;
    queueSize: number;
    lastSyncTime?: Date;
  } {
    return {
      isConnected: this.isInitialized,
      queueSize: this.syncQueue.length
    };
  }

  // Clean up resources
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.supabase) {
      // Unsubscribe from all channels
      this.supabase.removeAllChannels();
    }

    // Force sync remaining events
    this.forceSyncAll();
  }
}

// Singleton instance
let supabaseSyncInstance: SupabaseSync | null = null;

export function getSupabaseSync(): SupabaseSync {
  if (!supabaseSyncInstance) {
    supabaseSyncInstance = new SupabaseSync();
  }
  return supabaseSyncInstance;
}