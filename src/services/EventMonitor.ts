// Autonomous Event Monitor Service - Zero-configuration, self-learning vision system
// Runs continuous YOLO detection with intelligent context inference and LLaVA analysis

import {
  DetectionData,
  Priority
} from '../types/analysis';
import {
  AutonomousEvent,
  SceneContext,
  Camera,
  CameraContext,
  MonitoringState
} from '../types/autonomous';
import { ContextInferenceEngine } from './ContextInferenceEngine';
// UUID generation will be handled by crypto.randomUUID()

// Queued event for processing
interface QueuedAutonomousEvent {
  event: AutonomousEvent;
  frame_base64: string;
  priority: Priority;
  queued_at: Date;
  attempts: number;
  last_error?: string;
}

// Priority queue for autonomous events
class PriorityQueue<T> {
  private items: { element: T; priority: number }[] = [];

  private getPriorityValue(priority: Priority): number {
    const map = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    return map[priority];
  }

  enqueue(element: T, priority: Priority): void {
    const queueElement = { element, priority: this.getPriorityValue(priority) };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(queueElement);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  peek(): T | undefined {
    return this.items[0]?.element;
  }
}

// Autonomous Event Monitor - Zero configuration required
export class EventMonitor {
  // Core components
  private contextEngine: ContextInferenceEngine;
  private yoloInterval: NodeJS.Timer | null = null;
  private eventQueue: PriorityQueue<QueuedAutonomousEvent> = new PriorityQueue();
  private isProcessing: boolean = false;

  // Frame management
  private frameBuffer: string[] = [];  // Stores last N frames
  private maxBufferSize: number = 30;  // 3 seconds at 10 FPS
  private detectionFPS: number = 10;   // YOLO runs at 10-15 FPS

  // Camera management (multi-camera ready)
  private cameras: Map<string, Camera> = new Map();
  private cameraContexts: Map<string, CameraContext> = new Map();
  private activeCameraId: string = 'camera_1';  // Default camera

  // Detection tracking
  private eventHistory: AutonomousEvent[] = [];

  // Video elements
  private videoRef: HTMLVideoElement | null = null;
  private canvasRef: HTMLCanvasElement | null = null;

  // System state
  private monitoringState: MonitoringState = {
    active: false,
    start_time: new Date(),
    active_contexts: [],
    active_patterns: [],
    analysis_queue: [],
    fps_actual: 0,
    latency_ms: 0,
    accuracy_estimate: 0.6  // Starts at 60%, improves over time
  };

  constructor() {
    // Initialize the context inference engine
    this.contextEngine = new ContextInferenceEngine();

    // Initialize default camera
    this.initializeDefaultCamera();

    console.log('🧠 Autonomous EventMonitor initialized - Zero configuration mode');
  }

  // Initialize default camera (no configuration needed)
  private initializeDefaultCamera(): void {
    const camera: Camera = {
      id: this.activeCameraId,
      stream_url: 'webcam://0',  // Default webcam
      context: {
        camera_id: this.activeCameraId,
        primary_view: 'unknown',  // Will be learned
        typical_activity: [],
        coverage_area: 'full_frame',
        peak_times: [],
        quiet_times: [],
        typical_occupancy: 0,
        common_patterns: [],
        rare_patterns: [],
        clarity_score: 1.0,
        coverage_score: 1.0,
        importance_score: 1.0
      },
      fps: this.detectionFPS,
      resolution: '640x480',
      last_frame: new Date(),
      active: false,
      health: 'good'
    };

    this.cameras.set(this.activeCameraId, camera);
    this.cameraContexts.set(this.activeCameraId, camera.context);
  }

  // Add a new camera (for multi-camera support)
  public addCamera(id: string, streamUrl: string): void {
    const camera: Camera = {
      id: id,
      stream_url: streamUrl,
      context: {
        camera_id: id,
        primary_view: 'unknown',
        typical_activity: [],
        coverage_area: 'unknown',
        peak_times: [],
        quiet_times: [],
        typical_occupancy: 0,
        common_patterns: [],
        rare_patterns: [],
        clarity_score: 1.0,
        coverage_score: 1.0,
        importance_score: 0.5
      },
      fps: this.detectionFPS,
      resolution: '640x480',
      last_frame: new Date(),
      active: false,
      health: 'good'
    };

    this.cameras.set(id, camera);
    this.cameraContexts.set(id, camera.context);

    console.log(`📹 Added camera ${id} - Will learn its purpose automatically`);
  }

  // Set video and canvas references
  public setVideoElements(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    this.videoRef = video;
    this.canvasRef = canvas;
    console.log('EventMonitor: Video elements set');
  }

  // Start autonomous monitoring (no configuration needed)
  public async startMonitoring(): Promise<void> {
    console.log('🔥 startMonitoring called!');

    if (!this.videoRef || !this.canvasRef) {
      console.error('❌ Video elements not set!', {
        videoRef: !!this.videoRef,
        canvasRef: !!this.canvasRef
      });
      throw new Error('Video elements not set. Call setVideoElements first.');
    }

    console.log('🚀 Starting autonomous monitoring - Learning mode active');
    console.log(`📊 Initial accuracy: ${this.monitoringState.accuracy_estimate * 100}%`);
    console.log('🧠 System will improve automatically over time');

    // Update monitoring state
    this.monitoringState.active = true;
    this.monitoringState.start_time = new Date();

    // Update camera status
    const camera = this.cameras.get(this.activeCameraId);
    if (camera) {
      camera.active = true;
      camera.last_frame = new Date();
    }

    // Start YOLO detection loop
    const intervalMs = 1000 / this.detectionFPS;
    console.log(`⏱️ Starting detection loop with ${intervalMs}ms interval (${this.detectionFPS} FPS)`);

    // Run first detection immediately
    console.log('🎯 Running first detection immediately...');
    await this.runAutonomousDetection();

    // Then start the interval
    this.yoloInterval = setInterval(async () => {
      console.log('🔄 Interval tick - running detection');
      await this.runAutonomousDetection();
    }, intervalMs);

    // Start processing queue
    this.processEventQueue();

    // Start learning cycle
    this.startLearningCycle();
  }

  // Stop monitoring
  public stopMonitoring(): void {
    if (this.yoloInterval) {
      clearInterval(this.yoloInterval as unknown as number);
      this.yoloInterval = null;
    }

    // Update monitoring state
    this.monitoringState.active = false;

    // Update camera status
    const camera = this.cameras.get(this.activeCameraId);
    if (camera) {
      camera.active = false;
    }

    // Show learning progress
    const intelligence = this.contextEngine.getSystemIntelligence();
    console.log('⏹️ Monitoring stopped');
    console.log(`📊 Learned ${intelligence.patterns_learned} patterns`);
    console.log(`🎯 Accuracy reached: ${intelligence.confidence_level * 100}%`);
  }

  // Run autonomous detection cycle (no zones, full frame)
  private async runAutonomousDetection(): Promise<void> {
    console.log('🎯 runAutonomousDetection called');
    try {
      const startTime = Date.now();

      // Capture current frame
      console.log('📸 About to capture frame...');
      const frame = await this.captureFrame();
      if (!frame) {
        console.error('❌ No frame captured!');
        return;
      }
      console.log('✅ Frame captured successfully');

      // Add to buffer (for temporal analysis)
      this.updateFrameBuffer(frame);

      // Run YOLO detection on FULL FRAME
      const detection = await this.runYoloDetection(frame);

      // Debug: Log every detection
      console.log('🔍 YOLO Detection:', {
        person_count: detection.person_count,
        objects: Object.keys(detection.object_counts).length,
        motion: detection.motion_intensity
      });

      // Infer context from detection (no zones needed)
      const context = this.contextEngine.inferContext(detection);

      // Update active contexts
      this.monitoringState.active_contexts = [context];
      this.monitoringState.active_patterns = [context.matches_pattern || 'observing'];

      // Check if this context triggers an event
      const event = this.contextEngine.generateEvent(context, this.activeCameraId);

      console.log('📊 Context:', {
        activity: context.primary_activity,
        confidence: context.confidence,
        eventGenerated: !!event
      });

      if (event) {
        console.log('✅ Event generated:', event.detected_context);
        // Queue event for LLaVA analysis
        this.queueAutonomousEvent(event, frame);

        // Learn from this event (pattern learning happens automatically)
        // The context engine learns from patterns internally
      }

      // Update camera context understanding
      this.updateCameraContext(context);

      // Update performance metrics
      this.monitoringState.latency_ms = Date.now() - startTime;
      this.monitoringState.fps_actual = 1000 / this.monitoringState.latency_ms;

    } catch (error) {
      console.error('❌ Autonomous detection error:', error);
    }
  }

  // Capture frame from video
  private async captureFrame(): Promise<string | null> {
    if (!this.videoRef || !this.canvasRef) {
      console.error('❌ Video elements not available');
      return null;
    }

    const video = this.videoRef;
    const canvas = this.canvasRef;
    const context = canvas.getContext('2d');

    console.log('📷 Capture frame - Video state:', {
      paused: video.paused,
      ended: video.ended,
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    });

    if (!context) {
      console.error('❌ Canvas context not available');
      return null;
    }

    if (video.paused || video.ended) {
      console.error('❌ Video is paused or ended');
      return null;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('❌ Video dimensions not ready');
      return null;
    }

    // Set canvas size to match video (but downscaled for processing)
    canvas.width = 640;  // Downscale for faster processing
    canvas.height = 480;

    // Draw and extract frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 with compression
    const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

    console.log('✅ Frame captured, base64 length:', base64.length);

    return base64;
  }

  // Update rolling frame buffer
  private updateFrameBuffer(frame: string): void {
    this.frameBuffer.push(frame);
    if (this.frameBuffer.length > this.maxBufferSize) {
      this.frameBuffer.shift();  // Remove oldest frame
    }
  }

  // Run YOLO detection (calls Rust backend)
  private async runYoloDetection(frame: string): Promise<DetectionData> {
    try {
      console.log('🤖 About to call YOLO detection, frame length:', frame.length);

      const invoke = (window as any).__TAURI__?.core?.invoke;
      if (!invoke) {
        throw new Error('Tauri API not available');
      }

      // Call Rust YOLO detector
      const detection = await invoke('yolo_detect', {
        frameBase64: frame,  // Tauri converts to snake_case automatically
        model: 'yolo11n'  // Using nano model for speed
      });

      console.log('✅ YOLO detection completed:', {
        person_count: (detection as any).person_count,
        objects: Object.keys((detection as any).object_counts || {}).length
      });

      return detection as DetectionData;

    } catch (error) {
      console.error('EventMonitor: YOLO detection failed:', error);
      // Return empty detection on error
      return {
        person_count: 0,
        object_counts: {},
        crowd_density: 0,
        motion_intensity: 0,
        zone_occupancy: 0
      };
    }
  }

  // Update camera context based on observations
  private updateCameraContext(context: SceneContext): void {
    const cameraContext = this.cameraContexts.get(this.activeCameraId);
    if (!cameraContext) return;

    // Update typical activity
    if (context.primary_activity && !cameraContext.typical_activity.includes(context.primary_activity)) {
      cameraContext.typical_activity.push(context.primary_activity);
    }

    // Update common patterns
    if (context.matches_pattern && !cameraContext.common_patterns.includes(context.matches_pattern)) {
      cameraContext.common_patterns.push(context.matches_pattern);
    }

    // Update occupancy
    const currentOccupancy = context.crowd_density * 10;  // Scale to approx people count
    cameraContext.typical_occupancy =
      (cameraContext.typical_occupancy * 0.95) + (currentOccupancy * 0.05);  // Moving average

    // Determine if this is a peak or quiet time
    const hour = new Date().getHours();
    const timeSlot = `${hour}:00`;

    if (context.crowd_density > 0.5 && !cameraContext.peak_times.includes(timeSlot)) {
      cameraContext.peak_times.push(timeSlot);
    } else if (context.crowd_density < 0.2 && !cameraContext.quiet_times.includes(timeSlot)) {
      cameraContext.quiet_times.push(timeSlot);
    }

    // Auto-detect primary view based on patterns
    if (cameraContext.primary_view === 'unknown') {
      if (cameraContext.common_patterns.includes('queue_formation')) {
        cameraContext.primary_view = 'checkout_area';
      } else if (cameraContext.common_patterns.includes('entrance_activity')) {
        cameraContext.primary_view = 'entrance';
      } else if (cameraContext.common_patterns.includes('browsing')) {
        cameraContext.primary_view = 'shopping_floor';
      }
    }
  }

  // Start learning cycle
  private startLearningCycle(): void {
    console.log('🎓 Starting learning cycle - generating synthetic events');

    // Run learning updates every minute
    setInterval(() => {
      if (!this.monitoringState.active) return;

      // Update system intelligence
      const intelligence = this.contextEngine.getSystemIntelligence();

      // Update accuracy estimate based on learning
      this.monitoringState.accuracy_estimate = intelligence.confidence_level;

      // Log learning progress
      if (intelligence.patterns_learned % 5 === 0) {  // Every 5 patterns
        console.log(`📈 Learning progress: ${intelligence.patterns_learned} patterns learned`);
        console.log(`🎯 Accuracy: ${(intelligence.confidence_level * 100).toFixed(1)}%`);
        console.log(`🏢 Business type: ${intelligence.business_type} (${(intelligence.confidence_level * 100).toFixed(0)}% confident)`);
      }

    }, 60000);  // Every minute
  }

// Queue an autonomous event for processing
  private queueAutonomousEvent(event: AutonomousEvent, frame: string): void {
    // Map urgency to priority
    const priorityMap = {
      'critical': 'CRITICAL' as Priority,
      'high': 'HIGH' as Priority,
      'medium': 'MEDIUM' as Priority,
      'low': 'LOW' as Priority
    };

    const priority = priorityMap[event.ai_analysis.urgency];

    // Create queued event
    const queuedEvent: QueuedAutonomousEvent = {
      event: event,
      frame_base64: frame,
      priority: priority,
      queued_at: new Date(),
      attempts: 0
    };

    // Add to queue
    this.eventQueue.enqueue(queuedEvent, priority);

    // Update queue state
    this.monitoringState.analysis_queue.push({
      priority: this.getPriorityValue(priority),
      context: this.monitoringState.active_contexts[0],
      camera_id: this.activeCameraId
    });

    console.log(`🎯 Event detected: ${event.detected_context} (${event.ai_analysis.urgency} priority)`);
    console.log(`📊 Confidence: ${(event.confidence * 100).toFixed(0)}%`);
  }

  // Convert priority to numeric value
  private getPriorityValue(priority: Priority): number {
    const map = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    return map[priority];
  }

  // Process queued events with LLaVA
  private async processEventQueue(): Promise<void> {
    // Continuous processing loop
    setInterval(async () => {
      if (this.isProcessing || this.eventQueue.isEmpty()) return;

      const queuedEvent = this.eventQueue.dequeue();
      if (!queuedEvent) return;

      this.isProcessing = true;

      // Clear from queue state
      this.monitoringState.analysis_queue.shift();

      console.log(`🔍 Analyzing: ${queuedEvent.event.detected_context}`);

      // During early learning phase (first 10 minutes), skip LLaVA for faster processing
      const skipLLaVA = this.monitoringState.observation_hours < 0.17; // 10 minutes

      try {
        let enhancedEvent: AutonomousEvent;

        if (skipLLaVA) {
          console.log('⚡ Early learning phase - using quick analysis');

          // Use pre-generated analysis without LLaVA
          enhancedEvent = {
            ...queuedEvent.event,
            ai_analysis: {
              ...queuedEvent.event.ai_analysis,
              description: `Detected ${queuedEvent.event.detected_context} with ${queuedEvent.event.ai_analysis.structured_data?.people_count || 0} people. System is learning patterns.`,
              structured_data: {
                ...queuedEvent.event.ai_analysis.structured_data,
                quick_analysis: true
              }
            }
          };
        } else {
          // Get context-aware LLaVA analysis for real events
          const analysis = await this.analyzeWithContextAwareLLaVA(
            queuedEvent.frame_base64,
            queuedEvent.event
          );

          // Enhance event with detailed analysis
          enhancedEvent = {
            ...queuedEvent.event,
            ai_analysis: {
              ...queuedEvent.event.ai_analysis,
              ...analysis,
              description: analysis.description || queuedEvent.event.ai_analysis.description
            }
          };
        }

        // Add to history
        this.eventHistory.push(enhancedEvent);

        // Learn from the analysis
        // Pattern reinforcement happens automatically based on event outcomes

        // Emit event for UI update
        this.emitAnalysisComplete(enhancedEvent);

        console.log(`✅ Analysis complete: ${enhancedEvent.ai_analysis.description}`);

      } catch (error) {
        console.error('❌ Failed to process event:', error);

        // Retry logic
        queuedEvent.attempts++;
        queuedEvent.last_error = String(error);

        if (queuedEvent.attempts < 3) {
          // Re-queue for retry
          this.eventQueue.enqueue(queuedEvent, queuedEvent.priority);
          console.log(`🔄 Retrying analysis (attempt ${queuedEvent.attempts + 1}/3)`);
        }
      }

      this.isProcessing = false;

    }, 1000);  // Check queue every second
  }

  // Analyze frame with context-aware LLaVA
  private async analyzeWithContextAwareLLaVA(frame: string, event: AutonomousEvent): Promise<any> {
    try {
      const invoke = (window as any).__TAURI__?.core?.invoke;
      if (!invoke) {
        throw new Error('Tauri API not available');
      }

      // Build dynamic prompt based on inferred context
      const prompt = this.buildContextAwarePrompt(event);

      // Call LLaVA through Rust backend with longer timeout
      const response = await invoke('analyze_with_llava', {
        frameBase64: frame,  // Tauri converts to snake_case automatically
        prompt: prompt,
        timeout: 30000  // 30 second timeout for better processing
      });

      return response;

    } catch (error) {
      console.error('❌ LLaVA analysis failed:', error);
      throw error;
    }
  }

  // Build context-aware prompt for LLaVA
  private buildContextAwarePrompt(event: AutonomousEvent): string {
    const businessContext = event.business_context;
    const detectedContext = event.detected_context;

    // Base analysis request
    let prompt = `You are analyzing a ${businessContext} business. `;

    // Add context-specific instructions
    if (detectedContext.includes('queue')) {
      prompt += `Focus on: Queue length, wait time estimation, customer flow efficiency. `;
      prompt += `Provide: Exact count of people in queue, estimated wait time per person, and service optimization suggestions.`;
    } else if (detectedContext.includes('crowd')) {
      prompt += `Focus on: Crowd size, density, movement patterns, safety concerns. `;
      prompt += `Provide: People count, crowd density assessment, potential bottlenecks, and safety recommendations.`;
    } else if (detectedContext.includes('inventory')) {
      prompt += `Focus on: Stock levels, empty shelf spaces, product arrangement. `;
      prompt += `Provide: Estimated stock percentage, specific products low/missing, restocking priorities.`;
    } else if (detectedContext.includes('safety')) {
      prompt += `Focus on: Hazards, spills, obstacles, unsafe behaviors. `;
      prompt += `Provide: Specific safety issue, risk level, immediate actions needed, prevention suggestions.`;
    } else if (detectedContext.includes('activity')) {
      prompt += `Focus on: Customer behavior, engagement levels, service interactions. `;
      prompt += `Provide: Activity description, customer count, interaction quality, improvement opportunities.`;
    } else {
      // Generic analysis for unknown contexts
      prompt += `Provide a general operational analysis including: people count, activity levels, notable events, and any concerns.`;
    }

    // Add learning instruction
    prompt += ` Also note any patterns that seem regular for this business type to help the system learn.`;

    // Add JSON format requirement
    prompt += ` Respond in JSON format with keys: description, metrics (object with relevant measurements), recommendations (array of strings), patterns_observed (array of strings).`;

    return prompt;
  }

  // Emit event for UI update
  private emitAnalysisComplete(event: AutonomousEvent): void {
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('autonomousEventComplete', {
      detail: event
    }));
  }

  // Get current statistics
  public getStatistics(): {
    queueSize: number;
    eventsProcessed: number;
    isMonitoring: boolean;
    bufferSize: number;
    learningProgress: any;
  } {
    const intelligence = this.contextEngine.getSystemIntelligence();

    return {
      queueSize: this.eventQueue.size(),
      eventsProcessed: this.eventHistory.length,
      isMonitoring: this.monitoringState.active,
      bufferSize: this.frameBuffer.length,
      learningProgress: {
        patterns_learned: intelligence.patterns_learned,
        accuracy: intelligence.confidence_level,
        business_type: intelligence.business_type,
        observation_hours: intelligence.observation_hours
      }
    };
  }

  // Get recent events
  public getRecentEvents(limit: number = 10): AutonomousEvent[] {
    return this.eventHistory.slice(-limit);
  }

  // Get system intelligence
  public getSystemIntelligence() {
    return this.contextEngine.getSystemIntelligence();
  }

  // Get monitoring state
  public getMonitoringState(): MonitoringState {
    return this.monitoringState;
  }

  // Get camera contexts
  public getCameraContexts(): Map<string, CameraContext> {
    return this.cameraContexts;
  }

  // Clear event history
  public clearHistory(): void {
    this.eventHistory = [];
  }
}