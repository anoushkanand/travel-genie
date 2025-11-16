'use client';
import { useState, useEffect } from 'react';
import { Plane, Calendar, DollarSign, Users, Sparkles, Loader2, Download, Share2, Heart, MapPin, Check, Star, Wand2, ExternalLink } from 'lucide-react';

export default function TravelGenie() {
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: '1',
    travelStyle: 'budget',
    currentLocation: null
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [tripPlan, setTripPlan] = useState(null);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  const toggleChecklistItem = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const togglePackingItem = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [`packing-${index}`]: !prev[`packing-${index}`]
    }));
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Defaulting to College Park, MD.');
      setFormData(prev => ({
        ...prev,
        currentLocation: { lat: 38.9857, lon: -76.9378 }
      }));
      setLocationName('College Park, MD');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          currentLocation: { lat: latitude, lon: longitude }
        }));
        
        // Get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'User-Agent': 'TravelGenie/1.0'
              }
            }
          );
          const data = await response.json();
          const name = data.address?.city || data.address?.town || data.address?.county || 'Unknown Location';
          setLocationName(name);
        } catch (err) {
          console.error(err);
          setLocationName('Your Location');
        }
        setLoadingLocation(false);
      },
      (error) => {
        console.error(error);
        alert('Unable to retrieve your location. Defaulting to College Park, MD.');
        setFormData(prev => ({
          ...prev,
          currentLocation: { lat: 38.9857, lon: -76.9378 }
        }));
        setLocationName('College Park, MD');
        setLoadingLocation(false);
      }
    );
  };

  // Loading messages
  const loadingMessages = [
    "✨ Finding magical routes...",
    "🗺️ Crafting your perfect journey...",
    "💰 Discovering the best deals...",
    "🎒 Preparing your adventure...",
    "🌟 Almost ready..."
  ];
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    if (loading) {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to generate trip');
      
      const data = await response.json();
      setTripPlan(data);
    } catch (err) {
      setError('Oops! Something went wrong. Please try again! 💫');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Travel Genie - ${tripPlan.destination}</title>
          <style>
            body { font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #4a5568; }
            h1 { color: #667eea; border-bottom: 3px solid #f6ad55; padding-bottom: 10px; }
            h2 { color: #9f7aea; margin-top: 30px; }
            .section { margin-bottom: 25px; }
            .transport-option { background: #fef5e7; padding: 15px; margin: 10px 0; border-radius: 12px; }
            .day { background: #e6f3f0; padding: 15px; margin: 10px 0; border-left: 4px solid #81e6d9; border-radius: 8px; }
            ul { list-style: none; padding-left: 0; }
            li:before { content: "✓ "; color: #48bb78; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>✨ Your Trip to ${tripPlan.destination}</h1>
          <p><strong>From:</strong> ${tripPlan.origin} | <strong>Duration:</strong> ${tripPlan.duration} | <strong>Total Cost:</strong> ${tripPlan.totalCost}</p>
          
          <div class="section">
            <h2>🚌 Transportation Options</h2>
            ${tripPlan.transport?.map(t => `
              <div class="transport-option">
                <strong>${t.type}: ${t.name}</strong><br>
                Cost: ${t.cost} | Duration: ${t.duration}<br>
                <em>${t.analysis}</em>
              </div>
            `).join('')}
            <p><em>💡 ${tripPlan.recommendation}</em></p>
          </div>

          <div class="section">
            <h2>🏠 Accommodation</h2>
            <p><strong>${tripPlan.accommodation?.name}</strong><br>
            ${tripPlan.accommodation?.cost} per night (${tripPlan.accommodation?.total} total)</p>
          </div>

          <div class="section">
            <h2>📅 Day-by-Day Itinerary</h2>
            ${tripPlan.itinerary?.map(day => `
              <div class="day">
                <strong>Day ${day.day}:</strong> ${day.activities}
              </div>
            `).join('')}
          </div>

          <div class="section">
            <h2>🎒 Packing List</h2>
            <ul>${tripPlan.packingList?.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>

          <div class="section">
            <h2>🛡️ Safety Tips</h2>
            <ul>${tripPlan.safetyTips?.map(tip => `<li>${tip}</li>`).join('')}</ul>
          </div>

          <div class="section">
            <h2>✅ Pre-Trip Checklist</h2>
            <ul>${tripPlan.checklist?.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>

          <p style="text-align: center; margin-top: 50px; color: #667eea;">
            <strong>Created with ✨ Travel Genie</strong><br>
            Your AI-powered trip planner
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generateShareLink = () => {
    const tripData = btoa(JSON.stringify({
      destination: tripPlan.destination,
      duration: tripPlan.duration,
      totalCost: tripPlan.totalCost
    }));
    const link = `${window.location.origin}?trip=${tripData}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Wand2 className="w-9 h-9 text-indigo-400" />
              <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                Travel Genie
              </h1>
              <p className="text-xs text-gray-500 font-medium">Making travel dreams come true</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-rose-100 px-4 py-2 rounded-full">
            <Heart className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-semibold text-gray-700">Budget-Friendly Travel</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!tripPlan ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 space-y-3">
              <div className="inline-block">
                <div className="text-6xl mb-2">🧞‍♂️</div>
              </div>
              <h2 className="text-5xl font-bold text-gray-800 leading-tight">
                Explore & Adventure
              </h2>
              <p className="text-lg text-gray-600">
                Tell me where you want to go, and I'll create the perfect budget-friendly adventure ✨
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 space-y-6 border border-gray-100">
              {/* Current Location Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={loadingLocation}
                  className="px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Use My Location
                    </>
                  )}
                </button>
                {locationName && (
                  <span className="text-sm text-gray-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                    📍 {locationName}
                  </span>
                )}
              </div>

              {/* Destination */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  Destination
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  placeholder="New York, USA"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200 text-base text-gray-800 bg-gray-50"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 bg-gray-50"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Your Budget (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-emerald-500">$</span>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="400"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 text-base text-gray-800 font-semibold bg-gray-50"
                  />
                </div>
              </div>

              {/* Number of Travelers */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Number of Travelers
                </label>
                <select
                  value={formData.travelers}
                  onChange={(e) => setFormData({...formData, travelers: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-200 font-medium text-gray-800 bg-gray-50 cursor-pointer"
                >
                  <option value="1">Solo (just me)</option>
                  <option value="2">2 people</option>
                  <option value="3-4">3-4 people</option>
                  <option value="5+">5+ people</option>
                </select>
              </div>

              {/* Travel Style */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-300" />
                  Travel Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'budget', emoji: '💸', label: 'Budget', color: 'bg-amber-50 border-amber-200 hover:border-amber-300' },
                    { value: 'balanced', emoji: '⚖️', label: 'Balanced', color: 'bg-purple-50 border-purple-200 hover:border-purple-300' },
                    { value: 'comfort', emoji: '🌟', label: 'Comfort', color: 'bg-pink-50 border-pink-200 hover:border-pink-300' }
                  ].map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setFormData({...formData, travelStyle: style.value})}
                      className={`py-4 px-3 rounded-2xl border-2 transition-all ${
                        formData.travelStyle === style.value
                          ? `${style.color} shadow-md scale-105`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{style.emoji}</div>
                      <div className={`font-semibold text-sm ${formData.travelStyle === style.value ? 'text-gray-800' : 'text-gray-600'}`}>
                        {style.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 flex items-center gap-3">
                  <span className="text-xl">😞</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.destination || !formData.startDate || !formData.endDate}
                className="w-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white py-4 rounded-2xl font-bold text-lg hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm font-medium">{loadingMessage}</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Trip Plan
                    <Wand2 className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🎉</span>
                    <h2 className="text-4xl font-bold text-gray-800">
                      {tripPlan.destination}
                    </h2>
                  </div>
                  <p className="text-gray-600 font-medium">From {tripPlan.origin} • Your adventure awaits!</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-200 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Save PDF
                  </button>
                  <button
                    onClick={generateShareLink}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={() => setTripPlan(null)}
                    className="flex items-center gap-2 px-5 py-3 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-all"
                  >
                    ✨ New Trip
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-6 shadow-lg border border-purple-200">
                <div className="text-xs font-medium mb-1 text-purple-700">Duration</div>
                <div className="text-3xl font-bold text-purple-900">{tripPlan.duration}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl p-6 shadow-lg border border-emerald-200">
                <div className="text-xs font-medium mb-1 text-emerald-700">Total Cost</div>
                <div className="text-3xl font-bold text-emerald-900">{tripPlan.totalCost}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-6 shadow-lg border border-blue-200">
                <div className="text-xs font-medium mb-1 text-blue-700">Daily Budget</div>
                <div className="text-3xl font-bold text-blue-900">{tripPlan.dailyBudget}</div>
              </div>
            </div>

            {/* Transportation */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-3xl">🚌</span>
                Transportation Options
              </h3>
              <div className="space-y-3">
                {tripPlan.transport?.map((option, idx) => (
                  <div key={idx} className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{option.type === 'Bus' ? '🚌' : option.type === 'Train' ? '🚆' : '✈️'}</div>
                        <div>
                          <div className="font-bold text-gray-800 text-lg">{option.name}</div>
                          <div className="text-sm text-gray-600 font-medium">⏱️ {option.duration}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-emerald-600">{option.cost}</div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 pl-16">{option.analysis}</p>
                    {option.bookingUrl && (
                      <a
                        href={option.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-all text-sm ml-16"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Book Now
                      </a>
                    )}
                    {option.bookingInstructions && (
                      <p className="text-xs text-gray-500 mt-2 ml-16">💡 {option.bookingInstructions}</p>
                    )}
                  </div>
                ))}
              </div>
              {tripPlan.recommendation && (
                <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                  <p className="text-emerald-700 font-semibold flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    {tripPlan.recommendation}
                  </p>
                </div>
              )}
            </div>

            {/* Accommodation */}
            {tripPlan.accommodation && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-3xl">🏠</span>
                  Accommodation
                </h3>
                <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-bold text-gray-800 text-xl">{tripPlan.accommodation.name}</div>
                      <div className="text-gray-600 font-medium mt-1">🌙 {tripPlan.accommodation.cost} per night</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 font-medium">Total</div>
                      <div className="text-2xl font-bold text-blue-700">{tripPlan.accommodation.total}</div>
                    </div>
                  </div>
                  {tripPlan.accommodation.bookingUrl && (
                    <a
                      href={tripPlan.accommodation.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-all text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Find Accommodation
                    </a>
                  )}
                  {tripPlan.accommodation.bookingInstructions && (
                    <p className="text-xs text-gray-500 mt-2">💡 {tripPlan.accommodation.bookingInstructions}</p>
                  )}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {tripPlan.itinerary && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-3xl">📅</span>
                  Day-by-Day Itinerary
                </h3>
                <div className="space-y-3">
                  {tripPlan.itinerary.map((day, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl hover:shadow-md transition-all border border-teal-100">
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-pink-200 to-rose-200 text-gray-800 rounded-2xl flex flex-col items-center justify-center font-bold shadow-md">
                        <div className="text-[10px]">DAY</div>
                        <div className="text-2xl">{day.day}</div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 font-medium leading-relaxed">{day.activities}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Packing List */}
            {tripPlan.packingList && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-3xl">🎒</span>
                  Packing List
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tripPlan.packingList.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 hover:shadow-sm transition-all">
                      <div className="w-5 h-5 border-2 border-purple-300 rounded-md"></div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safety Tips */}
            {tripPlan.safetyTips && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-3xl">🛡️</span>
                  Safety Tips
                </h3>
                <div className="space-y-2">
                  {tripPlan.safetyTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-medium">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            {tripPlan.checklist && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-3xl">✅</span>
                  Pre-Trip Checklist
                </h3>
                <div className="space-y-2">
                  {tripPlan.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:shadow-sm transition-all">
                      <div className="w-5 h-5 border-2 border-amber-300 rounded-md"></div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔗</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Share Your Trip</h3>
              <p className="text-gray-600 font-medium">Copy this link to share with friends</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <code className="text-sm text-gray-700 break-all font-mono">{shareLink}</code>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                {copiedToClipboard ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}