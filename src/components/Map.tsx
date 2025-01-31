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
            >
              {validMarkers.map((marker, index) => (
                <Marker 
                  key={index} 
                  position={marker.position}
                  icon={CustomIcon}
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