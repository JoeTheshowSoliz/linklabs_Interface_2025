import React from 'react';
import { AlertTriangle, Thermometer, Battery, Zap, MapPin, DoorOpen, Bell } from 'lucide-react';

interface Alert {
  type: 'temperature' | 'battery' | 'impact' | 'geofence_enter' | 'geofence_exit' | 'door';
  assetName: string;
  timestamp: string;
  details: {
    geofenceName?: string;
    doorStatus?: 'OPEN' | 'CLOSED';
    value?: number;
  };
}

export function AlertsSection() {
  // Sample alerts data - replace with real data
  const alerts: Alert[] = [
    {
      type: 'temperature',
      assetName: 'Asset Tracker #1',
      timestamp: '2024-03-14 15:30:45',
      details: { value: 85 }
    },
    {
      type: 'battery',
      assetName: 'Asset Tracker #3',
      timestamp: '2024-03-14 15:25:18',
      details: { value: 15 }
    },
    {
      type: 'impact',
      assetName: 'Asset Tracker #2',
      timestamp: '2024-03-14 15:20:33',
      details: { value: 2.5 }
    },
    {
      type: 'geofence_enter',
      assetName: 'Asset Tracker #4',
      timestamp: '2024-03-14 15:15:22',
      details: { geofenceName: 'Warehouse Zone A' }
    },
    {
      type: 'geofence_exit',
      assetName: 'Asset Tracker #5',
      timestamp: '2024-03-14 15:10:15',
      details: { geofenceName: 'Delivery Zone B' }
    },
    {
      type: 'door',
      assetName: 'Asset Tracker #6',
      timestamp: '2024-03-14 15:05:45',
      details: { doorStatus: 'OPEN' }
    }
  ];

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-5 h-5 text-red-500" />;
      case 'battery':
        return <Battery className="w-5 h-5 text-orange-500" />;
      case 'impact':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'geofence_enter':
      case 'geofence_exit':
        return <MapPin className="w-5 h-5 text-blue-500" />;
      case 'door':
        return <DoorOpen className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertTitle = (alert: Alert) => {
    switch (alert.type) {
      case 'temperature':
        return `High Temperature Alert (${alert.details.value}°F)`;
      case 'battery':
        return `Low Battery Alert (${alert.details.value}%)`;
      case 'impact':
        return `Shock Impact Alert (${alert.details.value}g)`;
      case 'geofence_enter':
        return `Geofence Enter: ${alert.details.geofenceName}`;
      case 'geofence_exit':
        return `Geofence Exit: ${alert.details.geofenceName}`;
      case 'door':
        return `Door Sensor Alert: ${alert.details.doorStatus}`;
      default:
        return 'Unknown Alert';
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Alerts & Notifications</h2>
        <Bell className="w-6 h-6 text-gray-500" />
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#87B812] transition-colors"
          >
            <div className="flex items-center gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <div className="font-medium">{getAlertTitle(alert)}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {alert.assetName} - {alert.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}