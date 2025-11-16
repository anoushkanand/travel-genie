import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { destination, startDate, endDate, budget, travelers, travelStyle, currentLocation } = await request.json();
    
    // Calculate duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Get month name for weather context
    const monthName = start.toLocaleString('en-US', { month: 'long' });
    
    // Format dates for booking links
    const formattedStartDate = start.toISOString().split('T')[0];
    const formattedEndDate = end.toISOString().split('T')[0];
    
    // Get current location name if coordinates provided
    let currentLocationName = 'your location';
    if (currentLocation) {
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.lat}&lon=${currentLocation.lon}&format=json`,
          {
            headers: {
              'User-Agent': 'TravelGenie/1.0'
            }
          }
        );
        const geoData = await geoResponse.json();
        currentLocationName = geoData.address?.city || geoData.address?.town || geoData.address?.county || 'your location';
      } catch (err) {
        console.error('Geocoding error:', err);
      }
    }
    
    // Build the prompt for Gemini
    const prompt = `You are a travel planning expert specializing in budget-friendly trips for students. You have extensive knowledge of transportation costs, hostel prices, and travel tips.

CRITICAL: You MUST research the ACTUAL transportation providers that service the route from ${currentLocationName} to ${destination}. DO NOT use placeholder names. Research which bus companies, train services, and airlines actually operate on this specific route.

Create a detailed travel plan with the following information:

TRIP DETAILS:
- Origin: ${currentLocationName}
- Destination: ${destination}
- Dates: ${startDate} to ${endDate} (${days} days in ${monthName})
- Budget: ${budget ? `${budget}` : 'Budget-conscious (assume $300-500 range)'}
- Number of travelers: ${travelers}
- Travel style: ${travelStyle}

ROUTE-SPECIFIC RESEARCH REQUIRED:
Before generating the plan, think about what transportation actually exists for this route:
1. What bus companies operate between ${currentLocationName} and ${destination}? (Greyhound, FlixBus, Megabus, Peter Pan, BoltBus, regional carriers?)
2. What train services exist? (Amtrak, regional rail, commuter rail, or NO train service?)
3. What are the nearest airports and which airlines fly this route? (major carriers, budget airlines, or no viable flight?)
4. If a transportation mode doesn't exist or make sense for this route, DO NOT include it or mark it as "Not Available"

Generate a comprehensive trip plan in JSON format with this EXACT structure:
{
  "destination": "${destination}",
  "origin": "${currentLocationName}",
  "duration": "${days} days",
  "totalCost": "estimated cost range with $ symbol",
  "dailyBudget": "per day estimate with $ symbol",

  "transport": [
    {
      "type": "Bus",
      "name": "Megabus",
      "cost": "$65 round trip",
      "duration": "6 hours",
      "analysis": "Chose Megabus because it is the cheapest option (~$65) with direct routes, moderate comfort, and reliable schedule.",
      "bookingUrl": "https://us.megabus.com",
      "bookingInstructions": "Search from ${currentLocationName} to ${destination} for ${formattedStartDate}"
    },
    {
      "type": "Train",
      "name": "Amtrak",
      "cost": "$120 round trip",
      "duration": "5.5 hours",
      "analysis": "Amtrak is faster than bus, more comfortable, but more expensive (~$120). Only considered direct routes from current location.",
      "bookingUrl": "https://www.amtrak.com",
      "bookingInstructions": "Search from ${currentLocationName} to ${destination} for ${formattedStartDate}"
    },
    {
      "type": "Flight",
      "name": "Spirit Airlines",
      "cost": "$200 round trip",
      "duration": "1.5 hours",
      "analysis": "Flight is fastest option but most expensive. Budget airlines considered (Spirit, Frontier), but departure airport limited the choices.",
      "bookingUrl": "https://www.google.com/travel/flights",
      "bookingInstructions": "Search flights from ${currentLocationName} to ${destination} for ${formattedStartDate}"
    }
  ],

  "accommodation": {
    "name": "Specific hostel/budget hotel name - NOT generic 'Hi + destination'",
    "cost": "$XX/night",
    "total": "$XXX for ${days - 1} nights",
    "bookingUrl": "https://www.hostelworld.com or https://www.booking.com",
    "bookingInstructions": "Search for hostels in ${destination} for ${formattedStartDate} to ${formattedEndDate}"
  },
  
  "itinerary": [
    {
      "day": 1,
      "activities": "Detailed morning, afternoon, evening activities specific to ${destination}. Include specific attraction names, neighborhoods, and free/cheap options."
    }
  ],
  
  "packingList": [
    "10-15 specific items based on ${monthName} weather in ${destination}",
    "Include weather-specific clothing",
    "Travel essentials",
    "Tech items"
  ],
  
  "safetyTips": [
    "5-7 specific safety tips for ${destination}",
    "Include neighborhood safety info",
    "Emergency numbers",
    "Local customs to be aware of",
    "Scam warnings if applicable"
  ],
  
  "checklist": [
    "Passport/ID requirements",
    "Visa information if needed",
    "Travel insurance",
    "Booking confirmations",
    "Currency exchange",
    "SIM card/data plan",
    "Download offline maps",
    "Notify bank of travel"
  ],
  
  "recommendation": "One sentence explaining which transport option gives best value. Example: 'Take the Megabus for $65 and stay in a hostel to keep your total trip under $250!'"
}

CRITICAL INSTRUCTIONS FOR TRANSPORTATION:
1. **RESEARCH THE ACTUAL ROUTE**: Think about which providers actually serve ${currentLocationName} to ${destination}
2. **Bus companies vary by region**: 
   - East Coast: Greyhound, Peter Pan, Megabus, BoltBus
   - West Coast: Greyhound, FlixBus, Amtrak Thruway
   - Midwest: Greyhound, Burlington Trailways, Barons Bus
   - International: Greyhound (US-Canada), FlixBus (Europe)
3. **Train services are LOCATION-SPECIFIC**:
   - Amtrak operates in USA (but NOT all routes - check if route exists!)
   - VIA Rail in Canada
   - Regional/commuter rail for short distances
   - If NO train service exists between cities, say "Not Available" or skip it
4. **Airlines vary by route distance and airports**:
   - Short routes (<200 miles): Often no flights, use bus/train instead
   - Medium routes: Budget airlines (Spirit, Frontier, Southwest, Allegiant)
   - Check actual airports near both cities
   - If cities don't have airports nearby, mark as "Not Practical"
5. **Use REAL booking URLs** based on the provider you choose
6. **Provide realistic costs** based on typical prices for that route distance and provider

EXAMPLES OF GOOD ROUTE RESEARCH:
- Boston to New York: Greyhound, Peter Pan Bus, Amtrak (Northeast Regional), Delta/JetBlue flights
- Los Angeles to San Francisco: Greyhound, Amtrak (Coast Starlight), Southwest/Alaska flights
- College Park to Toronto: Greyhound (via NYC), NO direct Amtrak (would need multiple trains), Budget flights from BWI
- Seattle to Portland: FlixBus, BoltBus, Amtrak Cascades, Alaska Airlines

OTHER CRITICAL INSTRUCTIONS:
OTHER CRITICAL INSTRUCTIONS:
1. For booking URLs:
   - Buses: Use actual provider website (greyhound.com, megabus.com, flixbus.com, peterpanbus.com, etc.)
   - Trains: Use amtrak.com (USA), viarail.ca (Canada), or specific regional rail site
   - Flights: Use https://www.google.com/travel/flights or https://www.kayak.com
   - Accommodation: Use https://www.hostelworld.com for hostels or https://www.booking.com for hotels
2. Include clear booking instructions with origin, destination, and dates
3. All URLs must be real, working websites
4. Make sure total costs add up correctly (transport + accommodation + daily expenses)
5. Create ${days} unique daily itineraries with SPECIFIC attractions, museums, neighborhoods in ${destination}
6. Include weather-appropriate packing for ${monthName} in ${destination}
7. Keep accommodation budget-friendly (hostels $25-45/night, budget hotels $50-75/night)
8. If budget is provided, ensure total cost stays within or slightly under it
9. Return ONLY valid JSON, absolutely no markdown formatting, no code blocks, no explanatory text
10. All cost values must include $ symbol

EXAMPLE TRANSPORT PRICING BY DISTANCE:
- Under 200 miles: Bus $20-60, Train $40-90, Flight usually not practical
- 200-500 miles: Bus $50-100, Train $80-180, Flight $120-250
- 500-1000 miles: Bus $80-150, Train $120-300, Flight $150-350
- Over 1000 miles: Bus $100-200, Train $200-500, Flight $200-500

Generate the complete plan now:`;

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'Travel Genie'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', response.status, errorData);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '')
                     .replace(/```\n?/g, '')
                     .replace(/^[^{]*({.*})[^}]*$/s, '$1')
                     .trim();
    
    // Parse the JSON response
    let tripPlan;
    try {
      tripPlan = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Content received:', content);
      throw new Error('Failed to parse AI response');
    }
    
    // Validate required fields
    if (!tripPlan.destination || !tripPlan.transport || !tripPlan.accommodation) {
      throw new Error('Incomplete trip plan generated');
    }
    
    return NextResponse.json(tripPlan);
    
  } catch (error) {
    console.error('Error generating trip:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate trip plan',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}