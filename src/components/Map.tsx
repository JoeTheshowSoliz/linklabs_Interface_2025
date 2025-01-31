import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useState, useEffect, useCallback } from 'react';
import { Battery, Wifi, WifiOff, Tag, X, ChevronRight } from 'lucide-react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { TagTypes } from '../lib/api';

// Create custom colored marker icon
const CustomIcon = L.divIcon({
  className: 'custom-marker',
  html: `<svg width="25" height="41" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0C29.86 0 13.5 16.36 13.5 36.5c0 28.875 36.5 63.5 36.5 63.5s36.5-34.625 36.5-63.5C86.5 16.36 70.14 0 50 0z" fill="#87B812"/>
    <circle cx="50" cy="36.5" r="16.5" fill="white"/>
  </svg>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Create custom cluster icon
const createClusterCustomIcon = function (cluster: any) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
  const sizeMap = {
    small: { width: 30, height: 30, fontSize: 12 },
    medium: { width: 35, height: 35, fontSize: 13 },
    large: { width: 40, height: 40, fontSize: 14 }
  };

  return L.divIcon({
    html: `<div class="cluster-icon" style="
      width: ${sizeMap[size].width}px;
      height: ${sizeMap[size].height}px;
      background-color: #87B812;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${sizeMap[size].fontSize}px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">${count}</div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(sizeMap[size].width, sizeMap[size].height),
    iconAnchor: [sizeMap[size].width / 2, sizeMap[size].height / 2]
  });
};

interface MapMarker {
  position: LatLngTuple;
  name: string;
  type: string;
  temperature: number | null;
  battery: {
    status: 'OK' | 'Low';
    level: number | null;
  };
  lastUpdate: string;
  bleAssets: any[];
  registrationToken: string;
  leashedToSuperTag?: string | null;
}

interface MapProps {
  center: LatLngTuple;
  markers: MapMarker[];
  zoom?: number;
}

const formatCoordinate = (coord: number | undefined | null): string => {
  if (typeof coord !== 'number' || isNaN(coord)) {
    return '0.0000';
  }
  return coord.toFixed(4);
};

const isValidPosition = (position: LatLngTuple): boolean => {
  return Array.isArray(position) && 
         position.length === 2 && 
         typeof position[0] === 'number' && 
         typeof position[1] === 'number' && 
         !isNaN(position[0]) && 
         !isNaN(position[1]) &&
         position[0] >= -90 && position[0] <= 90 &&
         position[1] >= -180 && position[1] <= 180;
};

function MapUpdater({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (map && isValidPosition(center)) {
      try {
        map.setView(center, zoom, {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.25
        });
      } catch (error) {
        console.error('Error updating map view:', error);
      }
    }
  }, [map, center, zoom]);

  return null;
}

export function Map({ center, markers, zoom = 13 }: MapProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [clusterMarkers, setClusterMarkers] = useState<MapMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const validMarkers = markers.filter(marker => isValidPosition(marker.position));
  const defaultCenter: LatLngTuple = [0, 0];
  const validCenter = isValidPosition(center) ? center : defaultCenter;

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const getBatteryDisplay = (battery: { status: 'OK' | 'Low'; level: number | null }) => {
    if (!battery) return 'Unknown';
    if (battery.status === 'Low') return 'Low';
    return battery.level !== null ? `${battery.level}%` : battery.status;
  };

  const getBatteryColor = (battery: { status: 'OK' | 'Low'; level: number | null }) => {
    if (!battery) return 'text-gray-400';
    if (battery.status === 'Low') return 'text-orange-500';
    if (battery.level !== null) {
      return battery.level <= 20 ? 'text-orange-500' : 
             battery.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]';
    }
    return 'text-[#87B812]';
  };

  const handleClusterClick = (cluster: any) => {
    const markers = cluster.getAllChildMarkers().map((marker: any) => marker.options.marker);
    setClusterMarkers(markers);
    setShowClusterModal(true);
  };

  return (
    <div className="relative h-full">
      <MapContainer 
        center={validCenter}
        zoom={zoom} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        whenReady={handleMapReady}
      >
        {mapReady && (
          <>
            <MapUpdater center={validCenter} zoom={zoom} />
            
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Street">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Terrain">
                <TileLayer
                  attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  maxZoom={17}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <MarkerClusterGroup
              chunkedLoading
              iconCreateFunction={createClusterCustomIcon}
              maxClusterRadius={60}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              eventHandlers={{
                clusterclick: (e) => {
                  handleClusterClick(e.layer);
                }
              }}
            >
              {validMarkers.map((marker, index) => (
                <Marker 
                  key={index} 
                  position={marker.position}
                  icon={CustomIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedMarker(marker);
                      setShowModal(true);
                    }
                  }}
                  marker={marker}
                >
                  <Popup>
                    <div className="p-2 min-w-[250px]">
                      <h3 className="font-semibold text-lg mb-2">{marker.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Location:</span>{' '}
                          {formatCoordinate(marker.position[0])}°N, {formatCoordinate(marker.position[1])}°W
                        </div>
                        <div>
                          <span className="text-gray-600">Last Update:</span> {marker.lastUpdate}
                        </div>
                        <div>
                          <span className="text-gray-600">Temperature:</span>{' '}
                          {marker.temperature ? marker.temperature.toFixed(2) : 'N/A'}°F
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Battery:</span>
                          <Battery className={`w-4 h-4 ${getBatteryColor(marker.battery)}`} />
                          {getBatteryDisplay(marker.battery)}
                        </div>
                        {marker.registrationToken === TagTypes.SUPERTAG ? (
                          <div>
                            <span className="text-gray-600">Leashed Assets:</span> {marker.bleAssets.length}
                          </div>
                        ) : marker.leashedToSuperTag ? (
                          <div>
                            <span className="text-gray-600">Connected to SuperTag:</span>{' '}
                            <span className="text-[#87B812]">{marker.leashedToSuperTag}</span>
                          </div>
                        ) : null}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMarker(marker);
                          setShowModal(true);
                        }}
                        className="mt-3 w-full bg-[#87B812] text-white px-3 py-1.5 rounded-md hover:bg-[#769f10] transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </>
        )}
      </MapContainer>

      {/* Modals */}
      {showClusterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Assets in this Area ({clusterMarkers.length})</h2>
              <button 
                onClick={() => setShowClusterModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {clusterMarkers.map((marker, index) => (
                <div 
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg hover:border-[#87B812] transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedMarker(marker);
                    setShowClusterModal(false);
                    setShowModal(true);
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{marker.name}</h3>
                        <span className="text-sm px-2 py-1 bg-gray-100 rounded-full">
                          {marker.type}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Battery className={`w-4 h-4 ${getBatteryColor(marker.battery)}`} />
                        <span className="text-sm text-gray-600">{getBatteryDisplay(marker.battery)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {marker.temperature ? marker.temperature.toFixed(2) : 'N/A'}°F
                        </span>
                      </div>
                      {marker.registrationToken === TagTypes.SUPERTAG ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {marker.bleAssets.length} BLE Assets
                          </span>
                        </div>
                      ) : marker.leashedToSuperTag ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Connected to: {marker.leashedToSuperTag}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      Last Update: {marker.lastUpdate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && selectedMarker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedMarker.name}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-600">Location:</span>{' '}
                {formatCoordinate(selectedMarker.position[0])}°N, {formatCoordinate(selectedMarker.position[1])}°W
              </div>
              <div>
                <span className="text-gray-600">Last Update:</span> {selectedMarker.lastUpdate}
              </div>
              <div>
                <span className="text-gray-600">Temperature:</span>{' '}
                {selectedMarker.temperature ? selectedMarker.temperature.toFixed(2) : 'N/A'}°F
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Battery:</span>
                <Battery className={`w-4 h-4 ${getBatteryColor(selectedMarker.battery)}`} />
                {getBatteryDisplay(selectedMarker.battery)}
              </div>
            </div>

            {selectedMarker.registrationToken === TagTypes.SUPERTAG && (
              <>
                <h3 className="text-xl font-semibold mb-4">Leashed BLE Assets ({selectedMarker.bleAssets.length})</h3>
                <div className="space-y-4">
                  {selectedMarker.bleAssets.map((asset, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        {asset.connected ? (
                          <Wifi className="w-5 h-5 text-green-500" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-semibold text-lg">{asset.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-500" />
                          <span>{asset.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>{' '}
                          {asset.connected ? 'Connected' : 'Disconnected'}
                        </div>
                        <div>
                          <span className="text-gray-600">Connection Date:</span>{' '}
                          {asset.connectionDate}
                        </div>
                        <div>
                          <span className="text-gray-600">Leashed Time:</span>{' '}
                          {asset.leashedTime}
                        </div>
                        <div>
                          <span className="text-gray-600">Last Update:</span>{' '}
                          {asset.lastUpdate}
                        </div>
                        <div className="flex items-center gap-2">
                          <Battery className={`w-4 h-4 ${getBatteryColor(asset.battery)}`} />
                          {getBatteryDisplay(asset.battery)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedMarker.bleAssets.length === 0 && (
                    <p className="text-gray-500 italic">No BLE assets leashed to this tracker</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}