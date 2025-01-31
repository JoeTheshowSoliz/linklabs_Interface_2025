import React from 'react';
import { Wifi, WifiOff, Battery, Clock, Link, Box } from 'lucide-react';

interface BLEAsset {
  name: string;
  connected: boolean;
  connectionDate: string;
  leashedTime: string;
  lastEventTime: string;
  custodyTimeInState: string;
  batteryVoltage: string;
  lowVoltageFlag: boolean;
}

interface Asset {
  name: string;
  bleAssets: BLEAsset[];
  registrationToken: string;
  leashedToSuperTag?: string | null;
  battery: {
    status: 'OK' | 'Low';
    level: number | null;
  };
  lastUpdate: string;
}

interface BLEAssetsListProps {
  assets: Asset[];
  selectedAsset: Asset | null;
}

// Helper function to calculate battery percentage
const calculateBatteryPercentage = (voltage: string): number => {
  const voltageNum = parseFloat(voltage);
  const minVoltage = 2.5;
  const maxVoltage = 4.2;
  const percentage = ((voltageNum - minVoltage) / (maxVoltage - minVoltage)) * 100;
  return Math.round(Math.max(0, Math.min(100, percentage)));
};

// Helper function to check if a date is within the last 24 hours
const isWithin24Hours = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return date >= twentyFourHoursAgo;
};

// Helper function to format battery display
const getBatteryDisplay = (battery: { status: 'OK' | 'Low'; level: number | null }): string => {
  if (battery.status === 'Low') return 'Low';
  return battery.level !== null ? `${battery.level}%` : battery.status;
};

// Helper function to get battery color class
const getBatteryColor = (battery: { status: 'OK' | 'Low'; level: number | null }): string => {
  if (battery.status === 'Low') return 'text-orange-500';
  if (battery.level !== null) {
    return battery.level <= 20 ? 'text-orange-500' : 
           battery.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]';
  }
  return 'text-[#87B812]';
};

export function BLEAssetsList({ assets, selectedAsset }: BLEAssetsListProps) {
  if (!selectedAsset) {
    return null;
  }

  // If the selected asset is a sensor, find its parent SuperTag
  if (selectedAsset.leashedToSuperTag) {
    const parentSuperTag = assets.find(asset => asset.name === selectedAsset.leashedToSuperTag);
    
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Link className="w-6 h-6 text-[#87B812]" />
          <h2 className="text-xl font-semibold">Connected SuperTag</h2>
        </div>

        {parentSuperTag ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{parentSuperTag.name}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className={`w-5 h-5 ${getBatteryColor(parentSuperTag.battery)}`} />
                  <span className="font-medium">Battery Level</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getBatteryDisplay(parentSuperTag.battery)}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-5 h-5 text-[#87B812]" />
                  <span className="font-medium">Connected Assets</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {parentSuperTag.bleAssets.filter(asset => 
                    isWithin24Hours(asset.lastEventTime)
                  ).length}/{parentSuperTag.bleAssets.length} devices
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Last Event</span>
                </div>
                <div className="text-gray-900">
                  {parentSuperTag.lastUpdate}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700">
                This sensor is currently leashed to {parentSuperTag.name}. The SuperTag is actively monitoring and managing its connected assets.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-sm text-yellow-700">
              This sensor is registered as connected to a SuperTag, but the SuperTag information is not available.
            </p>
          </div>
        )}
      </div>
    );
  }

  const bleAssetsToShow = selectedAsset.bleAssets || [];
  const connectedCount = bleAssetsToShow.filter(asset => isWithin24Hours(asset.lastEventTime)).length;

  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Digital Leashed BLE Assets ({connectedCount}/{bleAssetsToShow.length})</h2>
      
      {bleAssetsToShow.length === 0 ? (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-center">No BLE assets leashed to {selectedAsset.name}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bleAssetsToShow.map((asset, index) => {
            const isConnected = isWithin24Hours(asset.lastEventTime);
            const batteryPercentage = calculateBatteryPercentage(asset.batteryVoltage);
            const batteryInfo = {
              status: asset.lowVoltageFlag ? 'Low' as const : 'OK' as const,
              level: batteryPercentage
            };

            return (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isConnected ? (
                      <Wifi className="w-5 h-5 text-green-500" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-semibold text-lg">{asset.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Parent: {selectedAsset?.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${getBatteryColor(batteryInfo)}`} />
                      <span className="text-sm font-medium">Battery</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {getBatteryDisplay(batteryInfo)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Status</div>
                    <div className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Last Event:</span>
                      <span>{asset.lastEventTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Custody Time:</span>
                      <span>{asset.custodyTimeInState}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-600">Connection Date:</span>{' '}
                      {asset.connectionDate}
                    </div>
                    <div>
                      <span className="text-gray-600">Leashed Time:</span>{' '}
                      {asset.leashedTime}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}