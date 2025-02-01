import React, { useState } from 'react';
import { Search, HelpCircle, X } from 'lucide-react';
import { OrgSiteSelector } from './OrgSiteSelector';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showMapView: boolean;
  onViewChange: (showMap: boolean) => void;
  selectedSiteId: string;
  onSiteSelect: (siteId: string) => void;
}

export function Header({
  searchTerm,
  onSearchChange,
  showMapView,
  onViewChange,
  selectedSiteId,
  onSiteSelect
}: HeaderProps) {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-[60]">
      <div className="flex items-center justify-between max-w-[1800px] mx-auto">
        <div className="flex items-center space-x-12">
          <h1 className="text-2xl font-bold text-[#004780]">Link Labs</h1>
          <OrgSiteSelector onSiteSelect={onSiteSelect} />
        </div>
        <div className="flex items-center space-x-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="search"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-[#87B812]"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => onViewChange(false)}
                className={`px-6 py-2 ${!showMapView ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onViewChange(true)}
                className={`px-6 py-2 ${showMapView ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'}`}
              >
                Map View
              </button>
            </div>
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              title="Help & Support"
            >
              <HelpCircle className="w-5 h-5 text-[#004780]" />
            </button>
          </div>
        </div>
      </div>

      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#004780]">Link Labs Support</h2>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Welcome to Link Labs Support! To submit a support ticket, please click the button below.
            </p>

            <a
              href="https://apps.airfinder.com/help"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#87B812] text-white text-center px-6 py-3 rounded-lg hover:bg-[#769f10] transition-colors font-medium"
              onClick={() => setShowHelpModal(false)}
            >
              Enter Ticket
            </a>
          </div>
        </div>
      )}
    </header>
  );
}