import { useState, useRef, useEffect } from 'react';
import { AutonomousEventDashboard } from './components/AutonomousEventDashboard';
import { EventMonitor } from './services/EventMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Switch } from './components/ui/switch';
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  Brain,
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  Loader2,
  TrendingUp,
  Sparkles,
  Zap
} from 'lucide-react';

interface OllamaStatus {
  running: boolean;
  model_ready: boolean;
  error?: string;
}

function App() {
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    running: false,
    model_ready: false
  });
  const [cameraActive, setCameraActive] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showEventDashboard, setShowEventDashboard] = useState(true);
  const [eventMonitor] = useState(() => new EventMonitor());
  const [systemIntelligence, setSystemIntelligence] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check Ollama status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const invoke = (window as any).__TAURI__?.core?.invoke;
        if (!invoke) {
          console.error('Tauri API not available');
          return;
        }

        const status = await invoke('check_ollama_status');
        setOllamaStatus(status);
      } catch (error) {
        console.error('Failed to check Ollama status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Initialize camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);

        // Create hidden canvas for frame capture
        let canvas = document.getElementById('capture-canvas') as HTMLCanvasElement;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.id = 'capture-canvas';
          canvas.style.display = 'none';
          document.body.appendChild(canvas);
        }

        // Set video and canvas refs in EventMonitor
        eventMonitor.setVideoElements(videoRef.current, canvas);
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Start/stop monitoring
  const toggleMonitoring = async () => {
    if (isMonitoring) {
      eventMonitor.stopMonitoring();
      setIsMonitoring(false);
    } else {
      if (!cameraActive) {
        await startCamera();  // Wait for camera to be ready
      } else {
        // Camera is already active, but we need to ensure video elements are set
        if (videoRef.current) {
          // Find or create canvas
          let canvas = document.getElementById('capture-canvas') as HTMLCanvasElement;
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'capture-canvas';
            canvas.style.display = 'none';
            document.body.appendChild(canvas);
          }
          eventMonitor.setVideoElements(videoRef.current, canvas);
          console.log('📹 Video elements set for existing camera');
        }
      }

      // Small delay to ensure video element is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Actually start monitoring!
      console.log('🚀 Starting monitoring...');
      try {
        await eventMonitor.startMonitoring();
        setIsMonitoring(true);
        console.log('✅ Monitoring started successfully');
      } catch (error) {
        console.error('❌ Failed to start monitoring:', error);
        setIsMonitoring(false);
      }
    }
  };

  // Update system intelligence periodically
  useEffect(() => {
    if (!isMonitoring) return;

    const updateIntelligence = () => {
      const intelligence = eventMonitor.getSystemIntelligence();
      setSystemIntelligence(intelligence);
    };

    updateIntelligence();
    const interval = setInterval(updateIntelligence, 5000);  // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, eventMonitor]);

  const isReady = ollamaStatus.running && ollamaStatus.model_ready;

  // Setup screen if not ready
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <div className="min-h-screen flex items-center justify-center p-8">
          <Card className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl w-fit">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Autonomous Vision System
              </CardTitle>
              <CardDescription className="text-slate-300 text-lg mt-2">
                Self-Learning Business Intelligence - Zero Configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-400">
                      {ollamaStatus.running ? 'Loading AI Model...' : 'Starting AI Engine...'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      This may take a few moments on first launch
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Autonomous Vision</h1>
                <p className="text-xs text-slate-400">Zero-Config Self-Learning System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={ollamaStatus.running ? "success" : "destructive"} className="gap-1">
                {ollamaStatus.running ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {ollamaStatus.running ? "AI Ready" : "Disconnected"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Cpu className="w-3 h-3" />
                YOLO + LLaVA
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Section */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Camera Feed</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={cameraActive ? "success" : "secondary"}>
                      {cameraActive ? "Active" : "Inactive"}
                    </Badge>
                    {isMonitoring && (
                      <Badge variant="destructive" className="animate-pulse">
                        <span className="mr-1">●</span> MONITORING
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
                      <CameraOff className="w-16 h-16 text-slate-600 mb-4" />
                      <p className="text-slate-400 mb-4">Camera not active</p>
                      <Button
                        onClick={startCamera}
                        disabled={!isReady}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Enable Camera
                      </Button>
                    </div>
                  )}

                  {/* Autonomous Status Indicator */}
                  {isMonitoring && systemIntelligence && (
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                          <span className="text-sm font-medium">Learning: {systemIntelligence.business_type || 'Analyzing...'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-slate-300">Accuracy: {(systemIntelligence.confidence_level * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Autonomous Monitoring
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Zero-configuration learning system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Learning Status */}
                {systemIntelligence && (
                  <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Business Type</span>
                      <Badge variant="outline" className="text-xs">
                        {systemIntelligence.business_type || 'Learning...'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Patterns Learned</span>
                      <span className="text-xs font-bold text-green-400">
                        {systemIntelligence.patterns_learned || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">System Accuracy</span>
                      <span className="text-xs font-bold text-blue-400">
                        {((systemIntelligence.confidence_level || 0.6) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Observation Time</span>
                      <span className="text-xs font-medium">
                        {systemIntelligence.observation_hours || 0} hrs
                      </span>
                    </div>
                  </div>
                )}

                {/* Start/Stop Button */}
                <Button
                  onClick={toggleMonitoring}
                  disabled={!isReady}
                  className={`w-full ${
                    isMonitoring
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  }`}
                  size="lg"
                >
                  {isMonitoring ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Stop Monitoring
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Monitoring
                    </>
                  )}
                </Button>

                {/* Test Event Button */}
                <Button
                  onClick={() => {
                    console.log('Generating test event...');
                    const testEvent = {
                      id: `test-${Date.now()}`,
                      timestamp: new Date(),
                      camera_id: 'camera-1',
                      detected_context: 'test_checkout_queue',
                      business_type: 'retail_store',
                      confidence: 0.85,
                      is_anomaly: false,
                      pattern_match: 'test_pattern',
                      learning_data: {
                        pattern_id: 'test-pattern-1',
                        reinforcement: 1,
                        new_pattern: false
                      },
                      ai_analysis: {
                        description: 'Test event - Queue detected at checkout',
                        urgency: 'medium' as const,
                        structured_data: { people_count: 5 },
                        recommendations: ['This is a test event', 'Events are working!']
                      }
                    };
                    const customEvent = new CustomEvent('autonomousEventComplete', { detail: testEvent });
                    window.dispatchEvent(customEvent);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 mt-2"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Test Event
                </Button>

                {/* Test YOLO Button */}
                <Button
                  onClick={async () => {
                    console.log('Testing YOLO directly...');
                    try {
                      // Create a simple test image (red square on white background)
                      const canvas = document.createElement('canvas');
                      canvas.width = 640;
                      canvas.height = 480;
                      const ctx = canvas.getContext('2d')!;
                      ctx.fillStyle = 'white';
                      ctx.fillRect(0, 0, 640, 480);
                      ctx.fillStyle = 'red';
                      ctx.fillRect(100, 100, 200, 200);

                      const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

                      const invoke = (window as any).__TAURI__?.core?.invoke;
                      if (invoke) {
                        const result = await invoke('yolo_detect', {
                          frameBase64: base64,
                          model: 'yolo11n'
                        });
                        console.log('YOLO Test Result:', result);
                        alert('YOLO Test Success! Check console for results');
                      } else {
                        console.error('Tauri invoke not available');
                      }
                    } catch (error) {
                      console.error('YOLO Test Error:', error);
                      alert(`YOLO Test Failed: ${error}`);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                  size="sm"
                >
                  <Cpu className="w-4 h-4 mr-2" />
                  Test YOLO Model
                </Button>

                {/* Test LLaVA Button */}
                <Button
                  onClick={async () => {
                    console.log('Testing LLaVA directly...');
                    try {
                      // Create a simple test image
                      const canvas = document.createElement('canvas');
                      canvas.width = 640;
                      canvas.height = 480;
                      const ctx = canvas.getContext('2d')!;
                      ctx.fillStyle = 'white';
                      ctx.fillRect(0, 0, 640, 480);
                      ctx.fillStyle = 'blue';
                      ctx.fillRect(200, 150, 240, 180);
                      ctx.fillStyle = 'black';
                      ctx.font = '30px Arial';
                      ctx.fillText('TEST', 280, 250);

                      const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

                      const invoke = (window as any).__TAURI__?.core?.invoke;
                      if (invoke) {
                        const result = await invoke('analyze_with_llava', {
                          frameBase64: base64,
                          prompt: 'What do you see in this image? Describe any shapes or text.',
                          context: { detected_activity: 'test' }
                        });
                        console.log('LLaVA Test Result:', result);
                        alert('LLaVA Test Success! Check console for results');
                      } else {
                        console.error('Tauri invoke not available');
                      }
                    } catch (error) {
                      console.error('LLaVA Test Error:', error);
                      alert(`LLaVA Test Failed: ${error}`);
                    }
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
                  size="sm"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Test LLaVA Model
                </Button>

                {/* Test Frame Capture Button */}
                <Button
                  onClick={() => {
                    console.log('Testing frame capture...');
                    if (!videoRef.current) {
                      alert('No video element');
                      return;
                    }

                    const video = videoRef.current;
                    const canvas = document.createElement('canvas');
                    canvas.width = 640;
                    canvas.height = 480;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                      alert('No canvas context');
                      return;
                    }

                    console.log('Video state:', {
                      paused: video.paused,
                      ended: video.ended,
                      readyState: video.readyState,
                      videoWidth: video.videoWidth,
                      videoHeight: video.videoHeight
                    });

                    if (video.videoWidth === 0 || video.videoHeight === 0) {
                      alert('Video dimensions not ready');
                      return;
                    }

                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

                    console.log('Frame captured, base64 length:', base64.length);
                    alert(`Frame captured! Base64 length: ${base64.length}`);
                  }}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 mt-2"
                  size="sm"
                  disabled={!cameraActive}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Test Frame Capture
                </Button>

                {/* Test Full Pipeline Button */}
                <Button
                  onClick={async () => {
                    console.log('Testing full detection pipeline...');
                    if (!videoRef.current || !cameraActive) {
                      alert('Camera not active!');
                      return;
                    }

                    try {
                      // Step 1: Capture frame
                      const video = videoRef.current;
                      const canvas = document.createElement('canvas');
                      canvas.width = 640;
                      canvas.height = 480;
                      const ctx = canvas.getContext('2d')!;

                      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                      const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                      console.log('✅ Frame captured, length:', base64.length);

                      // Step 2: Call YOLO
                      const invoke = (window as any).__TAURI__?.core?.invoke;
                      if (!invoke) {
                        throw new Error('Tauri invoke not available');
                      }

                      const detection = await invoke('yolo_detect', {
                        frameBase64: base64,
                        model: 'yolo11n'
                      });
                      console.log('✅ YOLO detection:', detection);

                      // Step 3: Create event if detection found something
                      if (detection.person_count > 0 || Object.keys(detection.object_counts || {}).length > 0) {
                        const event = {
                          id: `pipeline-${Date.now()}`,
                          timestamp: new Date(),
                          camera_id: 'camera-1',
                          detected_context: 'activity_detected',
                          business_type: 'retail_store',
                          confidence: detection.average_confidence || 0.75,
                          is_anomaly: false,
                          pattern_match: 'test_pipeline',
                          learning_data: {
                            pattern_id: 'pipeline-test',
                            reinforcement: 1,
                            new_pattern: false
                          },
                          ai_analysis: {
                            description: `Detected ${detection.person_count} people and ${Object.keys(detection.object_counts || {}).length} object types`,
                            urgency: 'medium' as const,
                            structured_data: detection,
                            recommendations: ['Pipeline test successful!']
                          }
                        };

                        const customEvent = new CustomEvent('autonomousEventComplete', { detail: event });
                        window.dispatchEvent(customEvent);
                        console.log('✅ Event dispatched');
                        alert('Pipeline test success! Event created');
                      } else {
                        alert('No detections found in frame');
                      }
                    } catch (error) {
                      console.error('Pipeline test error:', error);
                      alert(`Pipeline test failed: ${error}`);
                    }
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 mt-2"
                  size="sm"
                  disabled={!cameraActive}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Full Pipeline
                </Button>

                {/* Dashboard Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700 mt-2">
                  <label className="text-sm font-medium">Show Event Dashboard</label>
                  <Switch
                    checked={showEventDashboard}
                    onCheckedChange={setShowEventDashboard}
                  />
                </div>

                {cameraActive && (
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full border-slate-700 hover:bg-slate-800"
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Disable Camera
                  </Button>
                )}

                {/* Debug button to test event system */}
                <Button
                  onClick={() => {
                    const testEvent = {
                      id: 'test-' + Date.now(),
                      timestamp: new Date(),
                      detected_context: 'Test Detection',
                      inferred_location: 'Testing',
                      business_context: 'unknown' as const,
                      trigger_pattern: 'test',
                      confidence: 0.99,
                      is_anomaly: false,
                      ai_analysis: {
                        description: 'Test event to verify system is working',
                        structured_data: { test: true },
                        recommendations: ['System is operational'],
                        urgency: 'low' as const
                      },
                      learning_metadata: {
                        pattern_reinforced: false,
                        new_pattern_detected: false,
                        pattern_id: 'test',
                        feedback_value: 0
                      },
                      camera_id: 'camera-1'
                    };

                    window.dispatchEvent(new CustomEvent('autonomousEventComplete', {
                      detail: testEvent
                    }));
                    console.log('🧪 Test event dispatched');
                  }}
                  variant="outline"
                  className="w-full border-orange-700 hover:bg-orange-800"
                >
                  🧪 Test Event System
                </Button>
              </CardContent>
            </Card>

            {/* Autonomous Learning Info */}
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Self-Learning Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Auto-detects business type</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Learns traffic patterns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>Identifies peak hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span>Discovers anomalies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    <span>Improves continuously</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Architecture Info */}
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Processing Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-400">Universal Detection</p>
                      <p className="text-xs text-slate-500">Full frame @ 10-15 FPS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-purple-400">Context Inference</p>
                      <p className="text-xs text-slate-500">Pattern-based understanding</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-400">Smart Analysis</p>
                      <p className="text-xs text-slate-500">Context-aware prompts</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Autonomous Event Dashboard */}
        {showEventDashboard && (
          <div className="mt-6">
            <AutonomousEventDashboard eventMonitor={eventMonitor} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;