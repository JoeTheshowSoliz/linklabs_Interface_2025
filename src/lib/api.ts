import axios from 'axios';

const API_BASE_URL = 'https://networkasset-conductor.link-labs.com';

interface LoginCredentials {
  username: string;
  password: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;
}

export interface Tag {
  name: string;
  macAddress: string;
  fahrenheit: number | null;
  lastEventTime: string;
  longitude: number | null;
  latitude: number | null;
  registrationToken: string;
  nodeAddress: string;
  sourceSupertagId: string | null;
  batteryVoltage?: string | null;
  doorSensorAlarmStatus?: string | null;
  batteryStatus: number | string;
  batteryCapacity_mAh: number | string;
  batteryConsumed_mAh?: number | string | null;
  batteryUsage_uAh?: number | string | null;
  alerts?: string[];
}

export interface BatteryInfo {
  status: 'OK' | 'Low';
  level: number | null;
}

export interface BLEAsset {
  name: string;
  type: string;
  connected: boolean;
  connectionDate: string;
  leashedTime: string;
  lastUpdate: string;
  battery: BatteryInfo;
}

// Define tag type constants
export const TagTypes = {
  SUPERTAG: 'D29B3BE8F2CC9A1A7051',
  DOOR_SENSOR: '61697266696E64657200',
  TEMPERATURE: '150285A4E29B7856C7CC'
} as const;

// Function to get the type of tag based on registration token
export function getTagType(registrationToken: string): string {
  switch (registrationToken) {
    case TagTypes.SUPERTAG:
      return 'SuperTag';
    case TagTypes.DOOR_SENSOR:
      return 'Door Sensor';
    case TagTypes.TEMPERATURE:
      return 'Temperature Tag';
    default:
      return 'BLE Tag';
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export async function login({ username, password }: LoginCredentials): Promise<boolean> {
  try {
    const authHeader = 'Basic ' + btoa(`${username}:${password}`);
    
    // Test credentials by trying to fetch organizations
    const response = await api.get('/networkAsset/airfinder/organizations', {
      headers: {
        'Authorization': authHeader
      }
    });

    if (response.status === 200) {
      localStorage.setItem('authToken', authHeader);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

export async function fetchOrganizations(): Promise<Organization[]> {
  try {
    const response = await api.get('/networkAsset/airfinder/organizations');
    return response.data.map((org: any) => ({
      id: org.id || '',
      name: org.value || org.name || 'Unnamed Organization'
    }));
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    throw error;
  }
}

export async function fetchSites(organizationId: string): Promise<Site[]> {
  try {
    const response = await api.get(`/networkAsset/airfinder/organization/${organizationId}/sites`);
    return response.data.map((site: any) => ({
      id: site.id || '',
      name: site.value || site.name || site.siteName || 'Unnamed Site'
    }));
  } catch (error) {
    console.error('Failed to fetch sites:', error);
    throw error;
  }
}

export async function fetchTags(siteId: string): Promise<Tag[]> {
  try {
    const params = new URLSearchParams({
      siteId,
      format: 'json',
      page: '1',
      sortBy: 'nodeName',
      sort: 'asc',
      all: 'true'
    });

    const response = await api.get(`/networkAsset/airfinder/v4/tags?${params}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    throw error;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}

export function logout(): void {
  localStorage.removeItem('authToken');
}

export function getBatteryInfo(tag: Tag): BatteryInfo {
  // Convert batteryStatus to number for comparison
  const batteryStatusNum = Number(tag.batteryStatus);
  
  // If batteryStatus is 0 or conversion failed, return Low status with no level
  if (batteryStatusNum === 0 || isNaN(batteryStatusNum)) {
    return { status: 'Low', level: null };
  }

  const status = batteryStatusNum === 1 ? 'OK' : 'Low';
  let level: number | null = null;

  // Convert batteryCapacity_mAh to number for comparison
  const batteryCapacity = Number(tag.batteryCapacity_mAh);
  
  // Only calculate battery level if batteryCapacity_mAh is not 470.0 or 470 and conversion succeeded
  if (!isNaN(batteryCapacity) && batteryCapacity !== 470 && batteryCapacity !== 470.0) {
    if (tag.batteryConsumed_mAh != null) {
      // Convert and calculate using batteryConsumed_mAh
      const consumed = Number(tag.batteryConsumed_mAh);
      if (!isNaN(consumed)) {
        level = ((batteryCapacity * 0.75 - consumed) / (batteryCapacity * 0.75)) * 100;
      }
    } else if (tag.batteryUsage_uAh != null) {
      // Convert and calculate using batteryUsage_uAh
      const usage = Number(tag.batteryUsage_uAh);
      if (!isNaN(usage)) {
        level = ((batteryCapacity * 0.75 - usage / 1000) / (batteryCapacity * 0.75)) * 100;
      }
    }

    // Ensure level is between 0 and 100
    if (level !== null) {
      level = Math.max(0, Math.min(100, Math.round(level)));
    }
  }

  return { status, level };
}