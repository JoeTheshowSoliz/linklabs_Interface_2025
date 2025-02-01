import React from 'react';
import { Wifi, WifiOff, Battery, Clock, Link, Box } from 'lucide-react';
import { getBatteryInfo } from '../lib/api';
import { formatLocalDateTime, formatRelativeTime } from '../lib/dateUtils';
import type { ProcessedMarker } from '../types/assets';

interface BLEAsset {
  name: string;
  connected: boolean;
  lastEventTime: string;
  batteryVoltage: string;
  lowVoltageFlag: boolean;
  batteryStatus: number | string;
  batteryCapacity_mAh: number | string;
  batteryConsumed_mAh?: number | string | null;
  batteryUsage_uAh?: number | string | null;
}

interface BLEAssetsListProps {
  assets: ProcessedMarker[];
  selectedAsset: ProcessedMarker;
}

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
                  {formatLocalDateTime(parentSuperTag.lastUpdate)}
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

  const bleAssetsToShow = [...(selectedAsset.bleAssets || [])].sort((a, b) => {
    return new Date(b.lastEventTime).getTime() - new Date(a.lastEventTime).getTime();
  });
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
            const batteryInfo = getBatteryInfo(asset);

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

                <div className="grid grid-cols-2 gap-4">
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

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Last Event:</span>
                    <span className="text-sm group-hover/time relative">
                      {formatRelativeTime(asset.lastEventTime)}
                      <span className="absolute left-0 -top-6 bg-gray-800 text-white text-xs px-2 py-1 rounded 
                                  opacity-0 group-hover/time:opacity-100 transition-opacity whitespace-nowrap">
                        {formatLocalDateTime(asset.lastEventTime)}
                      </span>
                    </span>
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