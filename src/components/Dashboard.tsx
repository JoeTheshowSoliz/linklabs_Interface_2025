import React from 'react';
import { Map } from './Map';
import { BLEAssetsList } from './BLEAssetsList';
import { BatteryDistribution } from './BatteryDistribution';
import { DoorSensorStatus } from './DoorSensorStatus';
import type { ProcessedMarker } from '../types/assets';
import { LatLngTuple } from 'leaflet';

interface DashboardProps {
  selectedAsset: ProcessedMarker | null;
  markers: ProcessedMarker[];
  mapConfig: {
    center: LatLngTuple;
    zoom: number;
  };
}

export function Dashboard({ selectedAsset, markers, mapConfig }: DashboardProps) {
  const markersToDisplay = selectedAsset ? [selectedAsset] : markers;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 h-[400px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Asset Location Map</h2>
          {selectedAsset && (
            <button
              onClick={() => onAssetSelect(null)}
              className="text-sm text-gray-600 hover:text-[#87B812] transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
        <div className="h-full rounded-lg border border-gray-200">
          <Map 
            center={mapConfig.center}
            zoom={mapConfig.zoom}
            markers={markersToDisplay}
          />
        </div>
      </div>

      {!selectedAsset && (
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BatteryDistribution assets={markers} />
            <DoorSensorStatus assets={markers} />
          </div>
        </div>
      )}

      {selectedAsset && (
        <div className="bg-white rounded-lg shadow-sm">
          <BLEAssetsList 
            assets={markers} 
            selectedAsset={selectedAsset}
          />
        </div>
      )}
    </div>
  );
}