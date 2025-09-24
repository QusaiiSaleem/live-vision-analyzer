import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Slider } from './components/ui/slider';
import { Badge } from './components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Textarea } from './components/ui/textarea';
import { Switch } from './components/ui/switch';
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  Sparkles,
  Settings,
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Server,
  Brain,
  Trash2,
  FileDown,
  Clock
} from 'lucide-react';

interface OllamaStatus {
  running: boolean;
  model_ready: boolean;
  error?: string;
}

interface AnalyzeResponse {
  description: string;
  error?: string;
}

interface AnalysisRecord {
  id: string;
  timestamp: Date;
  generalDescription: string;
  customDescription?: string;
  customPrompt?: string;
}

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [description, setDescription] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    running: false,
    model_ready: false
  });
  const [frameRate, setFrameRate] = useState(3);
  const [setupProgress, setSetupProgress] = useState('Initializing...');
  const [cameraActive, setCameraActive] = useState(false);
  const [setupSteps, setSetupSteps] = useState({
    appStarted: true,
    ollamaDownloading: false,
    ollamaDownloaded: false,
    ollamaStarting: false,
    ollamaRunning: false,
    modelDownloading: false,
    modelReady: false
  });
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [generalPrompt] = useState('Describe what you see in this image in 2-3 sentences. Focus on the main subjects, activities, and environment.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check Ollama status
  useEffect(() => {
    let downloadStarted = false;
    const checkStatus = async () => {
      try {
        // Use global Tauri API for v2
        console.log('Checking for Tauri API...');
        console.log('window.__TAURI__:', (window as any).__TAURI__);
        const invoke = (window as any).__TAURI__?.core?.invoke;
        if (!invoke) {
          console.error('Tauri API not available');
          console.error('window.__TAURI__:', (window as any).__TAURI__);
          setSetupProgress('Error: Not running in Tauri window');
          return;
        }
        console.log('Invoking check_ollama_status...');
        const status = await invoke('check_ollama_status');
        console.log('Ollama status received:', status);
        setOllamaStatus(status);

        // Update setup steps based on status
        setSetupSteps(prev => {
          const newSteps = { ...prev };

          if (!status.running) {
            if (!downloadStarted) {
              newSteps.ollamaDownloading = true;
              downloadStarted = true;
            }
            setSetupProgress('Starting Ollama server...');
          } else {
            // Ollama is running - mark download as complete since it must exist
            newSteps.ollamaDownloaded = true;
            newSteps.ollamaDownloading = false;
            newSteps.ollamaStarting = false;
            newSteps.ollamaRunning = true;

            if (!status.model_ready) {
              newSteps.modelDownloading = true;
              setSetupProgress('Downloading AI vision model (~4GB, first time only)...');
              // Simulate download progress
              setDownloadProgress(prev => Math.min(prev + 5, 95));
            } else {
              newSteps.modelDownloading = false;
              newSteps.modelReady = true;
              setSetupProgress('Ready!');
              setDownloadProgress(100);
            }
          }

          return newSteps;
        });
      } catch (error: any) {
        console.error('Failed to check Ollama status:', error);
        console.error('Error details:', error);
        console.error('Error stack:', error?.stack);
        setSetupProgress('Error connecting to backend: ' + (error?.message || 'Unknown error'));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
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
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
      setDescription('Failed to access camera. Please check permissions.');
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

  // Capture and analyze frame
  const captureAndAnalyze = async () => {
    console.log('captureAndAnalyze called', {
      video: !!videoRef.current,
      canvas: !!canvasRef.current,
      modelReady: ollamaStatus.model_ready,
      isProcessing
    });

    // Prevent overlapping requests
    if (isProcessing) {
      console.log('Skipping analysis - already processing');
      return;
    }

    if (!videoRef.current || !canvasRef.current || !ollamaStatus.model_ready) {
      console.log('Prerequisites not met:', {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        modelReady: ollamaStatus.model_ready
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to base64
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    console.log('Image captured, base64 length:', imageBase64.length);

    setIsProcessing(true);
    setLastError(null);

    try {
      // Use global Tauri API for v2
      const invoke = (window as any).__TAURI__?.core?.invoke;
      if (!invoke) {
        const error = 'Error: Tauri API not available';
        console.error(error);
        setDescription(error);
        setLastError(error);
        setIsProcessing(false);
        return;
      }

      const recordId = Date.now().toString();
      const timestamp = new Date();
      let generalDescription = '';
      let customDescription = '';

      console.log('Calling analyze_image with general prompt:', generalPrompt);

      // Run general analysis
      const generalResponse = await invoke('analyze_image', {
        request: {
          image_base64: imageBase64,
          prompt: generalPrompt
        }
      }) as AnalyzeResponse;

      console.log('General response:', generalResponse);

      if (generalResponse.error) {
        generalDescription = `Error: ${generalResponse.error}`;
        setLastError(generalResponse.error);
        console.error('Analysis error:', generalResponse.error);
      } else {
        generalDescription = generalResponse.description;
        console.log('Analysis successful:', generalDescription.substring(0, 100) + '...');
      }

      // Update the main description display
      setDescription(generalDescription);

      // Run custom analysis if enabled
      if (useCustomPrompt && customPrompt.trim()) {
        const customResponse = await invoke('analyze_image', {
          request: {
            image_base64: imageBase64,
            prompt: customPrompt
          }
        }) as AnalyzeResponse;

        if (customResponse.error) {
          customDescription = `Error: ${customResponse.error}`;
        } else {
          customDescription = customResponse.description;
        }
      }

      // Add to history
      const newRecord: AnalysisRecord = {
        id: recordId,
        timestamp,
        generalDescription,
        customPrompt: useCustomPrompt ? customPrompt : undefined,
        customDescription: useCustomPrompt ? customDescription : undefined
      };

      setAnalysisHistory(prev => [newRecord, ...prev].slice(0, 100)); // Keep last 100 records
      setAnalysisCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to analyze image:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setDescription(`Failed to analyze image: ${errorMessage}`);
      setLastError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start/stop analysis
  const toggleAnalysis = async () => {
    console.log('toggleAnalysis called', { isAnalyzing, cameraActive, modelReady: ollamaStatus.model_ready });

    // Test the analyze_image API first
    if (!isAnalyzing && ollamaStatus.model_ready) {
      console.log('Testing analyze_image API...');
      try {
        const invoke = (window as any).__TAURI__?.core?.invoke;
        const testResponse = await invoke('analyze_image', {
          request: {
            image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 pixel test image
            prompt: 'Test'
          }
        });
        console.log('Test API response:', testResponse);
      } catch (error) {
        console.error('Test API failed:', error);
      }
    }

    if (isAnalyzing) {
      // Stop analysis
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsAnalyzing(false);
    } else {
      // Start analysis
      if (!cameraActive) {
        console.log('Starting camera...');
        await startCamera();
        // Wait a bit for camera to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setIsAnalyzing(true);
      console.log('Calling captureAndAnalyze immediately');
      captureAndAnalyze(); // Analyze immediately

      // Set up interval for continuous analysis
      console.log('Setting up interval for', frameRate, 'seconds');
      intervalRef.current = setInterval(captureAndAnalyze, frameRate * 1000);
    }
  };

  useEffect(() => {
    // Update interval when frame rate changes
    if (isAnalyzing && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(captureAndAnalyze, frameRate * 1000);
    }
  }, [frameRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopCamera();
    };
  }, []);

  // Export to CSV
  const exportToCSV = () => {
    if (analysisHistory.length === 0) return;

    const headers = ['Timestamp', 'General Analysis', 'Custom Prompt', 'Custom Analysis'];
    const rows = analysisHistory.map(record => [
      record.timestamp.toLocaleString(),
      record.generalDescription,
      record.customPrompt || '',
      record.customDescription || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-history-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Clear history
  const clearHistory = () => {
    setAnalysisHistory([]);
    setAnalysisCount(0);
  };

  const isReady = ollamaStatus.running && ollamaStatus.model_ready;
  console.log('isReady check:', {
    running: ollamaStatus.running,
    model_ready: ollamaStatus.model_ready,
    isReady
  });

  // Show setup screen if not ready
  if (!isReady) {
    const totalSteps = 4;
    const completedSteps = [
      setupSteps.appStarted,
      setupSteps.ollamaDownloaded,
      setupSteps.ollamaRunning,
      setupSteps.modelReady
    ].filter(Boolean).length;
    const overallProgress = (completedSteps / totalSteps) * 100;

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
                Initializing your AI-powered vision system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">System Initialization</span>
                  <span className="text-sm text-slate-400">{Math.round(overallProgress)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Setup Steps */}
              <div className="space-y-4">
                {/* Step 1: App Started */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {setupSteps.appStarted ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-xs">1</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${setupSteps.appStarted ? 'text-white' : 'text-slate-400'}`}>
                      Application Initialized
                    </h3>
                    <p className="text-sm text-slate-500">Core systems ready</p>
                  </div>
                </div>

                {/* Step 2: Ollama Download */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {setupSteps.ollamaDownloaded ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : setupSteps.ollamaDownloading ? (
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-xs">2</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${setupSteps.ollamaDownloaded || setupSteps.ollamaDownloading ? 'text-white' : 'text-slate-400'}`}>
                      AI Engine Setup
                    </h3>
                    <p className="text-sm text-slate-500">
                      {setupSteps.ollamaDownloading ? 'Downloading Ollama server...' : 'Local AI processing engine'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Server Running */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {setupSteps.ollamaRunning ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : setupSteps.ollamaStarting ? (
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-xs">3</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${setupSteps.ollamaRunning || setupSteps.ollamaStarting ? 'text-white' : 'text-slate-400'}`}>
                      Server Activation
                    </h3>
                    <p className="text-sm text-slate-500">
                      {setupSteps.ollamaStarting ? 'Starting local server...' : 'Processing server'}
                    </p>
                  </div>
                </div>

                {/* Step 4: Model Ready */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {setupSteps.modelReady ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : setupSteps.modelDownloading ? (
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-xs">4</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${setupSteps.modelReady || setupSteps.modelDownloading ? 'text-white' : 'text-slate-400'}`}>
                      Vision Model
                    </h3>
                    <p className="text-sm text-slate-500">
                      {setupSteps.modelDownloading ? 'Downloading LLaVA model (4GB)...' : 'AI vision capabilities'}
                    </p>
                    {setupSteps.modelDownloading && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">This may take several minutes...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                  <div>
                    <p className="font-medium text-blue-400">{setupProgress}</p>
                    {setupProgress === 'Error connecting to backend' && (
                      <p className="text-xs text-slate-500 mt-1">Please ensure Tauri is running correctly</p>
                    )}
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
                <p className="text-xs text-slate-400">AI-Powered Real-time Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={ollamaStatus.running ? "success" : "destructive"} className="gap-1">
                {ollamaStatus.running ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {ollamaStatus.running ? "Connected" : "Disconnected"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Cpu className="w-3 h-3" />
                Local Processing
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Camera Feed</CardTitle>
                  <Badge variant={cameraActive ? "success" : "secondary"}>
                    {cameraActive ? "Active" : "Inactive"}
                  </Badge>
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
                  {isAnalyzing && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="destructive" className="animate-pulse">
                        <span className="mr-1">●</span> LIVE
                      </Badge>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls Section */}
          <div className="space-y-4">
            {/* Control Panel */}
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => toggleAnalysis()}
                  disabled={!isReady}
                  className={`w-full ${
                    isAnalyzing
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  }`}
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Stop Analysis
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Analysis Interval</label>
                    <Badge variant="secondary">{frameRate}s</Badge>
                  </div>
                  <Slider
                    value={[frameRate]}
                    onValueChange={(value) => setFrameRate(value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">
                    Analyze camera feed every {frameRate} second{frameRate > 1 ? 's' : ''}
                  </p>
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

                {/* Custom Prompt Section */}
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Custom Analysis</label>
                    <Switch
                      checked={useCustomPrompt}
                      onCheckedChange={setUseCustomPrompt}
                    />
                  </div>
                  {useCustomPrompt && (
                    <Textarea
                      placeholder="Enter custom prompt for AI analysis...&#10;Examples:&#10;• Count the number of people&#10;• Identify any safety concerns&#10;• Describe the mood of the scene&#10;• List all visible objects"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI Analysis
                  </CardTitle>
                  {analysisCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {analysisCount} analyzed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="min-h-[120px] p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                  {isProcessing ? (
                    <div className="flex items-center gap-3 text-blue-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing image...</span>
                    </div>
                  ) : lastError ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Analysis Error</span>
                      </div>
                      <p className="text-slate-400 text-sm">{lastError}</p>
                    </div>
                  ) : description ? (
                    <p className="text-slate-200 leading-relaxed">{description}</p>
                  ) : (
                    <p className="text-slate-500 italic">
                      {isReady
                        ? 'Start analysis to see AI descriptions here...'
                        : 'Waiting for AI model to load...'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">Ollama Server</span>
                    </div>
                    <Badge variant={ollamaStatus.running ? "success" : "destructive"}>
                      {ollamaStatus.running ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">AI Model</span>
                    </div>
                    <Badge variant={ollamaStatus.model_ready ? "success" : "warning"}>
                      {ollamaStatus.model_ready ? 'Ready' : 'Loading...'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">Camera</span>
                    </div>
                    <Badge variant={cameraActive ? "success" : "secondary"}>
                      {cameraActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analysis History Table */}
        <div className="mt-6">
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Analysis History
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 hover:bg-slate-800"
                    disabled={analysisHistory.length === 0}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={clearHistory}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 hover:bg-slate-800"
                    disabled={analysisHistory.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {analysisHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Timestamp</TableHead>
                        <TableHead>General Analysis</TableHead>
                        {analysisHistory.some(r => r.customPrompt) && (
                          <>
                            <TableHead className="w-[250px]">Custom Prompt</TableHead>
                            <TableHead>Custom Analysis</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-xs text-slate-400">
                            {record.timestamp.toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.generalDescription}
                          </TableCell>
                          {analysisHistory.some(r => r.customPrompt) && (
                            <>
                              <TableCell className="text-xs text-slate-500">
                                {record.customPrompt || '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {record.customDescription || '-'}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No analysis records yet</p>
                    <p className="text-slate-500 text-sm">
                      Enable camera and click "Start Analysis" to begin capturing and analyzing frames
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;