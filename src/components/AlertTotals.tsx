import React, { useState } from 'react';
import { Thermometer, Battery, Zap, MapPin, X } from 'lucide-react';

interface AlertEvent {
  id: string;
  timestamp: string;
}

interface TemperatureEvent extends AlertEvent {
  temperature: number;
  humidity: number;
}

interface BatteryEvent extends AlertEvent {
  batteryLevel: number;
}

interface ShockEvent extends AlertEvent {
  shockLevel: number;
}

interface GeofenceEvent extends AlertEvent {
  geofenceName: string;
  type: 'ENTRY' | 'EXIT';
}

// Sample data - replace with real data
const temperatureAlerts: TemperatureEvent[] = Array.from({ length: 5 }, (_, i) => ({
  id: `temp-${i}`,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  temperature: Math.round(85 + Math.random() * 10),
  humidity: Math.round(60 + Math.random() * 20)
}));

const batteryAlerts: BatteryEvent[] = Array.from({ length: 3 }, (_, i) => ({
  id: `bat-${i}`,
  timestamp: new Date(Date.now() - i * 7200000).toISOString(),
  batteryLevel: Math.round(5 + Math.random() * 10)
}));

const shockAlerts: ShockEvent[] = Array.from({ length: 4 }, (_, i) => ({
  id: `shock-${i}`,
  timestamp: new Date(Date.now() - i * 5400000).toISOString(),
  shockLevel: Math.round(20 + Math.random() * 30) / 10
}));

const geofenceAlerts: GeofenceEvent[] = Array.from({ length: 6 }, (_, i) => ({
  id: `geo-${i}`,
  timestamp: new Date(Date.now() - i * 4800000).toISOString(),
  geofenceName: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
  type: Math.random() > 0.5 ? 'ENTRY' : 'EXIT'
}));

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

export function AlertTotals() {
  const [modalContent, setModalContent] = useState<{
    isOpen: boolean;
    type: 'temperature' | 'battery' | 'shock' | 'geofence';
  }>({
    isOpen: false,
    type: 'temperature'
  });

  const closeModal = () => setModalContent({ ...modalContent, isOpen: false });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Temperature Alerts */}
        <div 
          onClick={() => setModalContent({ type: 'temperature', isOpen: true })}
          className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-[#87B812] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-6 h-6 text-red-500" />
            <h3 className="font-semibold">High Temperature</h3>
          </div>
          <div className="text-2xl font-bold text-red-500">{temperatureAlerts.length}</div>
          <div className="text-sm text-gray-500">Total Alerts</div>
        </div>

        {/* Battery Alerts */}
        <div 
          onClick={() => setModalContent({ type: 'battery', isOpen: true })}
          className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-[#87B812] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-6 h-6 text-orange-500" />
            <h3 className="font-semibold">Low Battery</h3>
          </div>
          <div className="text-2xl font-bold text-orange-500">{batteryAlerts.length}</div>
          <div className="text-sm text-gray-500">Total Alerts</div>
        </div>

        {/* Shock Alerts */}
        <div 
          onClick={() => setModalContent({ type: 'shock', isOpen: true })}
          className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-[#87B812] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h3 className="font-semibold">Shock Impact</h3>
          </div>
          <div className="text-2xl font-bold text-yellow-500">{shockAlerts.length}</div>
          <div className="text-sm text-gray-500">Total Alerts</div>
        </div>

        {/* Geofence Alerts */}
        <div 
          onClick={() => setModalContent({ type: 'geofence', isOpen: true })}
          className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-[#87B812] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-6 h-6 text-blue-500" />
            <h3 className="font-semibold">Geofence</h3>
          </div>
          <div className="text-2xl font-bold text-blue-500">{geofenceAlerts.length}</div>
          <div className="text-sm text-gray-500">Total Alerts</div>
        </div>
      </div>

      {/* Temperature Modal */}
      <AlertModal
        isOpen={modalContent.isOpen && modalContent.type === 'temperature'}
        onClose={closeModal}
        title="High Temperature Alerts"
      >
        <div className="space-y-4">
          {temperatureAlerts.map(alert => (
            <div key={alert.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-red-500 mb-2">High Temperature Alert</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Temperature: {alert.temperature}°F</div>
                <div>Humidity: {alert.humidity}%</div>
                <div className="col-span-2">Time: {formatDate(alert.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </AlertModal>

      {/* Battery Modal */}
      <AlertModal
        isOpen={modalContent.isOpen && modalContent.type === 'battery'}
        onClose={closeModal}
        title="Low Battery Alerts"
      >
        <div className="space-y-4">
          {batteryAlerts.map(alert => (
            <div key={alert.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-orange-500 mb-2">Low Battery Alert</div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>Battery Level: {alert.batteryLevel}%</div>
                <div>Time: {formatDate(alert.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </AlertModal>

      {/* Shock Modal */}
      <AlertModal
        isOpen={modalContent.isOpen && modalContent.type === 'shock'}
        onClose={closeModal}
        title="Shock Impact Alerts"
      >
        <div className="space-y-4">
          {shockAlerts.map(alert => (
            <div key={alert.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-yellow-500 mb-2">Shock Impact Alert</div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>Impact Level: {alert.shockLevel}g</div>
                <div>Time: {formatDate(alert.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </AlertModal>

      {/* Geofence Modal */}
      <AlertModal
        isOpen={modalContent.isOpen && modalContent.type === 'geofence'}
        onClose={closeModal}
        title="Geofence Alerts"
      >
        <div className="space-y-4">
          {geofenceAlerts.map(alert => (
            <div key={alert.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-blue-500 mb-2">Geofence Alert</div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>Type: Geofence {alert.type}</div>
                <div>Zone: {alert.geofenceName}</div>
                <div>Time: {formatDate(alert.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </AlertModal>
    </>
  );
}