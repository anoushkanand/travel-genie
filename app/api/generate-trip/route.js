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
    
    // Build the prompt for OpenAI
    const prompt = `You are a travel expert. Create a realistic budget trip plan from ${currentLocationName} to ${destination}.

TRIP: ${startDate} to ${endDate} (${days} days, ${monthName}), ${travelers} travelers, Budget: ${budget ? `$${budget}` : '$300-500'}, Style: ${travelStyle}

⚠️ CRITICAL DISTANCE ANALYSIS - READ CAREFULLY:
You MUST estimate the actual distance between ${currentLocationName} and ${destination}:

**DISTANCE CATEGORIES & WHAT TO SHOW:**
- **Under 50 miles** (e.g., College Park to DC): Metro/subway ONLY ($2-8, 30-60 min)
- **50-500 miles** (e.g., College Park to NYC, NYC to Boston, NYC to DC): Show ALL options - Bus, Train, AND Flight if available
  * Bus: Always practical for this range ($30-100, 3-10h)
  * Train: Usually available on major routes ($50-150, 3-8h)
  * Flight: Include if airports exist, even if more expensive ($100-250, 1-2h)
- **500-1500 miles** (e.g., NYC to Chicago, LA to Seattle): Show ALL options but prioritize Flight
  * Flight: Most practical ($150-350, 2-4h)
  * Bus: Mention but note long duration ($80-200, 15-30h)
  * Train: Mention if scenic routes exist ($150-400, 20-35h)
- **OVER 1500 miles** (e.g., East Coast to West Coast): Flight FIRST, but still mention bus/train
  * Flight: PRIMARY option ($250-500, 5-7h)
  * Bus: List but mark "Not Recommended - 40-60 hours" ($200-350)
  * Train: List but mark "Scenic but impractical - 60-70 hours" ($400-800)

🚨 EXAMPLES:
- College Park to NYC (~225 miles): Show Bus ($30-50, 4-5h), Train ($60-120, 3-4h), Flight ($150-250, 1.5h)
- College Park to San Francisco (~2,800 miles): Show Flight FIRST ($350-500, 6-7h), then Bus ($250, 50h - not recommended), Train ($600, 70h - scenic but long)

**CRITICAL: For distances 50-500 miles, ALWAYS show at least 2-3 transportation options. People want choices!**

JSON STRUCTURE:
{
  "destination": "${destination}",
  "origin": "${currentLocationName}",
  "duration": "${days} days",
  "totalCost": "$XXX-YYY",
  "dailyBudget": "$XX-YY",
  "transport": [
    {"type": "Flight/Bus/Train/Metro", "name": "Provider", "cost": "$XX", "duration": "REALISTIC hours", "analysis": "Explanation", "bookingUrl": "url", "bookingInstructions": "details"}
  ],
  "accommodation": {"name": "Real hostel", "cost": "$XX/night", "total": "$XXX for ${days - 1} nights", "bookingUrl": "url", "bookingInstructions": "details"},
  "itinerary": [
    {"day": 1, "activities": "Detailed morning, afternoon, and evening activities. Include specific attraction names, neighborhoods, restaurants, and free/cheap options in ${destination}. Make it engaging and specific."},
    {"day": 2, "activities": "Different activities for day 2 with specific places..."}
  ],
  "packingList": ["10-15 items for ${monthName}"],
  "safetyTips": ["5-7 tips for ${destination}"],
  "checklist": ["8-10 pre-trip items"],
  "recommendation": "Best value option"
}

CRITICAL RULES:
1. **Estimate distance first** - is ${currentLocationName} to ${destination} 50mi, 200mi, 500mi, 1000mi, or 1500+ mi?
2. **ALWAYS show multiple options for 50-500 mile trips** (like College Park to NYC):
   - Include Bus (Greyhound, Megabus, Peter Pan)
   - Include Train (Amtrak if available)
   - Include Flight (if airports available)
3. **For 500-1500 miles**: Show all options but recommend flight
4. **For 1500+ miles**: Show flight first, but still list bus/train with "not recommended" note
5. **Travel times MUST be realistic**:
   - Bus: ~50 mph average including stops
   - Train: ~50-60 mph for long distance
   - Flight: 500 mph + 2h airport time
6. ${budget ? `Stay within ${budget} total` : 'Aim for $300-500'}
7. Real providers: Greyhound, Megabus, Peter Pan (bus), Amtrak (train), Spirit/Frontier/Southwest (flights)
8. Real hostels: HI Hostels, Generator, USA Hostels, Pacific Trailways
9. Metro systems: WMATA (DC), MTA (NYC), BART (SF), MBTA (Boston), CTA (Chicago)
10. Return ONLY valid JSON, no markdown

ITINERARY REQUIREMENTS:
- Create ${days} full day-by-day itineraries
- Each day should have 4-6 sentences describing morning, afternoon, and evening activities
- Include SPECIFIC attraction names (museums, parks, neighborhoods, restaurants)
- Mix paid attractions with FREE options (parks, walking tours, viewpoints)
- Include local food recommendations and budget-friendly eating spots
- Mention approximate costs for major activities
- Make it exciting and detailed - travelers should be able to follow this plan exactly!

**HOLIDAY & SEASONAL EVENTS:**
- Check if ${startDate} to ${endDate} falls during any major holidays or events in ${destination}
- If traveling during holidays (Christmas, New Year's, Thanksgiving, 4th of July, Halloween, etc.), include:
  * Holiday markets (Christmas markets, holiday bazaars, craft fairs)
  * Special events (parades, fireworks, festivals, light displays)
  * Seasonal activities unique to that time
  * Holiday-themed restaurants or pop-ups
  * Note: Some attractions may be closed or have special hours during holidays
- For ${monthName}, mention any seasonal events typical for that month in ${destination}
- Examples: "It's December, so visit the Union Square Christmas Market with holiday gifts and hot cocoa!" or "Since it's July 4th week, catch the fireworks show at the waterfront!"

Example good itinerary entry:
"Start your morning at the Golden Gate Bridge (free!) for sunrise photos, then head to Fisherman's Wharf for clam chowder in a sourdough bowl ($12-15). Spend the afternoon exploring Alcatraz Island (book tickets in advance, $40) or walk through Chinatown for free and grab dim sum at Good Mong Kok Bakery ($8-10). Evening: Watch the sunset at Twin Peaks (free, panoramic city views), then have dinner in the Mission District at La Taqueria ($10-12) and explore the vibrant street art."

TRAVEL TIME CALCULATION:
- 100 miles: Bus 2h, Train 2h, Flight impractical
- 500 miles: Bus 10h, Train 10h, Flight 2h
- 1000 miles: Bus 20h, Train 22h, Flight 3.5h
- 2000 miles: Bus 40h, Train 45h, Flight 6h
- 3000 miles: Bus 60h, Train 70h, Flight 7h

Generate the plan:`;

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
            role: 'system',
            content: 'You are a travel expert who MUST calculate realistic distances and travel times. For cross-country trips (>1500 miles), ALWAYS list flights first. Respond ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3500
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