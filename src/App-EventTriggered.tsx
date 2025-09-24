import { useState, useRef, useEffect } from 'react';
import { EventDashboard } from './components/EventDashboard';
import { EventMonitor } from './services/EventMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Switch } from './components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
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
  CheckCircle,
  Eye,
  Shield,
  Package,
  Users
} from 'lucide-react';
import { ZoneType } from './types/analysis';

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
  const [selectedZone, setSelectedZone] = useState<ZoneType>('entrance');
  const [showEventDashboard, setShowEventDashboard] = useState(true);
  const [eventMonitor] = useState(() => new EventMonitor());

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

        // Set video ref in EventMonitor
        eventMonitor.setVideoRef(videoRef);
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
  const toggleMonitoring = () => {
    if (isMonitoring) {
      eventMonitor.stopMonitoring();
      setIsMonitoring(false);
    } else {
      if (!cameraActive) {
        startCamera();
      }
      eventMonitor.startMonitoring();
      setIsMonitoring(true);
    }
  };

  // Update zone configuration
  useEffect(() => {
    eventMonitor.setActiveZone(selectedZone);
  }, [selectedZone, eventMonitor]);

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
                Live Vision Analyzer
              </CardTitle>
              <CardDescription className="text-slate-300 text-lg mt-2">
                Event-Triggered Vision Analysis System
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
                <h1 className="text-xl font-bold">Live Vision Analyzer</h1>
                <p className="text-xs text-slate-400">Event-Triggered Retail Analytics</p>
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

                  {/* Zone Overlay Indicator */}
                  {isMonitoring && (
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        {selectedZone === 'checkout' && <Users className="w-4 h-4 text-blue-400" />}
                        {selectedZone === 'entrance' && <Eye className="w-4 h-4 text-green-400" />}
                        {selectedZone === 'shelf' && <Package className="w-4 h-4 text-orange-400" />}
                        {selectedZone === 'aisle' && <Shield className="w-4 h-4 text-purple-400" />}
                        <span className="text-sm font-medium">Zone: {selectedZone}</span>
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
                <CardTitle className="text-lg">Event Monitoring</CardTitle>
                <CardDescription className="text-slate-400">
                  Two-stage detection system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Zone Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monitoring Zone</label>
                  <Select value={selectedZone} onValueChange={(value) => setSelectedZone(value as ZoneType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkout">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Checkout - Queue Detection
                        </div>
                      </SelectItem>
                      <SelectItem value="entrance">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Entrance - Traffic Analysis
                        </div>
                      </SelectItem>
                      <SelectItem value="shelf">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Shelf - Inventory Monitoring
                        </div>
                      </SelectItem>
                      <SelectItem value="aisle">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Aisle - Safety Detection
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

                {/* Dashboard Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
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
                      <p className="font-medium text-blue-400">YOLO Detection</p>
                      <p className="text-xs text-slate-500">Continuous @ 10-15 FPS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-purple-400">Event Triggering</p>
                      <p className="text-xs text-slate-500">Threshold-based activation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-400">LLaVA Analysis</p>
                      <p className="text-xs text-slate-500">Detailed on triggers only</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Dashboard */}
        {showEventDashboard && (
          <div className="mt-6">
            <EventDashboard eventMonitor={eventMonitor} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;