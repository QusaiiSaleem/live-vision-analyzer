// Analysis Event Types and Interfaces for Live Vision Analyzer
// This file defines all data structures for the event-triggered vision system

// Priority levels for event processing
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Types of zones we monitor in the retail environment
export type ZoneType = 'checkout' | 'entrance' | 'shelf_1' | 'shelf_2' | 'aisle' | 'storage';

// Types of events that trigger analysis
export type EventType =
  | 'queue_forming'      // People waiting in line
  | 'shelf_gap'         // Empty shelf space detected
  | 'high_interest'     // Customer dwelling in area
  | 'safety_alert'      // Spill or hazard detected
  | 'crowd_gathering'   // Unusual crowd formation
  | 'inventory_low';    // Low stock detected

// Customer mood assessment values
export type CustomerMood = 'calm' | 'neutral' | 'frustrated' | 'angry';

// Urgency scale for required actions
export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

// Detection data from YOLO model
export interface DetectionData {
  person_count: number;                    // Number of people detected
  object_counts: Record<string, number>;   // Count of each object type
  crowd_density: number;                   // 0-1 percentage of area filled
  motion_intensity: number;                // 0-1 scale of movement
  zone_occupancy: number;                  // Percentage of zone occupied
}

// Queue-specific metrics for checkout areas
export interface QueueMetrics {
  people_count: number;                    // Exact count in queue
  estimated_wait_minutes: number;          // Predicted wait time
  customer_mood: CustomerMood;             // Overall mood assessment
  staff_needed: boolean;                   // Should we call more staff?
  queue_length_meters?: number;            // Physical queue length
  average_processing_time?: number;        // Seconds per customer
}

// Inventory status for shelf monitoring
export interface InventoryStatus {
  products_visible: number;                // Count of visible items
  shelf_capacity_used: number;            // Percentage (0-100)
  restocking_needed: boolean;             // Immediate restock required?
  product_categories: string[];           // Detected product types
  empty_spots: number;                    // Number of gaps
  misplaced_items: boolean;              // Items in wrong location?
}

// Safety assessment for hazard detection
export interface SafetyAssessment {
  hazard_type: string;                    // Type of hazard detected
  immediate_action: boolean;              // Requires immediate response?
  affected_area: string;                  // Description of affected zone
  severity: 'low' | 'medium' | 'high';   // Severity level
  estimated_risk: number;                 // Risk score 0-100
}

// Customer behavior analysis
export interface CustomerBehavior {
  dwell_time_seconds: number;             // Time spent in area
  interaction_type: string;               // What they're doing
  products_examined: string[];            // Products looked at
  engagement_level: 'browsing' | 'interested' | 'comparing' | 'deciding';
  likely_to_purchase: boolean;            // Purchase intent prediction
}

// Main analysis result from LLaVA
export interface AnalysisResult {
  description: string;                     // Natural language description
  action_required: boolean;               // Does this need action?
  urgency_level: UrgencyLevel;           // How urgent is the action?

  // Optional specialized analyses (only one will be populated based on event type)
  queue_metrics?: QueueMetrics;
  inventory_status?: InventoryStatus;
  safety_assessment?: SafetyAssessment;
  customer_behavior?: CustomerBehavior;

  // Confidence in the analysis
  confidence_score: number;                // 0-1 confidence in analysis
  suggested_actions: string[];            // List of recommended actions
}

// Metadata about the analysis process
export interface AnalysisMetadata {
  camera_id: string;                      // Which camera captured this
  store_location: string;                 // Store identifier
  processing_time_ms: number;             // Time to process
  model_version: string;                  // Model versions used
  frame_quality: number;                  // Quality score of input frame
  analysis_timestamp: Date;               // When analysis completed
}

// Main event structure - this is what gets saved to Supabase
export interface AnalysisEvent {
  // Core identification
  id: string;                            // UUID for this event
  timestamp: Date;                       // When event occurred

  // Event classification
  zone: ZoneType;                        // Where it happened
  event_type: EventType;                 // What type of event
  priority: Priority;                    // Processing priority

  // Analysis data (no images stored)
  detection: DetectionData;              // YOLO detection results
  analysis: AnalysisResult;              // LLaVA analysis results
  metadata: AnalysisMetadata;            // System metadata

  // Tracking fields
  processed: boolean;                    // Has this been handled?
  acknowledged: boolean;                 // Has staff acknowledged?
  resolution_time?: Date;                // When was it resolved?
  notes?: string;                       // Staff notes
}

// Configuration for zones in the store
export interface ZoneConfig {
  id: string;                           // Unique zone identifier
  name: string;                         // Human-readable name
  type: ZoneType;                       // Type of zone
  coordinates: {                       // Pixel coordinates in frame
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  trigger_thresholds: {                // When to trigger events
    max_people?: number;                // Max people before alert
    min_inventory?: number;             // Min products before alert
    max_dwell_time?: number;           // Max seconds before alert
    crowd_density?: number;            // Max density before alert
  };
  custom_prompt?: string;              // Zone-specific LLaVA prompt
}

// Event in the processing queue
export interface QueuedEvent {
  event: Partial<AnalysisEvent>;       // Event data (may be incomplete)
  frame_base64?: string;               // Optional frame data (not saved)
  priority: Priority;                  // Processing priority
  queued_at: Date;                    // When added to queue
  attempts: number;                   // Processing attempts
  last_error?: string;                // Last processing error
}

// Statistics for dashboard display
export interface OperationStats {
  total_events_today: number;
  events_by_priority: Record<Priority, number>;
  events_by_zone: Record<ZoneType, number>;
  average_queue_length: number;
  average_wait_time: number;
  inventory_alerts: number;
  safety_incidents: number;
  processing_time_avg: number;
  system_uptime: number;
}

// Real-time alert for critical events
export interface RealtimeAlert {
  id: string;
  event_id: string;                   // Reference to AnalysisEvent
  title: string;
  message: string;
  priority: Priority;
  zone: ZoneType;
  created_at: Date;
  requires_acknowledgment: boolean;
  acknowledged_by?: string;
  acknowledged_at?: Date;
}

// Configuration for the entire system
export interface SystemConfig {
  detection_fps: number;               // YOLO processing rate
  analysis_timeout_ms: number;        // LLaVA timeout
  max_queue_size: number;             // Max events in queue
  zones: ZoneConfig[];                // All configured zones
  supabase_sync_interval: number;     // Milliseconds between syncs
  enable_alerts: boolean;             // Send real-time alerts?
  alert_channels: string[];           // Where to send alerts
}