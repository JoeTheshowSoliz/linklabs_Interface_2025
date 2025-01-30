import React, { useState, useEffect, useMemo } from 'react';
import { Search, Battery, Thermometer, Box, MapPin, Clock, AlertTriangle, DoorOpen, ArrowDownUp, PieChart } from 'lucide-react';
import { Map } from './components/Map';
import { BLEAssetsList } from './components/BLEAssetsList';
import { LoginScreen } from './components/LoginScreen';
import { OrgSiteSelector } from './components/OrgSiteSelector';
import { fetchTags, isAuthenticated, Tag, getTagType, getBatteryInfo, TagTypes } from './lib/api';
import { LatLngTuple } from 'leaflet';

const DEFAULT_POSITION: LatLngTuple = [36.1428, -78.8846];

type SortOption = 'lastSeen' | 'lowBattery' | 'status' | 'name';
type AssetViewType = 'all' | 'supertags' | 'sensors';

interface ProcessedMarker {
  name: string;
  type: string;
  battery: {
    status: 'OK' | 'Low';
    level: number | null;
  };
  temperature: number | null;
  lastUpdate: string;
  position: LatLngTuple;
  bleAssets: any[];
  alerts?: string[];
  doorSensorStatus?: string;
  leashedToSuperTag?: string | null;
  macAddress: string;
  registrationToken: string;
  nodeAddress: string;
}

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ProcessedMarker | null>(null);
  const [showMapView, setShowMapView] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [assetViewType, setAssetViewType] = useState<AssetViewType>('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('name');

  useEffect(() => {
    if (authenticated && selectedSiteId) {
      loadTags();
    }
  }, [authenticated, selectedSiteId]);

  const findSuperTagName = (supertagId: string | null) => {
    if (!supertagId) return null;
    const superTag = tags.find(tag => tag.nodeAddress === supertagId);
    return superTag?.name || null;
  };

  const findLeashedTags = (nodeAddress: string) => {
    return tags.filter(tag => tag.sourceSupertagId === nodeAddress);
  };

  const loadTags = async () => {
    if (!selectedSiteId) return;
    
    try {
      setLoading(true);
      const data = await fetchTags(selectedSiteId);
      setTags(data);
      setError(null);
    } catch (err) {
      setError('Failed to load assets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processedMarkers = useMemo(() => {
    return tags.map(tag => ({
      position: tag.latitude != null && tag.longitude != null
        ? [Number(tag.latitude), Number(tag.longitude)] as LatLngTuple
        : DEFAULT_POSITION,
      name: tag.name || 'Unnamed Asset',
      type: getTagType(tag.registrationToken),
      temperature: tag.fahrenheit,
      battery: getBatteryInfo(tag),
      lastUpdate: tag.lastEventTime || new Date().toISOString(),
      bleAssets: findLeashedTags(tag.nodeAddress),
      macAddress: tag.macAddress,
      alerts: tag.alerts,
      doorSensorStatus: tag.doorSensorAlarmStatus,
      leashedToSuperTag: findSuperTagName(tag.sourceSupertagId),
      nodeAddress: tag.nodeAddress,
      registrationToken: tag.registrationToken,
    }));
  }, [tags]);

  const filteredAndSortedMarkers = useMemo(() => {
    let result = [...processedMarkers];

    if (assetViewType !== 'all') {
      result = result.filter(marker => {
        if (assetViewType === 'supertags') {
          return marker.registrationToken === TagTypes.SUPERTAG;
        } else {
          return marker.registrationToken !== TagTypes.SUPERTAG;
        }
      });
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(marker => {
        return (
          (marker.name || '').toLowerCase().includes(searchLower) ||
          (marker.type || '').toLowerCase().includes(searchLower) ||
          (marker.macAddress || '').toLowerCase().includes(searchLower) ||
          (marker.doorSensorStatus || '').toLowerCase().includes(searchLower) ||
          (marker.leashedToSuperTag || '').toLowerCase().includes(searchLower) ||
          marker.bleAssets.some(asset => (asset.name || '').toLowerCase().includes(searchLower))
        );
      });
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'lastSeen': {
          const aTime = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
          const bTime = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
          return bTime - aTime;
        }
        case 'lowBattery': {
          const aBattery = a.battery.level ?? 100;
          const bBattery = b.battery.level ?? 100;
          return aBattery - bBattery;
        }
        case 'status': {
          const aTime = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
          const bTime = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
          const aActive = aTime > Date.now() - 24 * 60 * 60 * 1000;
          const bActive = bTime > Date.now() - 24 * 60 * 60 * 1000;
          if (aActive === bActive) {
            return bTime - aTime;
          }
          return bActive ? 1 : -1;
        }
        case 'name':
        default: {
          const aName = (a.name || '').toLowerCase();
          const bName = (b.name || '').toLowerCase();
          return aName.localeCompare(bName);
        }
      }
    });

    return result;
  }, [processedMarkers, assetViewType, searchTerm, sortOption]);

  const assetStats = useMemo(() => {
    const lowBatteryCount = filteredAndSortedMarkers.filter(asset => 
      asset.battery.level !== null && asset.battery.level < 30 || asset.battery.status === 'Low'
    ).length;
    
    const sensorCounts = filteredAndSortedMarkers.reduce((acc, asset) => {
      if (asset.registrationToken === TagTypes.SUPERTAG) {
        acc.supertags++;
      } else if (asset.registrationToken === TagTypes.DOOR_SENSOR) {
        acc.doorSensors++;
      } else if (asset.registrationToken === TagTypes.TEMPERATURE) {
        acc.temperatureSensors++;
      } else {
        acc.otherSensors++;
      }
      return acc;
    }, {
      supertags: 0,
      doorSensors: 0,
      temperatureSensors: 0,
      otherSensors: 0
    });

    const inactiveAssets = filteredAndSortedMarkers.filter(asset => {
      const lastEventTime = new Date(asset.lastUpdate).getTime();
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      return lastEventTime < twentyFourHoursAgo;
    }).length;

    return {
      lowBatteryCount,
      sensorCounts,
      inactiveAssets
    };
  }, [filteredAndSortedMarkers]);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const handleAssetClick = (asset: ProcessedMarker) => {
    setSelectedAsset(prev => prev?.macAddress === asset.macAddress ? null : asset);
  };

  const markersToDisplay = selectedAsset ? [selectedAsset] : filteredAndSortedMarkers;

  const mapConfig = useMemo(() => {
    if (selectedAsset) {
      return {
        center: selectedAsset.position,
        zoom: 15
      };
    }
    return {
      center: filteredAndSortedMarkers[0]?.position || DEFAULT_POSITION,
      zoom: 13
    };
  }, [selectedAsset, filteredAndSortedMarkers]);

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-[60]">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center space-x-12">
            <h1 className="text-2xl font-bold text-[#004780]">Link Labs</h1>
            <OrgSiteSelector onSiteSelect={setSelectedSiteId} />
          </div>
          <div className="flex items-center space-x-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="search"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-[#87B812]"
              />
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowMapView(false)}
                className={`px-6 py-2 ${!showMapView ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setShowMapView(true)}
                className={`px-6 py-2 ${showMapView ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'}`}
              >
                Map View
              </button>
            </div>
          </div>
        </div>
      </header>

      {loading && !selectedSiteId && (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-xl text-gray-600">Select an organization and site to view assets</div>
        </div>
      )}

      {loading && selectedSiteId && (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-xl text-gray-600">Loading assets...</div>
        </div>
      )}

      {error && (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-xl text-red-600">{error}</div>
        </div>
      )}

      {!loading && !error && selectedSiteId && (
        <div className="flex h-[calc(100vh-64px)]">
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto sticky top-[64px] h-[calc(100vh-64px)]">
            <div className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-700">Asset Trackers</h2>
                  {selectedAsset && (
                    <button
                      onClick={() => setSelectedAsset(null)}
                      className="text-sm text-gray-600 hover:text-[#87B812] transition-colors"
                    >
                      Clear Selection
                    </button>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#87B812] p-1 rounded-lg hover:bg-gray-50"
                    >
                      <ArrowDownUp className="w-4 h-4" />
                      <span>Sort</span>
                    </button>
                    
                    {showSortDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <button
                          onClick={() => {
                            setSortOption('lastSeen');
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                            sortOption === 'lastSeen' ? 'text-[#87B812]' : 'text-gray-700'
                          }`}
                        >
                          Last Seen
                          {sortOption === 'lastSeen' && <Clock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSortOption('lowBattery');
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                            sortOption === 'lowBattery' ? 'text-[#87B812]' : 'text-gray-700'
                          }`}
                        >
                          Low Battery
                          {sortOption === 'lowBattery' && <Battery className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSortOption('status');
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                            sortOption === 'status' ? 'text-[#87B812]' : 'text-gray-700'
                          }`}
                        >
                          Status
                          {sortOption === 'status' && <AlertTriangle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSortOption('name');
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                            sortOption === 'name' ? 'text-[#87B812]' : 'text-gray-700'
                          }`}
                        >
                          Name (A-Z)
                          {sortOption === 'name' && <ArrowDownUp className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setAssetViewType('all')}
                    className={`flex-1 px-3 py-1.5 text-sm ${
                      assetViewType === 'all' ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setAssetViewType('supertags')}
                    className={`flex-1 px-3 py-1.5 text-sm ${
                      assetViewType === 'supertags' ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    Supertags
                  </button>
                  <button
                    onClick={() => setAssetViewType('sensors')}
                    className={`flex-1 px-3 py-1.5 text-sm ${
                      assetViewType === 'sensors' ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    Sensors
                  </button>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {filteredAndSortedMarkers.map((asset, index) => (
                  <div
                    key={index}
                    className={`bg-white border rounded-lg cursor-pointer transition-all duration-200 hover:border-[#87B812] group
                      ${asset.alerts?.length ? 'border-l-4 border-l-red-500 border-t border-r border-b border-gray-200' : 'border-gray-200'}
                      ${selectedAsset?.macAddress === asset.macAddress ? 'ring-2 ring-[#87B812] ring-opacity-50' : ''}
                    `}
                    onClick={() => handleAssetClick(asset)}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 group-hover:text-[#004780] transition-colors">
                            {asset.name}
                          </h3>
                          {asset.alerts && asset.alerts.length > 0 && (
                            <div className="relative group/tooltip">
                              <AlertTriangle 
                                className="w-4 h-4 text-red-500"
                              />
                              <div className="absolute left-1/2 -translate-x-1/2 -top-2 transform -translate-y-full 
                                            opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200
                                            whitespace-nowrap px-2 py-1 rounded bg-gray-800 text-white text-xs">
                                Alert
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {asset.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <Battery 
                            className={`w-4 h-4 ${
                              asset.battery.status === 'Low' ? 'text-orange-500' : 
                              asset.battery.level !== null ? 
                                (asset.battery.level <= 20 ? 'text-orange-500' : 
                                 asset.battery.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]') 
                              : 'text-[#87B812]'
                            }`} 
                          />
                          <span className={`text-sm ${
                            asset.battery.status === 'Low' ? 'text-orange-600' : 'text-gray-600'
                          }`}>
                            {asset.battery.status === 'Low' ? 'Low' : 
                             asset.battery.level !== null ? `${asset.battery.level}%` : 
                             asset.battery.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Thermometer className={`w-4 h-4 ${
                            asset.temperature && asset.temperature >= 80 ? 'text-red-500' :
                            asset.temperature && asset.temperature >= 70 ? 'text-orange-500' : 'text-[#004780]'
                          }`} />
                          <span className="text-sm text-gray-600">{asset.temperature}°F</span>
                        </div>
                      </div>

                      {asset.registrationToken === TagTypes.DOOR_SENSOR && (
                        <div className="mt-2 flex items-center gap-2">
                          <DoorOpen className={`w-4 h-4 ${
                            asset.doorSensorStatus === 'OPEN' ? 'text-red-500' : 'text-green-500'
                          }`} />
                          <span className="text-sm">{asset.doorSensorStatus || 'Unknown'}</span>
                        </div>
                      )}

                      {asset.registrationToken === TagTypes.SUPERTAG && asset.bleAssets.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          Leashed BLE Assets: {asset.bleAssets.length}
                        </div>
                      )}

                      {asset.registrationToken !== TagTypes.SUPERTAG && asset.leashedToSuperTag && (
                        <div className="mt-2 text-sm text-gray-600">
                          Connected to: {asset.leashedToSuperTag}
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{asset.lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {showMapView ? (
              <div className="h-full">
                <Map 
                  center={mapConfig.center}
                  zoom={mapConfig.zoom}
                  markers={markersToDisplay}
                />
              </div>
            ) : (
              <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4 h-[400px]">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold">Asset Location Map</h2>
                    {selectedAsset && (
                      <button
                        onClick={() => setSelectedAsset(null)}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Battery className="w-6 h-6 text-orange-500" />
                        <h3 className="font-semibold text-lg">Low Battery Assets</h3>
                      </div>
                      <div className="text-3xl font-bold text-orange-500">
                        {assetStats.lowBatteryCount}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Assets with battery below 30% or low status
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <PieChart className="w-6 h-6 text-[#87B812]" />
                        <h3 className="font-semibold text-lg">Asset Distribution</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">SuperTags</span>
                          <span className="font-semibold">{assetStats.sensorCounts.supertags}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Door Sensors</span>
                          <span className="font-semibold">{assetStats.sensorCounts.doorSensors}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Temperature Sensors</span>
                          <span className="font-semibold">{assetStats.sensorCounts.temperatureSensors}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Other Sensors</span>
                          <span className="font-semibold">{assetStats.sensorCounts.otherSensors}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Clock className="w-6 h-6 text-red-500" />
                        <h3 className="font-semibold text-lg">Inactive Assets</h3>
                      </div>
                      <div className="text-3xl font-bold text-red-500">
                        {assetStats.inactiveAssets}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        No events in the last 24 hours
                      </p>
                    </div>
                  </div>
                )}

                {selectedAsset && (
                  <div className="bg-white rounded-lg shadow-sm">
                    <BLEAssetsList 
                      assets={filteredAndSortedMarkers} 
                      selectedAsset={selectedAsset}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;