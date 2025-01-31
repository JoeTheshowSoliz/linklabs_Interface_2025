import React from 'react';
import { Battery } from 'lucide-react';

interface BatteryDistributionProps {
  assets: Array<{
    battery: {
      status: 'OK' | 'Low';
      level: number | null;
    };
  }>;
}

export function BatteryDistribution({ assets }: BatteryDistributionProps) {
  const distribution = assets.reduce((acc, asset) => {
    if (asset.battery.status === 'Low' || (asset.battery.level !== null && asset.battery.level <= 10)) {
      acc.low++;
    } else if (asset.battery.level !== null) {
      if (asset.battery.level > 60) {
        acc.high++;
      } else {
        acc.medium++;
      }
    }
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  const total = assets.length;
  const getPercentage = (value: number) => ((value / total) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-3 mb-4">
        <Battery className="w-6 h-6 text-[#87B812]" />
        <h3 className="font-semibold text-lg">Battery Distribution</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600">High (&gt;60%)</span>
            <span className="text-sm font-medium text-[#87B812]">
              {distribution.high} ({getPercentage(distribution.high)}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className="bg-[#87B812] h-2.5 rounded-full" 
              style={{ width: `${(distribution.high / total) * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600">Medium (11-60%)</span>
            <span className="text-sm font-medium text-yellow-500">
              {distribution.medium} ({getPercentage(distribution.medium)}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className="bg-yellow-500 h-2.5 rounded-full" 
              style={{ width: `${(distribution.medium / total) * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600">Low (≤10%)</span>
            <span className="text-sm font-medium text-red-500">
              {distribution.low} ({getPercentage(distribution.low)}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className="bg-red-500 h-2.5 rounded-full" 
              style={{ width: `${(distribution.low / total) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          Total Devices: {total}
        </div>
      </div>
    </div>
  );
}