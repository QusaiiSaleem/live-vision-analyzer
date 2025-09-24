// Autonomous Self-Learning Vision System Types
// Zero-configuration, business-agnostic intelligent monitoring

// Universal patterns that work in any business
export interface UniversalPattern {
  id: string;
  name: string;
  description: string;

  // Detection conditions (what triggers this pattern)
  conditions: {
    min_people?: number;
    max_people?: number;
    object_types?: string[];
    motion_level?: 'static' | 'slow' | 'normal' | 'fast';
    duration_seconds?: number;
    spatial_arrangement?: 'line' | 'cluster' | 'scattered' | 'grid';
  };

  // Learning metrics
  confidence: number;        // 0-1, increases with observations
  occurrence_count: number;  // How often seen
  last_seen: Date;
  first_seen: Date;

  // Context association
  typical_contexts: string[];  // Where this usually happens
  typical_times: string[];      // When this usually happens
  business_types: string[];     // Which businesses show this
}

// Inferred context from scene analysis
export interface SceneContext {
  // Primary context
  primary_activity: string;  // "checkout", "browsing", "waiting", etc.
  confidence: number;         // How sure we are

  // Supporting evidence
  detected_objects: {
    type: string;
    count: number;
    arrangement: string;
  }[];

  // Behavioral indicators
  crowd_density: number;      // 0-1 scale
  motion_intensity: number;   // 0-1 scale
  interaction_points: {
    location: string;
    type: string;  // "transaction", "consultation", "queue"
  }[];

  // Learned context
  matches_pattern?: string;   // ID of matched pattern
  is_typical: boolean;        // Normal for this time/place
  anomaly_score: number;      // 0-1, higher = more unusual
}

// Self-learning pattern database
export interface LearnedPattern {
  pattern_id: string;
  pattern_type: 'behavior' | 'spatial' | 'temporal' | 'operational';

  // Pattern details
  description: string;
  first_observed: Date;
  last_observed: Date;

  // Statistical learning
  observations: {
    count: number;
    confidence: number;
    avg_duration: number;
    std_deviation: number;
  };

  // Time patterns
  temporal_distribution: {
    hour_of_day: number[];     // 24-hour distribution
    day_of_week: number[];     // 7-day distribution
    seasonal_trend?: string;   // If detected
  };

  // Associated events
  triggers_events: string[];   // What events this pattern triggers
  preceded_by: string[];       // What patterns come before
  followed_by: string[];       // What patterns come after

  // Business context
  business_relevance: number;  // 0-1, how important for operations
  auto_assigned_category: string;  // System's understanding
}

// Business type detection
export interface BusinessTypeDetection {
  detected_type: BusinessType;
  confidence: number;

  // Evidence for detection
  evidence: {
    objects_seen: string[];
    patterns_observed: string[];
    interaction_types: string[];
  };

  // Operational characteristics
  characteristics: {
    has_queues: boolean;
    has_inventory: boolean;
    has_seating: boolean;
    has_transactions: boolean;
    has_appointments: boolean;
  };

  // Auto-configured monitoring
  recommended_monitoring: {
    primary_focus: string[];
    alert_priorities: string[];
    key_metrics: string[];
  };
}

export type BusinessType =
  | 'retail_store'
  | 'restaurant'
  | 'grocery'
  | 'warehouse'
  | 'healthcare'
  | 'office'
  | 'gym'
  | 'salon'
  | 'auto_service'
  | 'unknown';

// Context inference engine
export interface ContextInference {
  // Real-time analysis
  current_context: SceneContext;
  business_type: BusinessType;

  // Historical learning
  typical_patterns: Map<string, LearnedPattern>;
  anomaly_baseline: {
    normal_range: any;
    current_deviation: number;
  };

  // Predictions
  likely_next_event: string | null;
  estimated_duration: number | null;
  recommended_action: string | null;
}

// Autonomous event (no zones needed)
export interface AutonomousEvent {
  // Core identification
  id: string;
  timestamp: Date;

  // Inferred context (not configured)
  detected_context: string;
  inferred_location: string;  // System's guess about location
  business_context: BusinessType;

  // Detection details
  trigger_pattern: string;     // Which pattern triggered this
  confidence: number;          // How confident in detection
  is_anomaly: boolean;        // Unusual for this context

  // Analysis results
  ai_analysis: {
    description: string;
    structured_data: any;     // Context-specific metrics
    recommendations: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };

  // Learning feedback
  learning_metadata: {
    pattern_reinforced: boolean;
    new_pattern_detected: boolean;
    pattern_id: string;
    feedback_value: number;  // For reinforcement learning
  };

  // Multi-camera correlation
  camera_id: string;
  related_events?: string[];  // Events from other cameras
  cross_camera_tracking?: {
    object_id: string;
    cameras_seen: string[];
    journey_map: any;
  };
}

// Camera context (learned, not configured)
export interface CameraContext {
  camera_id: string;

  // Auto-discovered purpose
  primary_view: string;        // "entrance", "main_floor", etc.
  typical_activity: string[];  // Common activities seen
  coverage_area: string;       // System's understanding

  // Learned characteristics
  peak_times: string[];
  quiet_times: string[];
  typical_occupancy: number;

  // Patterns specific to this camera
  common_patterns: string[];
  rare_patterns: string[];

  // Quality metrics
  clarity_score: number;
  coverage_score: number;
  importance_score: number;  // Based on activity level
}

// System intelligence metrics
export interface SystemIntelligence {
  // Learning progress
  observation_hours: number;
  patterns_learned: number;
  accuracy_trend: 'improving' | 'stable' | 'declining';

  // Current understanding
  business_type: BusinessType;
  confidence_level: number;
  contexts_identified: string[];

  // Operational insights
  peak_periods: {
    time: string;
    activity: string;
    frequency: string;
  }[];

  efficiency_metrics: {
    metric: string;
    value: number;
    trend: string;
    benchmark: number;
  }[];

  // Recommendations
  insights: {
    type: 'optimization' | 'warning' | 'opportunity';
    description: string;
    impact: string;
    confidence: number;
  }[];
}

// Anomaly detection
export interface AnomalyDetection {
  anomaly_id: string;
  detected_at: Date;

  // Anomaly details
  type: 'behavioral' | 'temporal' | 'spatial' | 'operational';
  description: string;
  severity: number;  // 0-1 scale

  // What makes it anomalous
  expected: any;
  observed: any;
  deviation: number;

  // Context
  scene_context: SceneContext;
  historical_precedent: boolean;

  // Response
  requires_attention: boolean;
  auto_resolved: boolean;
  resolution_time?: Date;
}

// Multi-camera management
export interface CameraSystem {
  cameras: Map<string, Camera>;

  // System-wide learning
  global_patterns: LearnedPattern[];
  business_understanding: BusinessTypeDetection;

  // Cross-camera intelligence
  object_tracking: Map<string, CrossCameraTracking>;
  correlated_events: Map<string, string[]>;

  // Resource management
  processing_allocation: {
    camera_id: string;
    priority: number;
    fps_allocated: number;
  }[];
}

export interface Camera {
  id: string;
  stream_url: string;

  // Auto-learned context
  context: CameraContext;

  // Performance
  fps: number;
  resolution: string;
  last_frame: Date;

  // Status
  active: boolean;
  health: 'good' | 'degraded' | 'offline';
}

export interface CrossCameraTracking {
  object_id: string;
  object_type: string;

  // Journey through cameras
  path: {
    camera_id: string;
    timestamp: Date;
    context: string;
  }[];

  // Behavioral analysis
  total_duration: number;
  contexts_visited: string[];
  interactions: string[];
}

// Learning configuration (minimal, mostly automatic)
export interface LearningConfig {
  // Basic settings
  learning_rate: number;      // How fast to adapt (0.01-0.1)
  confidence_threshold: number; // Min confidence to act (0.5-0.9)

  // Anomaly sensitivity
  anomaly_sensitivity: 'low' | 'medium' | 'high';

  // Memory settings
  pattern_retention_days: number;  // How long to remember patterns
  max_patterns_stored: number;     // Memory limit

  // All other configuration is AUTOMATIC
}

// Real-time monitoring state
export interface MonitoringState {
  // System state
  active: boolean;
  start_time: Date;

  // Current analysis
  active_contexts: SceneContext[];
  active_patterns: string[];

  // Queue management
  analysis_queue: {
    priority: number;
    context: SceneContext;
    camera_id: string;
  }[];

  // Performance
  fps_actual: number;
  latency_ms: number;
  accuracy_estimate: number;
}

// Export functions for type guards
export function isRetailBusiness(type: BusinessType): boolean {
  return ['retail_store', 'grocery'].includes(type);
}

export function isServiceBusiness(type: BusinessType): boolean {
  return ['restaurant', 'healthcare', 'salon', 'auto_service'].includes(type);
}

export function requiresQueueMonitoring(type: BusinessType): boolean {
  return ['retail_store', 'grocery', 'restaurant', 'healthcare'].includes(type);
}

export function requiresSafetyMonitoring(type: BusinessType): boolean {
  return ['warehouse', 'gym', 'auto_service'].includes(type);
}