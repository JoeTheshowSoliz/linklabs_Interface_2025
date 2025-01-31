import React from 'react';

interface TimelineChartProps {
  timeRange: '24h' | '7d' | '30d' | '60d';
}

export function TimelineChart({ timeRange }: TimelineChartProps) {
  return (
    <div className="p-4 h-full">
      <div className="h-full flex items-center justify-center text-gray-500">
        Timeline chart visualization will go here, showing:
        <ul className="list-disc ml-4">
          <li>Motion vs. idle time</li>
          <li>Overlaid alerts</li>
          <li>Time-based events</li>
        </ul>
      </div>
    </div>
  );
}