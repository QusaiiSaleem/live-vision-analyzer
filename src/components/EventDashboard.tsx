// Event Dashboard Component - Displays real-time analysis events and statistics
// Shows events without storing images, only structured data

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  AnalysisEvent,
  Priority,
  EventType,
  OperationStats,
  RealtimeAlert
} from '../types/analysis';
import { EventMonitor } from '../services/EventMonitor';
import { getSupabaseSync } from '../services/SupabaseSync';

// Priority color mapping
const priorityColors: Record<Priority, string> = {
  CRITICAL: 'bg-red-600',
  HIGH: 'bg-orange-600',
  MEDIUM: 'bg-yellow-600',
  LOW: 'bg-blue-600'
};

// Event type icons
const eventIcons: Record<EventType, React.ReactNode> = {
  queue_forming: <Users className="w-4 h-4" />,
  shelf_gap: <Package className="w-4 h-4" />,
  safety_alert: <AlertTriangle className="w-4 h-4" />,
  high_interest: <Eye className="w-4 h-4" />,
  crowd_gathering: <Users className="w-4 h-4" />,
  inventory_low: <Package className="w-4 h-4" />
};

interface EventDashboardProps {
  eventMonitor: EventMonitor;
}

export function EventDashboard({ eventMonitor }: EventDashboardProps) {
  const [recentEvents, setRecentEvents] = useState<AnalysisEvent[]>([]);
  const [stats, setStats] = useState<OperationStats | null>(null);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AnalysisEvent | null>(null);

  const supabaseSync = getSupabaseSync();

  // Listen for new analysis events
  useEffect(() => {
    const handleAnalysisComplete = (event: CustomEvent<AnalysisEvent>) => {
      setRecentEvents(prev => [event.detail, ...prev].slice(0, 50));

      // Queue for Supabase sync
      supabaseSync.queueEvent(event.detail);

      // Update stats
      updateStats();
    };

    window.addEventListener('analysisComplete' as any, handleAnalysisComplete);

    return () => {
      window.removeEventListener('analysisComplete' as any, handleAnalysisComplete);
    };
  }, []);

  // Listen for acknowledgments
  useEffect(() => {
    const handleAcknowledgment = (event: CustomEvent<{ eventId: string }>) => {
      setRecentEvents(prev =>
        prev.map(e =>
          e.id === event.detail.eventId ? { ...e, acknowledged: true } : e
        )
      );
    };

    window.addEventListener('eventAcknowledged' as any, handleAcknowledgment);

    return () => {
      window.removeEventListener('eventAcknowledged' as any, handleAcknowledgment);
    };
  }, []);

  // Update statistics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateStats();
    }, 30000); // Every 30 seconds

    updateStats(); // Initial load

    return () => clearInterval(interval);
  }, []);

  // Update statistics
  const updateStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await supabaseSync.getStatistics(today);
    if (stats) {
      setStats(stats);
    }
  };

  // Acknowledge event
  const acknowledgeEvent = async (event: AnalysisEvent) => {
    const success = await supabaseSync.acknowledgeEvent(
      event.id,
      'operator', // In production, use actual user ID
      'Acknowledged via dashboard'
    );

    if (success) {
      setRecentEvents(prev =>
        prev.map(e =>
          e.id === event.id
            ? { ...e, acknowledged: true, resolution_time: new Date() }
            : e
        )
      );
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Filter events
  const filteredEvents = showAcknowledged
    ? recentEvents
    : recentEvents.filter(e => !e.acknowledged);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Event Dashboard</h2>
          <p className="text-gray-400">Real-time operation monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showAcknowledged ? 'outline' : 'default'}
            onClick={() => setShowAcknowledged(!showAcknowledged)}
          >
            {showAcknowledged ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showAcknowledged ? 'Hide' : 'Show'} Acknowledged
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Today's Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total_events_today}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Activity className="w-3 h-3" />
                <span>{stats.processing_time_avg.toFixed(0)}ms avg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Queue Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.average_queue_length.toFixed(0)} people
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>{stats.average_wait_time.toFixed(0)} min wait</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.inventory_alerts}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Package className="w-3 h-3" />
                <span>Restocking needed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Safety Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.safety_incidents}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Require attention</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alerts */}
      {filteredEvents.filter(e => e.priority === 'CRITICAL' && !e.acknowledged).length > 0 && (
        <Alert className="border-red-600 bg-red-950/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-600">Critical Events Require Attention</AlertTitle>
          <AlertDescription className="text-gray-300">
            {filteredEvents.filter(e => e.priority === 'CRITICAL' && !e.acknowledged).length} critical
            events need immediate action
          </AlertDescription>
        </Alert>
      )}

      {/* Events List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Events</CardTitle>
          <CardDescription className="text-gray-400">
            Showing {filteredEvents.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No events to display
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    event.acknowledged
                      ? 'border-slate-700 bg-slate-900/30 opacity-60'
                      : 'border-slate-700 bg-slate-900/50 hover:bg-slate-900/70'
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Event Icon */}
                      <div className="mt-1">{eventIcons[event.event_type]}</div>

                      {/* Event Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            className={`${priorityColors[event.priority]} text-white text-xs`}
                          >
                            {event.priority}
                          </Badge>
                          <span className="text-sm text-white font-medium">
                            {event.event_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            Zone: {event.zone}
                          </span>
                        </div>

                        <p className="text-sm text-gray-300 line-clamp-2">
                          {event.analysis.description}
                        </p>

                        {/* Event Metrics */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatTimeAgo(event.timestamp)}</span>

                          {event.analysis.queue_metrics && (
                            <span>
                              {event.analysis.queue_metrics.people_count} people,
                              {' '}{event.analysis.queue_metrics.estimated_wait_minutes} min wait
                            </span>
                          )}

                          {event.analysis.inventory_status && (
                            <span>
                              {event.analysis.inventory_status.shelf_capacity_used}% capacity
                            </span>
                          )}

                          {event.metadata.processing_time_ms && (
                            <span>{event.metadata.processing_time_ms}ms</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {event.acknowledged ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeEvent(event);
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <Card
            className="bg-slate-900 border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="text-white">Event Details</CardTitle>
              <CardDescription className="text-gray-400">
                ID: {selectedEvent.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Event Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="text-white">{selectedEvent.event_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Priority:</span>
                    <Badge className={`${priorityColors[selectedEvent.priority]} text-white`}>
                      {selectedEvent.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Zone:</span>
                    <span className="text-white">{selectedEvent.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="text-white">
                      {new Date(selectedEvent.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis Results */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Analysis</h3>
                <p className="text-sm text-white">{selectedEvent.analysis.description}</p>

                {/* Structured Data */}
                {selectedEvent.analysis.queue_metrics && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded">
                    <h4 className="text-xs font-medium text-gray-400 mb-1">Queue Metrics</h4>
                    <pre className="text-xs text-gray-300">
                      {JSON.stringify(selectedEvent.analysis.queue_metrics, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedEvent.analysis.inventory_status && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded">
                    <h4 className="text-xs font-medium text-gray-400 mb-1">Inventory Status</h4>
                    <pre className="text-xs text-gray-300">
                      {JSON.stringify(selectedEvent.analysis.inventory_status, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
                {!selectedEvent.acknowledged && (
                  <Button
                    onClick={() => {
                      acknowledgeEvent(selectedEvent);
                      setSelectedEvent(null);
                    }}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}