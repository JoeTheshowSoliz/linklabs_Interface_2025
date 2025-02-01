import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Map } from './components/Map';
import { AssetList } from './components/AssetList';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { fetchTags, isAuthenticated, Tag, getTagType, getBatteryInfo, TagTypes } from './lib/api';
import { LatLngTuple } from 'leaflet';
import type { ProcessedMarker } from './types/assets';

const DEFAULT_POSITION: LatLngTuple = [36.1428, -78.8846];

type AssetViewType = 'all' | 'supertags' | 'sensors';

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
    return tags.map(tag => {
      const temperature = tag.fahrenheit !== null && tag.fahrenheit !== undefined 
        ? Number(tag.fahrenheit) 
        : null;

      return {
        position: tag.latitude != null && tag.longitude != null
          ? [Number(tag.latitude), Number(tag.longitude)] as LatLngTuple
          : DEFAULT_POSITION,
        name: tag.name || 'Unnamed Asset',
        type: getTagType(tag.registrationToken),
        temperature,
        battery: getBatteryInfo(tag),
        lastUpdate: tag.lastEventTime || new Date().toISOString(),
        bleAssets: findLeashedTags(tag.nodeAddress),
        macAddress: tag.macAddress,
        alerts: tag.alerts,
        doorSensorStatus: tag.doorSensorAlarmStatus,
        leashedToSuperTag: findSuperTagName(tag.sourceSupertagId),
        nodeAddress: tag.nodeAddress,
        registrationToken: tag.registrationToken,
        chargeState: tag.chargeState,
        batteryCapacity_mAh: tag.batteryCapacity_mAh
      };
    });
  }, [tags]);

  const filteredMarkers = useMemo(() => {
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

    return result;
  }, [processedMarkers, assetViewType, searchTerm]);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const mapConfig = useMemo(() => {
    if (selectedAsset) {
      return {
        center: selectedAsset.position,
        zoom: 15
      };
    }
    return {
      center: filteredMarkers[0]?.position || DEFAULT_POSITION,
      zoom: 13
    };
  }, [selectedAsset, filteredMarkers]);

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showMapView={showMapView}
        onViewChange={setShowMapView}
        selectedSiteId={selectedSiteId}
        onSiteSelect={setSelectedSiteId}
      />

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
            <AssetList 
              assets={filteredMarkers}
              selectedAsset={selectedAsset}
              onAssetSelect={setSelectedAsset}
              assetViewType={assetViewType}
              onAssetViewChange={setAssetViewType}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {showMapView ? (
              <div className="h-full">
                <Map 
                  center={mapConfig.center}
                  zoom={mapConfig.zoom}
                  markers={selectedAsset ? [selectedAsset] : filteredMarkers}
                />
              </div>
            ) : (
              <Dashboard 
                selectedAsset={selectedAsset}
                markers={filteredMarkers}
                mapConfig={mapConfig}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;