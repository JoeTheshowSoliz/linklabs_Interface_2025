import React, { useState } from 'react';
import { Copy, Check, Fingerprint, Barcode, ChevronDown, ChevronRight } from 'lucide-react';

interface AssetIdentifiersProps {
  macAddress: string;
  geotabSerialNumber?: string;
}

export function AssetIdentifiers({ macAddress, geotabSerialNumber }: AssetIdentifiersProps) {
  const [copiedField, setCopiedField] = useState<'mac' | 'serial' | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const copyToClipboard = async (text: string, field: 'mac' | 'serial') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          Asset Identifiers
        </h2>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#87B812]" />
                <span className="text-sm font-medium text-gray-600">MAC Address</span>
              </div>
              <button
                onClick={() => copyToClipboard(macAddress, 'mac')}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors group relative"
                title="Copy MAC Address"
              >
                {copiedField === 'mac' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#87B812]" />
                )}
              </button>
            </div>
            <code className="bg-gray-50 px-3 py-2 rounded-lg text-sm font-mono text-gray-700">
              {macAddress}
            </code>
          </div>

          {geotabSerialNumber && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-[#87B812]" />
                  <span className="text-sm font-medium text-gray-600">Geotab Serial Number</span>
                </div>
                <button
                  onClick={() => copyToClipboard(geotabSerialNumber, 'serial')}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors group relative"
                  title="Copy Serial Number"
                >
                  {copiedField === 'serial' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#87B812]" />
                  )}
                </button>
              </div>
              <code className="bg-gray-50 px-3 py-2 rounded-lg text-sm font-mono text-gray-700">
                {geotabSerialNumber}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}