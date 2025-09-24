// Context Inference Engine - The brain of the autonomous system
// Understands scenes without any configuration or zones

import {
  UniversalPattern,
  SceneContext,
  LearnedPattern,
  BusinessType,
  BusinessTypeDetection,
  ContextInference,
  AutonomousEvent,
  AnomalyDetection,
  SystemIntelligence
} from '../types/autonomous';
import { DetectionData } from '../types/analysis';
import { v4 as uuidv4 } from 'uuid';

// Universal patterns that work in ANY business
const UNIVERSAL_PATTERNS: UniversalPattern[] = [
  // Queue Patterns
  {
    id: 'queue_formation',
    name: 'Queue Formation',
    description: 'Multiple people standing in line',
    conditions: {
      min_people: 3,
      spatial_arrangement: 'line',
      motion_level: 'static',
      duration_seconds: 30
    },
    confidence: 1.0,
    occurrence_count: 0,
    last_seen: new Date(),
    first_seen: new Date(),
    typical_contexts: ['checkout', 'service_desk', 'entrance'],
    typical_times: ['morning', 'lunch', 'evening'],
    business_types: ['retail_store', 'restaurant', 'healthcare']
  },

  // Crowd Patterns
  {
    id: 'crowd_gathering',
    name: 'Crowd Gathering',
    description: 'Dense group of people',
    conditions: {
      min_people: 5,
      spatial_arrangement: 'cluster',
      motion_level: 'slow'
    },
    confidence: 1.0,
    occurrence_count: 0,
    last_seen: new Date(),
    first_seen: new Date(),
    typical_contexts: ['entrance', 'event_area', 'sale_zone'],
    typical_times: ['peak_hours'],
    business_types: ['retail_store', 'restaurant', 'gym']
  },

  // Browsing Patterns
  {
    id: 'customer_browsing',
    name: 'Customer Browsing',
    description: 'Person examining products/displays',
    conditions: {
      min_people: 1,
      motion_level: 'slow',
      duration_seconds: 60,
      object_types: ['shelf', 'display', 'product']
    },
    confidence: 1.0,
    occurrence_count: 0,
    last_seen: new Date(),
    first_seen: new Date(),
    typical_contexts: ['retail_floor', 'showroom'],
    typical_times: ['business_hours'],
    business_types: ['retail_store', 'grocery']
  },

  // Service Patterns
  {
    id: 'service_interaction',
    name: 'Service Interaction',
    description: 'Customer-staff interaction at fixed point',
    conditions: {
      min_people: 2,
      motion_level: 'static',
      duration_seconds: 120,
      object_types: ['counter', 'desk', 'register']
    },
    confidence: 1.0,
    occurrence_count: 0,
    last_seen: new Date(),
    first_seen: new Date(),
    typical_contexts: ['checkout', 'service_desk', 'consultation'],
    typical_times: ['business_hours'],
    business_types: ['retail_store', 'healthcare', 'salon']
  },

  // Safety Patterns
  {
    id: 'potential_hazard',
    name: 'Potential Hazard',
    description: 'Unsafe condition detected',
    conditions: {
      object_types: ['spill', 'obstacle', 'fallen_item'],
      motion_level: 'fast'
    },
    confidence: 1.0,
    occurrence_count: 0,
    last_seen: new Date(),
    first_seen: new Date(),
    typical_contexts: ['floor', 'aisle', 'entrance'],
    typical_times: ['any'],
    business_types: ['all']
  }
];

// Business type indicators
const BUSINESS_INDICATORS = {
  retail_store: ['checkout', 'shelf', 'cart', 'product', 'cash_register'],
  restaurant: ['table', 'chair', 'menu', 'kitchen', 'waiter'],
  grocery: ['produce', 'cart', 'checkout', 'freezer', 'shelf'],
  warehouse: ['forklift', 'pallet', 'box', 'loading_dock', 'safety_vest'],
  healthcare: ['waiting_room', 'reception', 'wheelchair', 'medical_equipment'],
  office: ['desk', 'computer', 'meeting_room', 'printer'],
  gym: ['equipment', 'weights', 'mat', 'mirror', 'locker'],
  salon: ['chair', 'mirror', 'sink', 'styling_tools'],
  auto_service: ['car', 'lift', 'tool', 'tire', 'service_bay']
};

export class ContextInferenceEngine {
  private patterns: Map<string, UniversalPattern>;
  private learnedPatterns: Map<string, LearnedPattern>;
  private patternDatabase: Map<string, any> = new Map();
  private businessType: BusinessType = 'unknown';
  private businessConfidence: number = 0;
  private observationCount: number = 0;
  private startTime: Date = new Date();
  private anomalyBaseline: Map<string, any> = new Map();
  private contextHistory: SceneContext[] = [];
  private readonly HISTORY_SIZE = 100;
  private systemIntelligence: SystemIntelligence;

  constructor() {
    // Initialize with universal patterns
    this.patterns = new Map();
    this.learnedPatterns = new Map();

    UNIVERSAL_PATTERNS.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });

    // Initialize system intelligence
    this.systemIntelligence = {
      observation_hours: 0,
      patterns_learned: 0,
      accuracy_trend: 'improving',
      business_type: 'unknown',
      confidence_level: 0.1,
      contexts_identified: [],
      peak_periods: [],
      efficiency_metrics: [],
      insights: []
    };

    console.log('ContextInferenceEngine: Initialized with', this.patterns.size, 'universal patterns');
  }

  // Main inference function - understands what's happening
  public inferContext(detection: DetectionData): SceneContext {
    this.observationCount++;
    // Track observation time for learning phase (assuming called at 10 FPS)
    this.systemIntelligence.observation_hours += 1 / 36000; // Add 0.1 second

    // Build scene context from detection
    const context: SceneContext = {
      primary_activity: this.inferPrimaryActivity(detection),
      confidence: 0.5, // Start with medium confidence

      detected_objects: this.extractObjects(detection),

      crowd_density: detection.crowd_density,
      motion_intensity: detection.motion_intensity,
      interaction_points: this.identifyInteractionPoints(detection),

      is_typical: false,
      anomaly_score: 0
    };

    // Match against known patterns
    const matchedPattern = this.findBestPatternMatch(context, detection);
    if (matchedPattern) {
      context.matches_pattern = matchedPattern.id;
      context.confidence = matchedPattern.confidence;

      // Update pattern learning
      this.reinforcePattern(matchedPattern);
    }

    // Calculate if this is typical or anomalous
    context.is_typical = this.isTypicalContext(context);
    context.anomaly_score = this.calculateAnomalyScore(context);

    // Update business type understanding
    this.updateBusinessTypeDetection(detection, context);

    // Store in history for learning
    this.updateContextHistory(context);

    return context;
  }

  // Infer primary activity from detection data
  private inferPrimaryActivity(detection: DetectionData): string {
    const { person_count, crowd_density, motion_intensity } = detection;

    // Rule-based inference (lower thresholds during learning)
    const isLearningPhase = this.systemIntelligence.observation_hours < 1;
    const queueThreshold = isLearningPhase ? 2 : 3;

    if (person_count >= queueThreshold && crowd_density > 0.3 && motion_intensity < 0.3) {
      return 'queue_formation';
    }

    // Single person activities (for learning visibility)
    if (person_count === 1) {
      if (motion_intensity > 0.3) return 'person_active';
      if (motion_intensity < 0.1) return 'person_stationary';
      return 'person_present';
    }
    if (person_count >= 5 && crowd_density > 0.5) {
      return 'crowd_gathering';
    }
    if (person_count === 1 && motion_intensity < 0.2) {
      return 'customer_browsing';
    }
    if (person_count === 2 && motion_intensity < 0.1) {
      return 'service_interaction';
    }
    if (motion_intensity > 0.8) {
      return 'rapid_movement';
    }
    if (person_count === 0) {
      return 'empty_area';
    }

    return 'general_activity';
  }

  // Extract objects from detection
  private extractObjects(detection: DetectionData): SceneContext['detected_objects'] {
    const objects: SceneContext['detected_objects'] = [];

    // Convert object counts to structured format
    Object.entries(detection.object_counts).forEach(([type, count]) => {
      objects.push({
        type,
        count,
        arrangement: this.inferArrangement(type, count)
      });
    });

    // Add people as objects
    if (detection.person_count > 0) {
      objects.push({
        type: 'person',
        count: detection.person_count,
        arrangement: this.inferPeopleArrangement(detection.person_count, detection.crowd_density)
      });
    }

    return objects;
  }

  // Infer spatial arrangement
  private inferArrangement(type: string, count: number): string {
    // This would be enhanced with actual spatial analysis
    if (count === 1) return 'single';
    if (count <= 3) return 'few';
    return 'many';
  }

  // Infer how people are arranged
  private inferPeopleArrangement(count: number, density: number): string {
    if (count <= 1) return 'single';
    if (density < 0.2) return 'scattered';
    if (density < 0.5) return 'grouped';
    if (density < 0.7) return 'crowded';
    return 'dense';
  }

  // Identify interaction points in the scene
  private identifyInteractionPoints(detection: DetectionData): SceneContext['interaction_points'] {
    const points: SceneContext['interaction_points'] = [];

    // Infer from object combinations
    if (detection.object_counts['cash_register'] || detection.object_counts['counter']) {
      points.push({
        location: 'checkout_area',
        type: 'transaction'
      });
    }

    if (detection.object_counts['desk'] && detection.person_count >= 2) {
      points.push({
        location: 'service_desk',
        type: 'consultation'
      });
    }

    if (detection.person_count >= 3 && detection.crowd_density > 0.3) {
      points.push({
        location: 'queue_area',
        type: 'queue'
      });
    }

    return points;
  }

  // Find best matching pattern
  private findBestPatternMatch(context: SceneContext, detection: DetectionData): UniversalPattern | null {
    let bestMatch: UniversalPattern | null = null;
    let highestScore = 0;

    this.patterns.forEach(pattern => {
      const score = this.calculatePatternMatchScore(pattern, context, detection);
      if (score > highestScore && score > 0.5) {
        highestScore = score;
        bestMatch = pattern;
      }
    });

    return bestMatch;
  }

  // Calculate pattern match score
  private calculatePatternMatchScore(
    pattern: UniversalPattern,
    context: SceneContext,
    detection: DetectionData
  ): number {
    let score = 0;
    let factors = 0;

    const conditions = pattern.conditions;

    // Check people count
    if (conditions.min_people !== undefined) {
      if (detection.person_count >= conditions.min_people) {
        score += 1;
      }
      factors++;
    }

    // Check motion level
    if (conditions.motion_level) {
      const motionMatch = this.matchMotionLevel(detection.motion_intensity, conditions.motion_level);
      if (motionMatch) score += 1;
      factors++;
    }

    // Check object types
    if (conditions.object_types) {
      const objectMatch = conditions.object_types.some(type =>
        context.detected_objects.some(obj => obj.type.includes(type))
      );
      if (objectMatch) score += 1;
      factors++;
    }

    // Check spatial arrangement
    if (conditions.spatial_arrangement) {
      const arrangementMatch = context.detected_objects.some(
        obj => obj.arrangement === conditions.spatial_arrangement
      );
      if (arrangementMatch) score += 0.5;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  // Match motion level
  private matchMotionLevel(intensity: number, level: string): boolean {
    switch (level) {
      case 'static': return intensity < 0.1;
      case 'slow': return intensity >= 0.1 && intensity < 0.4;
      case 'normal': return intensity >= 0.4 && intensity < 0.7;
      case 'fast': return intensity >= 0.7;
      default: return false;
    }
  }

  // Reinforce a pattern when matched
  private reinforcePattern(pattern: UniversalPattern): void {
    pattern.occurrence_count++;
    pattern.last_seen = new Date();

    // Increase confidence slightly (up to max 1.0)
    pattern.confidence = Math.min(1.0, pattern.confidence + 0.01);

    // Create or update learned pattern
    this.updateLearnedPattern(pattern);
  }

  // Update learned patterns
  private updateLearnedPattern(pattern: UniversalPattern): void {
    const learnedId = `learned_${pattern.id}`;
    let learned = this.learnedPatterns.get(learnedId);

    if (!learned) {
      // Create new learned pattern
      learned = {
        pattern_id: learnedId,
        pattern_type: 'behavior',
        description: pattern.description,
        first_observed: new Date(),
        last_observed: new Date(),
        observations: {
          count: 1,
          confidence: pattern.confidence,
          avg_duration: 0,
          std_deviation: 0
        },
        temporal_distribution: {
          hour_of_day: new Array(24).fill(0),
          day_of_week: new Array(7).fill(0)
        },
        triggers_events: [],
        preceded_by: [],
        followed_by: [],
        business_relevance: 0.5,
        auto_assigned_category: pattern.name
      };
    } else {
      // Update existing
      learned.last_observed = new Date();
      learned.observations.count++;
      learned.observations.confidence = pattern.confidence;
    }

    // Update temporal distribution
    const now = new Date();
    learned.temporal_distribution.hour_of_day[now.getHours()]++;
    learned.temporal_distribution.day_of_week[now.getDay()]++;

    this.learnedPatterns.set(learnedId, learned);
  }

  // Check if context is typical
  private isTypicalContext(context: SceneContext): boolean {
    if (this.contextHistory.length < 10) {
      return true; // Not enough history to judge
    }

    // Compare with recent history
    const similarContexts = this.contextHistory.filter(
      hist => hist.primary_activity === context.primary_activity
    );

    // If we've seen this activity before, it's typical
    return similarContexts.length > this.contextHistory.length * 0.1;
  }

  // Calculate anomaly score
  private calculateAnomalyScore(context: SceneContext): number {
    if (this.contextHistory.length < 10) {
      return 0; // Not enough data
    }

    let anomalyScore = 0;
    let factors = 0;

    // Check crowd density anomaly
    const avgDensity = this.contextHistory.reduce((sum, c) => sum + c.crowd_density, 0) / this.contextHistory.length;
    const densityDeviation = Math.abs(context.crowd_density - avgDensity) / (avgDensity || 1);
    if (densityDeviation > 0.5) {
      anomalyScore += densityDeviation;
      factors++;
    }

    // Check motion anomaly
    const avgMotion = this.contextHistory.reduce((sum, c) => sum + c.motion_intensity, 0) / this.contextHistory.length;
    const motionDeviation = Math.abs(context.motion_intensity - avgMotion) / (avgMotion || 1);
    if (motionDeviation > 0.5) {
      anomalyScore += motionDeviation;
      factors++;
    }

    // Check for new activity type
    if (!this.contextHistory.some(c => c.primary_activity === context.primary_activity)) {
      anomalyScore += 0.5;
      factors++;
    }

    return factors > 0 ? Math.min(1.0, anomalyScore / factors) : 0;
  }

  // Update business type detection
  private updateBusinessTypeDetection(detection: DetectionData, context: SceneContext): void {
    // Count business indicators
    const scores: Record<BusinessType, number> = {
      retail_store: 0,
      restaurant: 0,
      grocery: 0,
      warehouse: 0,
      healthcare: 0,
      office: 0,
      gym: 0,
      salon: 0,
      auto_service: 0,
      unknown: 0
    };

    // Check each business type's indicators
    Object.entries(BUSINESS_INDICATORS).forEach(([business, indicators]) => {
      indicators.forEach(indicator => {
        // Check if indicator object is detected
        if (detection.object_counts[indicator] ||
            context.detected_objects.some(obj => obj.type.includes(indicator))) {
          scores[business as BusinessType] += 1;
        }
      });
    });

    // Find highest scoring business type
    let maxScore = 0;
    let detectedType: BusinessType = 'unknown';

    Object.entries(scores).forEach(([type, score]) => {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type as BusinessType;
      }
    });

    // Update if we have enough confidence
    if (maxScore >= 2 && this.observationCount > 10) {
      this.businessType = detectedType;
      this.businessConfidence = Math.min(1.0, maxScore / 5); // Normalize to 0-1
    }
  }

  // Update context history
  private updateContextHistory(context: SceneContext): void {
    this.contextHistory.push(context);

    // Keep only recent history
    if (this.contextHistory.length > this.HISTORY_SIZE) {
      this.contextHistory.shift();
    }
  }

  // Get business type detection
  public getBusinessType(): BusinessTypeDetection {
    return {
      detected_type: this.businessType,
      confidence: this.businessConfidence,
      evidence: {
        objects_seen: this.getSeenObjects(),
        patterns_observed: Array.from(this.patterns.keys()),
        interaction_types: this.getInteractionTypes()
      },
      characteristics: {
        has_queues: this.hasQueues(),
        has_inventory: this.hasInventory(),
        has_seating: this.hasSeating(),
        has_transactions: this.hasTransactions(),
        has_appointments: this.hasAppointments()
      },
      recommended_monitoring: {
        primary_focus: this.getPrimaryFocus(),
        alert_priorities: this.getAlertPriorities(),
        key_metrics: this.getKeyMetrics()
      }
    };
  }

  // Helper methods for business detection
  private getSeenObjects(): string[] {
    const objects = new Set<string>();
    this.contextHistory.forEach(context => {
      context.detected_objects.forEach(obj => objects.add(obj.type));
    });
    return Array.from(objects);
  }

  private getInteractionTypes(): string[] {
    const types = new Set<string>();
    this.contextHistory.forEach(context => {
      context.interaction_points.forEach(point => types.add(point.type));
    });
    return Array.from(types);
  }

  private hasQueues(): boolean {
    return this.contextHistory.some(c => c.primary_activity === 'queue_formation');
  }

  private hasInventory(): boolean {
    return this.getSeenObjects().some(obj => ['shelf', 'product', 'inventory'].includes(obj));
  }

  private hasSeating(): boolean {
    return this.getSeenObjects().some(obj => ['chair', 'table', 'booth'].includes(obj));
  }

  private hasTransactions(): boolean {
    return this.getInteractionTypes().includes('transaction');
  }

  private hasAppointments(): boolean {
    return this.businessType === 'healthcare' || this.businessType === 'salon';
  }

  private getPrimaryFocus(): string[] {
    switch (this.businessType) {
      case 'retail_store':
      case 'grocery':
        return ['queue_management', 'inventory_monitoring', 'customer_service'];
      case 'restaurant':
        return ['table_turnover', 'wait_times', 'service_flow'];
      case 'warehouse':
        return ['safety_compliance', 'efficiency', 'inventory_movement'];
      case 'healthcare':
        return ['patient_flow', 'wait_times', 'privacy'];
      default:
        return ['general_monitoring'];
    }
  }

  private getAlertPriorities(): string[] {
    switch (this.businessType) {
      case 'warehouse':
      case 'auto_service':
        return ['safety', 'efficiency', 'compliance'];
      case 'retail_store':
      case 'grocery':
        return ['long_queues', 'low_inventory', 'customer_needs'];
      case 'healthcare':
        return ['urgent_patients', 'long_waits', 'privacy'];
      default:
        return ['anomalies', 'crowding', 'safety'];
    }
  }

  private getKeyMetrics(): string[] {
    switch (this.businessType) {
      case 'retail_store':
      case 'grocery':
        return ['queue_length', 'wait_time', 'inventory_levels'];
      case 'restaurant':
        return ['table_occupancy', 'service_time', 'queue_length'];
      case 'warehouse':
        return ['safety_incidents', 'throughput', 'space_utilization'];
      default:
        return ['occupancy', 'activity_level', 'anomalies'];
    }
  }

  // Generate autonomous event from context
  public generateEvent(context: SceneContext, cameraId: string): AutonomousEvent | null {
    // During learning phase (first hour), generate ALL events for visibility
    const isLearningPhase = this.systemIntelligence.observation_hours < 1;

    console.log('🎯 Event generation check:', {
      isLearningPhase,
      context: context.primary_activity,
      confidence: context.confidence,
      anomaly: context.anomaly_score,
      observation_hours: this.systemIntelligence.observation_hours
    });

    // ALWAYS generate events during learning phase for visibility
    // After learning, only generate if significant
    if (!isLearningPhase) {
      const confidenceThreshold = 0.5;
      const anomalyThreshold = 0.5;
      if (context.confidence < confidenceThreshold && context.anomaly_score < anomalyThreshold) {
        return null;
      }
    }

    const event: AutonomousEvent = {
      id: uuidv4(),
      timestamp: new Date(),

      detected_context: context.primary_activity || 'learning_observation',
      inferred_location: this.inferLocation(context),
      business_context: this.businessType,

      trigger_pattern: context.matches_pattern || (isLearningPhase ? 'learning' : 'unknown'),
      confidence: context.confidence,
      is_anomaly: context.anomaly_score > (isLearningPhase ? 0.3 : 0.5),

      ai_analysis: {
        description: isLearningPhase
          ? this.generateLearningDescription(context)
          : this.generateDescription(context),
        structured_data: {
          ...this.extractStructuredData(context),
          learning_phase: isLearningPhase,
          patterns_observed: this.patternDatabase.size,
          observation_time: this.systemIntelligence.observation_hours
        },
        recommendations: isLearningPhase
          ? ['System is learning your environment', 'More activity helps learning']
          : this.generateRecommendations(context),
        urgency: isLearningPhase ? 'low' : this.determineUrgency(context)
      },

      learning_metadata: {
        pattern_reinforced: !!context.matches_pattern,
        new_pattern_detected: false, // To be implemented
        pattern_id: context.matches_pattern || '',
        feedback_value: context.confidence
      },

      camera_id: cameraId
    };

    return event;
  }

  // Infer location from context
  private inferLocation(context: SceneContext): string {
    if (context.interaction_points.length > 0) {
      return context.interaction_points[0].location;
    }
    return 'main_area';
  }

  // Generate learning phase description
  private generateLearningDescription(context: SceneContext): string {
    const objects = context.detected_objects;
    let description = 'Learning: ';

    if (objects.length > 0) {
      const personCount = objects.find(o => o.type === 'person')?.count || 0;
      const otherObjects = objects.filter(o => o.type !== 'person');

      if (personCount > 0) {
        description += `${personCount} person${personCount > 1 ? 's' : ''} detected. `;
      }
      if (otherObjects.length > 0) {
        description += `${otherObjects.length} object type${otherObjects.length > 1 ? 's' : ''}. `;
      }
    }

    description += `Density: ${(context.crowd_density * 100).toFixed(0)}%, `;
    description += `Motion: ${(context.motion_intensity * 100).toFixed(0)}%. `;
    description += `Building baseline patterns...`;

    return description;
  }

  // Generate natural language description
  private generateDescription(context: SceneContext): string {
    let description = `Detected ${context.primary_activity}`;

    if (context.detected_objects.length > 0) {
      const peopleObj = context.detected_objects.find(obj => obj.type === 'person');
      if (peopleObj) {
        description += ` with ${peopleObj.count} people`;
      }
    }

    if (context.is_typical) {
      description += ' (typical for this time)';
    } else if (context.anomaly_score > 0.5) {
      description += ' (unusual activity)';
    }

    return description;
  }

  // Extract structured metrics
  private extractStructuredData(context: SceneContext): any {
    return {
      activity: context.primary_activity,
      confidence: context.confidence,
      crowd_density: context.crowd_density,
      motion_intensity: context.motion_intensity,
      is_typical: context.is_typical,
      anomaly_score: context.anomaly_score,
      objects_detected: context.detected_objects
    };
  }

  // Generate recommendations
  private generateRecommendations(context: SceneContext): string[] {
    const recommendations: string[] = [];

    if (context.primary_activity === 'queue_formation' && context.crowd_density > 0.5) {
      recommendations.push('Consider opening additional service points');
    }

    if (context.anomaly_score > 0.7) {
      recommendations.push('Investigate unusual activity');
    }

    if (context.motion_intensity > 0.8) {
      recommendations.push('Check for safety concerns');
    }

    return recommendations;
  }

  // Determine urgency
  private determineUrgency(context: SceneContext): 'low' | 'medium' | 'high' | 'critical' {
    if (context.anomaly_score > 0.8 || context.motion_intensity > 0.9) {
      return 'critical';
    }
    if (context.primary_activity === 'queue_formation' && context.crowd_density > 0.7) {
      return 'high';
    }
    if (context.anomaly_score > 0.5) {
      return 'medium';
    }
    return 'low';
  }

  // Get system intelligence metrics
  public getSystemIntelligence(): SystemIntelligence {
    const hoursObserved = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);

    // Update stored intelligence
    this.systemIntelligence.observation_hours = hoursObserved;
    this.systemIntelligence.patterns_learned = this.learnedPatterns.size;
    this.systemIntelligence.accuracy_trend = this.calculateAccuracyTrend();
    this.systemIntelligence.business_type = this.businessType;
    this.systemIntelligence.confidence_level = this.businessConfidence;
    this.systemIntelligence.contexts_identified = this.getUniqueContexts();
    this.systemIntelligence.peak_periods = this.identifyPeakPeriods();
    this.systemIntelligence.efficiency_metrics = this.calculateEfficiencyMetrics();
    this.systemIntelligence.insights = this.generateInsights();

    return this.systemIntelligence;
  }

  // Calculate accuracy trend
  private calculateAccuracyTrend(): 'improving' | 'stable' | 'declining' {
    if (this.observationCount < 100) return 'improving';

    // Calculate confidence trend
    const recentConfidence = this.contextHistory.slice(-10).reduce((sum, c) => sum + c.confidence, 0) / 10;
    const olderConfidence = this.contextHistory.slice(-20, -10).reduce((sum, c) => sum + c.confidence, 0) / 10;

    if (recentConfidence > olderConfidence + 0.1) return 'improving';
    if (recentConfidence < olderConfidence - 0.1) return 'declining';
    return 'stable';
  }

  // Get unique contexts identified
  private getUniqueContexts(): string[] {
    const contexts = new Set<string>();
    this.contextHistory.forEach(c => contexts.add(c.primary_activity));
    return Array.from(contexts);
  }

  // Identify peak periods
  private identifyPeakPeriods(): SystemIntelligence['peak_periods'] {
    const peaks: SystemIntelligence['peak_periods'] = [];

    // Analyze temporal distribution
    this.learnedPatterns.forEach(pattern => {
      const hourDist = pattern.temporal_distribution.hour_of_day;
      const maxHour = hourDist.indexOf(Math.max(...hourDist));

      if (maxHour >= 0) {
        peaks.push({
          time: `${maxHour}:00`,
          activity: pattern.auto_assigned_category,
          frequency: 'daily'
        });
      }
    });

    return peaks;
  }

  // Calculate efficiency metrics
  private calculateEfficiencyMetrics(): SystemIntelligence['efficiency_metrics'] {
    return [
      {
        metric: 'Pattern Recognition Rate',
        value: this.learnedPatterns.size / Math.max(1, this.observationCount) * 100,
        trend: 'increasing',
        benchmark: 80
      },
      {
        metric: 'Anomaly Detection Accuracy',
        value: this.businessConfidence * 100,
        trend: 'stable',
        benchmark: 90
      },
      {
        metric: 'Context Confidence',
        value: this.contextHistory.reduce((sum, c) => sum + c.confidence, 0) / Math.max(1, this.contextHistory.length) * 100,
        trend: 'improving',
        benchmark: 75
      }
    ];
  }

  // Generate insights
  private generateInsights(): SystemIntelligence['insights'] {
    const insights: SystemIntelligence['insights'] = [];

    // Queue insights
    if (this.hasQueues()) {
      const queueContexts = this.contextHistory.filter(c => c.primary_activity === 'queue_formation');
      if (queueContexts.length > 10) {
        insights.push({
          type: 'optimization',
          description: 'Regular queue formation detected. Consider optimizing service flow.',
          impact: 'Could reduce wait times by 20-30%',
          confidence: 0.8
        });
      }
    }

    // Anomaly insights
    const anomalousContexts = this.contextHistory.filter(c => c.anomaly_score > 0.5);
    if (anomalousContexts.length > 5) {
      insights.push({
        type: 'warning',
        description: 'Multiple anomalies detected. Review operations for irregularities.',
        impact: 'May indicate operational issues',
        confidence: 0.7
      });
    }

    // Business optimization
    if (this.businessConfidence > 0.8) {
      insights.push({
        type: 'opportunity',
        description: `System has learned your ${this.businessType} operations. Ready for advanced analytics.`,
        impact: 'Enable predictive insights and automation',
        confidence: 0.9
      });
    }

    return insights;
  }

  // Reset learning (if needed)
  public reset(): void {
    this.learnedPatterns.clear();
    this.contextHistory = [];
    this.observationCount = 0;
    this.businessType = 'unknown';
    this.businessConfidence = 0;
    console.log('ContextInferenceEngine: Learning reset');
  }
}