// Autonomous Event Dashboard - Displays self-learning system events and insights
// Shows what the system has learned without any configuration

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Activity,
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Eye,
  Clock,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import {
  AutonomousEvent,
  SystemIntelligence,
  BusinessType
} from '../types/autonomous';
import { EventMonitor } from '../services/EventMonitor';

// Business type colors
const businessColors: Record<BusinessType, string> = {
  retail_store: 'bg-blue-600',
  restaurant: 'bg-orange-600',
  grocery: 'bg-green-600',
  warehouse: 'bg-gray-600',
  healthcare: 'bg-red-600',
  office: 'bg-purple-600',
  gym: 'bg-pink-600',
  salon: 'bg-indigo-600',
  auto_service: 'bg-yellow-600',
  unknown: 'bg-slate-600'
};

// Urgency colors
const urgencyColors = {
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500'
};

interface AutonomousEventDashboardProps {
  eventMonitor: EventMonitor;
}

export function AutonomousEventDashboard({ eventMonitor }: AutonomousEventDashboardProps) {
  const [recentEvents, setRecentEvents] = useState<AutonomousEvent[]>([]);
  const [systemIntelligence, setSystemIntelligence] = useState<SystemIntelligence | null>(null);
  const [monitoringState, setMonitoringState] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<AutonomousEvent | null>(null);

  // Listen for new autonomous events
  useEffect(() => {
    const handleEventComplete = (event: CustomEvent<AutonomousEvent>) => {
      setRecentEvents(prev => [event.detail, ...prev].slice(0, 50));
    };

    window.addEventListener('autonomousEventComplete' as any, handleEventComplete);

    return () => {
      window.removeEventListener('autonomousEventComplete' as any, handleEventComplete);
    };
  }, []);

  // Update system intelligence periodically
  useEffect(() => {
    const updateIntelligence = () => {
      const intelligence = eventMonitor.getSystemIntelligence();
      setSystemIntelligence(intelligence);

      const state = eventMonitor.getMonitoringState();
      setMonitoringState(state);
    };

    updateIntelligence();
    const interval = setInterval(updateIntelligence, 3000);

    return () => clearInterval(interval);
  }, [eventMonitor]);

  // Format time ago
  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* System Intelligence Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Business Understanding */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Business Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className={`${businessColors[systemIntelligence?.business_type || 'unknown']} text-white`}>
                {systemIntelligence?.business_type || 'Learning...'}
              </Badge>
              <div className="text-xs text-slate-400">
                Confidence: {((systemIntelligence?.confidence_level || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Progress */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-400">
                {systemIntelligence?.patterns_learned || 0}
              </div>
              <div className="text-xs text-slate-400">
                Patterns Learned
              </div>
              <div className="text-xs text-slate-500">
                {systemIntelligence?.observation_hours || 0} hours observed
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Monitoring */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {monitoringState?.active ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">Active</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-400">Inactive</span>
                  </>
                )}
              </div>
              <div className="text-xs text-slate-400">
                FPS: {monitoringState?.fps_actual?.toFixed(1) || 0}
              </div>
              <div className="text-xs text-slate-500">
                Latency: {monitoringState?.latency_ms || 0}ms
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Trend */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Accuracy Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                <span className={`${
                  systemIntelligence?.accuracy_trend === 'improving' ? 'text-green-400' :
                  systemIntelligence?.accuracy_trend === 'stable' ? 'text-blue-400' :
                  'text-orange-400'
                }`}>
                  {systemIntelligence?.accuracy_trend || 'learning'}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {monitoringState?.accuracy_estimate ?
                  `Current: ${(monitoringState.accuracy_estimate * 100).toFixed(0)}%` :
                  'Calibrating...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Insights */}
      {systemIntelligence?.insights && systemIntelligence.insights.length > 0 && (
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              AI-Generated Insights
            </CardTitle>
            <CardDescription className="text-slate-400">
              System recommendations based on learned patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemIntelligence.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'optimization' ? 'bg-blue-600/20' :
                    insight.type === 'warning' ? 'bg-orange-600/20' :
                    'bg-green-600/20'
                  }`}>
                    {insight.type === 'optimization' ? <Target className="w-4 h-4 text-blue-400" /> :
                     insight.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-orange-400" /> :
                     <TrendingUp className="w-4 h-4 text-green-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{insight.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{insight.impact}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Autonomous Events */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Detected Events
              </CardTitle>
              <CardDescription className="text-slate-400">
                Autonomously detected and analyzed events
              </CardDescription>
            </div>
            <Badge variant="outline">
              {recentEvents.length} events
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No events detected yet</p>
                <p className="text-xs mt-1">The system is observing and learning...</p>
              </div>
            ) : (
              recentEvents.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {event.detected_context}
                        </Badge>
                        <Badge className={urgencyColors[event.ai_analysis.urgency]} variant="outline">
                          {event.ai_analysis.urgency}
                        </Badge>
                        {event.is_anomaly && (
                          <Badge className="bg-red-600/20 text-red-400" variant="outline">
                            Anomaly
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mb-1">
                        {event.ai_analysis.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(event.timestamp)}
                        </span>
                        <span>
                          Confidence: {(event.confidence * 100).toFixed(0)}%
                        </span>
                        <span>
                          Camera: {event.camera_id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Event Details
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Context</h3>
                  <p className="text-sm text-slate-400">{selectedEvent.detected_context}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Analysis</h3>
                  <p className="text-sm text-slate-400">{selectedEvent.ai_analysis.description}</p>
                </div>
                {selectedEvent.ai_analysis.recommendations && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Recommendations</h3>
                    <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                      {selectedEvent.ai_analysis.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedEvent.ai_analysis.structured_data && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Metrics</h3>
                    <pre className="text-xs bg-slate-800 p-3 rounded overflow-auto">
                      {JSON.stringify(selectedEvent.ai_analysis.structured_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}