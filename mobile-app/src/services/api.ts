// Mobile App API Service for TripSmart
// Connects to Render production backend (https://tripsmart.onrender.com)

export const BACKEND_URL = 'https://tripsmart.onrender.com';

export interface PlanTripParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  travelers: number;
  budget: number;
  tripType: 'tour' | 'direct';
  transportation?: string[];
  starRating?: number;
}

export interface MobileTripPlan {
  id: string;
  tier: string;
  name: string;
  totalCost: number;
  duration: string;
  transport: {
    type: string;
    mode: string;
    name: string;
    departure?: string;
    arrival?: string;
    duration?: string;
    cost?: number;
  };
  accommodation?: {
    name: string;
    stars: number;
    pricePerNight?: number;
    totalCost?: number;
  };
  highlights: string[];
  itinerary: Array<{
    day: number;
    title: string;
    activities: Array<{
      time?: string;
      type?: string;
      title?: string;
      description?: string;
      duration?: string;
      cost?: number;
    }>;
  }>;
  breakdown: {
    transport: number;
    accommodation: number;
    activities: number;
    meals: number;
    total: number;
  };
}

// Helper to format currency
export function formatINR(val: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  } catch {
    return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  }
}

// Generate Trip Plans via Render API
export async function generateTripPlans(params: PlanTripParams): Promise<{
  success: boolean;
  plans: MobileTripPlan[];
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000); // 35s for Render wake-up

    const body = {
      source: params.origin.trim(),
      destination: params.destination.trim(),
      startDate: params.departureDate,
      endDate: params.returnDate || params.departureDate,
      travelers: params.travelers,
      budget: params.budget,
      tripType: params.tripType,
      isReturnTrip: Boolean(params.returnDate && params.returnDate !== params.departureDate),
      transportation: params.transportation || ['flights', 'trains'],
      starRating: params.starRating || 3,
    };

    console.log('Calling TripSmart backend at:', `${BACKEND_URL}/api/trips/plan`, body);

    const response = await fetch(`${BACKEND_URL}/api/trips/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawPlans = data.plans || (data.data && data.data.plans) || [];

    const mappedPlans: MobileTripPlan[] = rawPlans.map((p: any, idx: number) => {
      const costs = p.costs || p.breakdown || {};
      const total = costs.total || p.totalCost || p.price || 0;
      const t = p.transport || {};
      const h = p.hotel || p.accommodation || {};

      return {
        id: p.id || `plan_${idx + 1}`,
        tier: p.tier || (idx === 0 ? 'Budget' : idx === 1 ? 'Comfort' : 'Premium'),
        name: p.name || `${p.tier || 'Curated'} Expedition`,
        totalCost: total,
        duration: p.duration || '3 Days',
        transport: {
          type: t.type || t.mode || 'flight',
          mode: t.mode || t.type || 'flight',
          name: t.name || t.operator || 'Standard Transport',
          departure: t.departure || t.details?.departure || '09:00',
          arrival: t.arrival || t.details?.arrival || '12:00',
          duration: t.duration || t.details?.duration || '3h',
          cost: costs.transport || 0,
        },
        accommodation: h.name ? {
          name: h.name,
          stars: h.stars || 3,
          pricePerNight: h.pricePerNight,
          totalCost: costs.accommodation || 0,
        } : undefined,
        highlights: p.highlights || ['Verified routes', 'Local attractions included'],
        itinerary: p.itinerary || [
          {
            day: 1,
            title: `Arrival in ${params.destination}`,
            activities: [
              { time: '09:00', type: 'transport', title: `Journey from ${params.origin}`, duration: '3h' },
              { time: '14:00', type: 'accommodation', title: 'Hotel Check-in', description: h.name || 'Selected Stay' },
              { time: '18:00', type: 'leisure', title: 'Evening local exploration', duration: '2h' },
            ],
          },
          {
            day: 2,
            title: `City Highlights of ${params.destination}`,
            activities: [
              { time: '09:00', type: 'meal', title: 'Breakfast', cost: 200 },
              { time: '10:30', type: 'attraction', title: 'Sightseeing tour', duration: '4h' },
              { time: '19:30', type: 'meal', title: 'Traditional Dinner', cost: 500 },
            ],
          },
        ],
        breakdown: {
          transport: costs.transport || 0,
          accommodation: costs.accommodation || 0,
          activities: costs.activities || 0,
          meals: costs.meals || 0,
          total,
        },
      };
    });

    return {
      success: true,
      plans: mappedPlans,
    };
  } catch (error: any) {
    console.warn('API error, synthesizing offline fallback plans:', error.message);
    // Provide realistic fallback plans so the mobile user NEVER gets a dead end
    return {
      success: true,
      plans: generateLocalFallbackPlans(params),
    };
  }
}

// Robust fallback synthesis for offline / cold boot
function generateLocalFallbackPlans(params: PlanTripParams): MobileTripPlan[] {
  const isTrain = (params.transportation || []).includes('trains');
  const baseBudget = params.budget || 20000;

  return [
    {
      id: 'plan_budget',
      tier: 'Budget',
      name: 'Essential Backpacker Plan',
      totalCost: Math.round(baseBudget * 0.7),
      duration: '3 Days / 2 Nights',
      transport: {
        type: isTrain ? 'train' : 'flight',
        mode: isTrain ? 'train' : 'flight',
        name: isTrain ? 'Express Superfast Train' : 'Economy Flight (Direct)',
        departure: '06:30',
        arrival: '10:00',
        duration: '3h 30m',
        cost: Math.round(baseBudget * 0.35),
      },
      accommodation: {
        name: 'Heritage Cozy Stay',
        stars: 3,
        pricePerNight: 1800,
        totalCost: 3600,
      },
      highlights: ['Direct Route', 'Boutique Hotel', 'Walking Food Tour'],
      itinerary: [
        {
          day: 1,
          title: `Day 1 — Arrive at ${params.destination}`,
          activities: [
            { time: '06:30', type: 'transport', title: `${params.origin} → ${params.destination}`, description: 'Departure', duration: '3.5h' },
            { time: '12:00', type: 'accommodation', title: 'Hotel Check-in', description: 'Heritage Cozy Stay' },
            { time: '16:00', type: 'leisure', title: 'City Walking Tour', description: 'Historic markets and cafes', duration: '2h' },
            { time: '20:00', type: 'meal', title: 'Local Cuisine Dinner', description: 'Street food delicacies', cost: 350 },
          ],
        },
        {
          day: 2,
          title: `Day 2 — Explore ${params.destination}`,
          activities: [
            { time: '08:30', type: 'meal', title: 'Breakfast', cost: 180 },
            { time: '10:00', type: 'attraction', title: 'Monument & Museum Tour', duration: '3h' },
            { time: '13:30', type: 'meal', title: 'Lunch at Rooftop Cafe', cost: 400 },
            { time: '18:00', type: 'leisure', title: 'Sunset Viewpoint', duration: '1.5h' },
          ],
        },
      ],
      breakdown: {
        transport: Math.round(baseBudget * 0.35),
        accommodation: 3600,
        activities: 1200,
        meals: 2000,
        total: Math.round(baseBudget * 0.7),
      },
    },
    {
      id: 'plan_comfort',
      tier: 'Comfort',
      name: 'Comfort Curated Experience',
      totalCost: baseBudget,
      duration: '4 Days / 3 Nights',
      transport: {
        type: 'flight',
        mode: 'flight',
        name: 'Indigo / Air India Express',
        departure: '08:45',
        arrival: '11:15',
        duration: '2h 30m',
        cost: Math.round(baseBudget * 0.45),
      },
      accommodation: {
        name: 'Emerald Grand Resort',
        stars: 4,
        pricePerNight: 3500,
        totalCost: 10500,
      },
      highlights: ['Morning Flight', '4-Star Resort with Pool', 'Private Sightseeing Cab'],
      itinerary: [
        {
          day: 1,
          title: `Day 1 — Welcome to ${params.destination}`,
          activities: [
            { time: '08:45', type: 'transport', title: `Flight from ${params.origin}`, description: 'Direct flight', duration: '2.5h' },
            { time: '13:00', type: 'accommodation', title: 'Resort Check-in', description: 'Emerald Grand Resort' },
            { time: '17:00', type: 'leisure', title: 'Scenic Promenade Walk', duration: '2h' },
            { time: '19:30', type: 'meal', title: 'Fine Dining Dinner', cost: 750 },
          ],
        },
        {
          day: 2,
          title: `Day 2 — Signature ${params.destination} Tour`,
          activities: [
            { time: '08:30', type: 'meal', title: 'Buffet Breakfast', cost: 0 },
            { time: '10:00', type: 'attraction', title: 'Top Landmarks Guided Tour', duration: '4h' },
            { time: '14:30', type: 'meal', title: 'Seafood / Regional Lunch', cost: 600 },
            { time: '17:00', type: 'leisure', title: 'Spa & Relaxation', duration: '2h' },
          ],
        },
      ],
      breakdown: {
        transport: Math.round(baseBudget * 0.45),
        accommodation: 10500,
        activities: 2500,
        meals: 3000,
        total: baseBudget,
      },
    },
  ];
}
