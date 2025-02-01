import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Battery, Tag, X, ChevronRight } from 'lucide-react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { TagTypes } from '../lib/api';
import { formatLocalDateTime, formatRelativeTime } from '../lib/dateUtils';
import type { ProcessedMarker } from '../types/assets';

// Fix Leaflet default icon path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

// Selected marker icon with different color
const SelectedIcon = L.divIcon({
  className: 'custom-marker',
  html: `<svg width="25" height="41" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0C29.86 0 13.5 16.36 13.5 36.5c0 28.875 36.5 63.5 36.5 63.5s36.5-34.625 36.5-63.5C86.5 16.36 70.14 0 50 0z" fill="#004780"/>
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

interface MapProps {
  center: LatLngTuple;
  markers: ProcessedMarker[];
  zoom?: number;
  selectedAsset?: ProcessedMarker | null;
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

// Component to handle map view updates
function MapUpdater({ center, zoom, selectedAsset }: { 
  center: LatLngTuple; 
  zoom: number;
  selectedAsset: ProcessedMarker | null | undefined;
}) {
  const map = useMap();
  const lastUpdate = useRef({ center, zoom, selectedAsset: null as ProcessedMarker | null | undefined });

  useEffect(() => {
    if (!map) return;

    const shouldUpdate = 
      selectedAsset !== lastUpdate.current.selectedAsset ||
      center !== lastUpdate.current.center ||
      zoom !== lastUpdate.current.zoom;

    if (shouldUpdate) {
      if (selectedAsset && isValidPosition(selectedAsset.position)) {
        map.setView(selectedAsset.position, 15, {
          animate: true,
          duration: 1
        });
      } else if (isValidPosition(center)) {
        map.setView(center, zoom, {
          animate: true,
          duration: 1
        });
      }

      lastUpdate.current = { center, zoom, selectedAsset };
    }
  }, [map, center, zoom, selectedAsset]);

  return null;
}

export function Map({ center, markers, zoom = 13, selectedAsset }: MapProps) {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});

  const validMarkers = markers.filter(marker => isValidPosition(marker.position));
  const defaultCenter: LatLngTuple = [0, 0];
  const validCenter = isValidPosition(center) ? center : defaultCenter;

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (selectedAsset && mapRef.current && isValidPosition(selectedAsset.position)) {
      const marker = markerRefs.current[selectedAsset.macAddress];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedAsset]);

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

  return (
    <div className="relative h-full">
      <MapContainer 
        center={validCenter}
        zoom={zoom} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        whenReady={(map) => handleMapReady(map.target)}
      >
        {mapReady && (
          <>
            <MapUpdater center={validCenter} zoom={zoom} selectedAsset={selectedAsset} />
            
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
            >
              {validMarkers.map((marker, index) => (
                <Marker 
                  key={`${marker.macAddress}-${index}`}
                  position={marker.position}
                  icon={selectedAsset?.macAddress === marker.macAddress ? SelectedIcon : CustomIcon}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current[marker.macAddress] = ref;
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[250px]">
                      <h3 className="font-semibold text-lg mb-2">{marker.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Location:</span>{' '}
                          {formatCoordinate(marker.position[0])}°N, {formatCoordinate(marker.position[1])}°W
                        </div>
                        <div className="group/time relative">
                          <span className="text-gray-600">Last Update:</span>{' '}
                          <span>{formatRelativeTime(marker.lastUpdate)}</span>
                          <span className="absolute left-0 -top-6 bg-gray-800 text-white text-xs px-2 py-1 rounded 
                                       opacity-0 group-hover/time:opacity-100 transition-opacity whitespace-nowrap">
                            {formatLocalDateTime(marker.lastUpdate)}
                          </span>
                        </div>
                        {(marker.registrationToken === TagTypes.TEMPERATURE || 
                          marker.registrationToken === TagTypes.SUPERTAG) && (
                          <div>
                            <span className="text-gray-600">Temperature:</span>{' '}
                            {marker.temperature ? `${marker.temperature.toFixed(2)}°F` : ''}
                          </div>
                        )}
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
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </>
        )}
      </MapContainer>
    </div>
  );
}