// In the transactions display, update the temperature display:

<div className="flex items-center gap-1.5">
  <Thermometer 
    className={`w-4 h-4 ${
      tx.temperature >= 80 ? 'text-red-500' :
      tx.temperature >= 70 ? 'text-orange-500' : 'text-[#004780]'
    }`} 
  />
  <span className="text-sm text-gray-600">{tx.temperature.toFixed(2)}°F</span>
</div>