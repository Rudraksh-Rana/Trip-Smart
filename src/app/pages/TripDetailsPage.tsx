import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../components/Navigation';
import AtmosphericWeatherBackground, { type TimeOfDay } from '../components/AtmosphericWeatherBackground';
import {
  Plane, Train, Hotel, MapPin, Clock, Share2, Download,
  ArrowRight, ArrowLeft, Coffee, Utensils, Camera, Star, Users,
  IndianRupee, Activity, Loader2, CreditCard, ShieldAlert,
  Headphones, Phone, Bookmark, Sun, Moon, Sunrise, Sunset, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { formatINR, tripsAPI, type TripPlanData } from '../../services/api';
import { printItinerary } from '../../utils/itineraryExport';
import { arcPath, getCoordinates, getCoordinatesByIATA, scatterPlacesInCity } from '../../data/cityCoordinates';
import { getRailwayCorridors } from '../../data/railwayCorridors';
import PlacesMap from '../components/PlacesMap';

// ── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg:         '#013220',
  teal:       '#0B6E4F',
  emerald:    '#50C878',
  mint:       '#D1F2EB',
  card:       'rgba(11,110,79,0.18)',
  cardBorder: 'rgba(80,200,120,0.16)',
  textMain:   '#D1F2EB',
  textSub:    'rgba(209,242,235,0.72)',
  textDim:    'rgba(209,242,235,0.45)',
};

// ── Time of Day Helper ────────────────────────────────────────────────────
function determineTimeOfDay(activity: any): TimeOfDay {
  const timeStr = String(activity.time || '').trim().toLowerCase();
  const text = `${activity.title || ''} ${activity.description || ''} ${activity.type || ''}`.toLowerCase();

  // Parse HH:MM
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    let hour = parseInt(match[1], 10);
    if (timeStr.includes('pm') && hour < 12) hour += 12;
    if (timeStr.includes('am') && hour === 12) hour = 0;

    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night';
  }

  if (text.includes('breakfast') || text.includes('sunrise') || text.includes('morning')) return 'morning';
  if (text.includes('lunch') || text.includes('afternoon') || text.includes('noon')) return 'afternoon';
  if (text.includes('dinner') || text.includes('sunset') || text.includes('dusk') || text.includes('evening')) return 'evening';
  if (text.includes('night') || text.includes('sleep') || text.includes('club') || text.includes('overnight')) return 'night';

  return 'morning';
}

function isIataLike(v?: string) { return !!v && /^[A-Z]{3}$/.test(v.trim()); }
function resolveCoordinates(v?: string, fallback?: string): [number, number] | null {
  if (isIataLike(v)) { const c = getCoordinatesByIATA(v!); if (c) return c; }
  if (v) { const c = getCoordinates(v); if (c) return c; }
  if (fallback) return getCoordinates(fallback);
  return null;
}

function activityTypeIcon(type: string, TransIcon: any) {
  switch (type?.toLowerCase()) {
    case 'travel': case 'transport': return TransIcon;
    case 'accommodation': return Hotel;
    case 'meal': return Utensils;
    case 'leisure': return Coffee;
    case 'attraction': return Camera;
    default: return Activity;
  }
}

function typePillStyle(type: string) {
  switch (type?.toLowerCase()) {
    case 'transport':     return { bg: 'rgba(80,200,120,0.22)', color: '#50C878' };
    case 'accommodation': return { bg: 'rgba(56,189,248,0.22)', color: '#7dd3fc' };
    case 'meal':          return { bg: 'rgba(251,146,60,0.22)', color: '#fdba74' };
    case 'attraction':    return { bg: 'rgba(168,85,247,0.22)', color: '#d8b4fe' };
    case 'leisure':       return { bg: 'rgba(80,200,120,0.18)', color: '#6ee7b7' };
    default:              return { bg: 'rgba(209,242,235,0.12)',color: '#D1F2EB' };
  }
}

// ── Activity Row (Rendered Directly on Background — No heavy card box) ──────
function ActivityRow({
  activity,
  index,
  TransIcon,
  onVisible,
}: {
  activity: any;
  index: number;
  TransIcon: any;
  onVisible?: (tod: TimeOfDay) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const tod = determineTimeOfDay(activity);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        if (onVisible) onVisible(tod);
      }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [tod, onVisible]);

  const Icon  = activityTypeIcon(activity.type, TransIcon);
  const pill  = typePillStyle(activity.type);
  const hasCost = activity.cost != null && activity.cost > 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 24 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: 'easeOut' }}
      className="relative flex gap-5 py-3 group"
    >
      {/* Timeline indicator & vertical line */}
      <div className="flex flex-col items-center flex-shrink-0 w-9 pt-1">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all duration-300 group-hover:scale-110"
          style={{
            background: 'rgba(1, 50, 32, 0.75)',
            border: `1.5px solid ${C.emerald}`,
            boxShadow: '0 0 12px rgba(80, 200, 120, 0.25)',
          }}
        >
          <Icon className="h-4 w-4" style={{ color: C.emerald }} />
        </div>
        <div className="flex-1 w-px mt-2" style={{ background: 'linear-gradient(to bottom, rgba(80,200,120,0.4), rgba(80,200,120,0.08))', minHeight: 28 }} />
      </div>

      {/* Text placed directly on the background (no solid box) */}
      <div className="flex-1 pb-4 border-b border-white/[0.07] min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Meta Tags: Time & Category */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {activity.time && (
                <span
                  className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    fontSize: '0.68rem',
                    color: C.mint,
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <Clock className="h-3 w-3 text-emerald-400" /> {activity.time}
                </span>
              )}
              <span
                className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]"
                style={{ background: pill.bg, color: pill.color }}
              >
                {activity.type || 'Activity'}
              </span>
            </div>

            {/* Title directly on background */}
            <h4
              className="text-base font-semibold leading-snug tracking-tight text-white transition-colors group-hover:text-emerald-300"
              style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              {activity.title}
            </h4>

            {/* Description directly on background */}
            {activity.description && (
              <p
                className="text-xs leading-relaxed mt-1"
                style={{
                  color: C.textSub,
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}
              >
                {activity.description}
              </p>
            )}

            {activity.duration && (
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: C.textDim }}>
                <Clock className="h-2.5 w-2.5" /> {activity.duration}
              </p>
            )}
          </div>

          {/* Cost pill */}
          {hasCost && (
            <div
              className="shrink-0 text-right px-3 py-1.5 rounded-xl self-start"
              style={{
                background: 'rgba(80, 200, 120, 0.12)',
                border: '1px solid rgba(80, 200, 120, 0.25)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div className="font-bold text-xs" style={{ color: C.emerald }}>{formatINR(activity.cost)}</div>
              {activity.status && <div style={{ fontSize: '0.6rem', color: C.textDim, marginTop: 1 }}>{activity.status}</div>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Transit Animated Skyline ──────────────────────────────────────────────
function TransitSkyline() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <svg viewBox="0 0 900 180" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <path d="M0,90 Q225,65 450,90 T900,90" stroke="#50C878" strokeWidth="2.5" fill="none" strokeDasharray="10 6" />
        <path d="M0,110 Q225,85 450,110 T900,110" stroke="#D1F2EB" strokeWidth="1" fill="none" strokeDasharray="6 10" />
      </svg>
      <motion.div
        className="absolute bottom-3"
        style={{ left: '-80px' }}
        animate={{ x: ['0vw', '115vw'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 80 40" width="70" height="35" fill="none">
          <rect x="4" y="8" width="60" height="22" rx="4" fill="#0B6E4F" stroke="#50C878" strokeWidth="1.5"/>
          <rect x="10" y="12" width="12" height="9" rx="2" fill="#D1F2EB" opacity="0.6"/>
          <rect x="26" y="12" width="12" height="9" rx="2" fill="#D1F2EB" opacity="0.6"/>
          <circle cx="18" cy="34" r="3.5" fill="#50C878"/>
          <circle cx="48" cy="34" r="3.5" fill="#50C878"/>
        </svg>
      </motion.div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────
export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [activeDay, setActiveDay] = useState(1);
  const [isSavingDraft, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [fetchedPlan, setFetchedPlan] = useState<TripPlanData | null>(null);
  const [fetchedFormData, setFetchedFormData] = useState<any>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);

  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { tripPlan: statePlan, formData: stateFormData, arrivalInfo, destinationAttractions } = location.state || {};

  // ── Fetch Trip by ID if not in location.state ───────────────────────────
  useEffect(() => {
    if (statePlan) return; // Already passed via routing state
    if (!id) return;

    let isMounted = true;
    const fetchTripById = async () => {
      setIsLoadingTrip(true);
      try {
        const token = localStorage.getItem('accessToken');
        let res = await fetch(`/api/user/trips/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          // Fallback to public trip endpoint
          res = await fetch(`/api/trips/${id}`);
        }

        if (res.ok) {
          const data = await res.json();
          const trip = data.data || data.trip || data;
          if (trip && isMounted) {
            const rawPlan = trip.plans?.[0] || trip.selectedPlan || {};
            const total = rawPlan.costs?.total || trip.booking?.totalAmount || rawPlan.price || 0;

            const mappedPlan: TripPlanData = {
              id: trip._id || id,
              name: rawPlan.displayName || rawPlan.name || rawPlan.tier || 'Saved Itinerary',
              badge: rawPlan.badge || (trip.booking?.status === 'saved' ? 'Saved Draft' : 'Confirmed'),
              tier: rawPlan.tier || 'Comfort',
              rating: rawPlan.rating || 4.7,
              price: total,
              duration: rawPlan.duration || `${trip.nights || 1} nights`,
              breakdown: rawPlan.costs ? {
                transport: rawPlan.costs.transport || 0,
                accommodation: rawPlan.costs.accommodation || 0,
                activities: rawPlan.costs.activities || 0,
                meals: rawPlan.costs.meals || 0,
                misc: rawPlan.costs.miscellaneous || 0,
              } : rawPlan.breakdown || {},
              flight: rawPlan.transport ? { outbound: rawPlan.transport } : undefined,
              transport: rawPlan.transport,
              hotel: rawPlan.hotel,
              activities: rawPlan.activities || { list: [] },
              itinerary: trip.itinerary || rawPlan.itinerary || [],
            };

            const mappedFormData = {
              origin: trip.source?.name || trip.source?.code || trip.source || 'Origin',
              destination: trip.destination?.name || trip.destination?.code || trip.destination || 'Destination',
              departureDate: trip.startDate,
              returnDate: trip.endDate,
              travelers: trip.travelers || 1,
              tripType: trip.tripType || 'tour',
            };

            setFetchedPlan(mappedPlan);
            setFetchedFormData(mappedFormData);
          }
        } else {
          toast.error('Trip not found');
        }
      } catch (err) {
        console.error('Error fetching trip:', err);
        toast.error('Could not load saved trip');
      } finally {
        if (isMounted) setIsLoadingTrip(false);
      }
    };

    fetchTripById();
    return () => { isMounted = false; };
  }, [id, statePlan]);

  const plan = statePlan || fetchedPlan;
  const formData = stateFormData || fetchedFormData;

  // Callback when an activity enters viewport
  const handleActivityVisible = useCallback((tod: TimeOfDay) => {
    setTimeOfDay(tod);
  }, []);

  // ── Loading indicator ───────────────────────────────────────────────────
  if (isLoadingTrip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: C.bg }}>
        <Navigation />
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <p className="font-serif text-lg text-emerald-200">Retrieving your itinerary...</p>
        </div>
      </div>
    );
  }

  // ── No-plan fallback ──
  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.textMain }}>
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-8 mt-20 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4" style={{ color: C.mint }}>Trip not found</h1>
          <p className="mb-8 max-w-md" style={{ color: C.textSub }}>Please select or plan an itinerary from the planning page.</p>
          <button onClick={() => navigate('/plan-trip')}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm shadow-lg"
            style={{ background: C.emerald, color: C.bg }}>
            Plan a Trip <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const planArrivalInfo = plan.arrivalInfo || arrivalInfo;
  const isTrainTransport =
    plan.flight?.outbound?.mode === 'train' || plan.flight?.outbound?.type === 'train' ||
    plan.transport?.mode === 'train' || plan.transport?.type === 'train';
  const TransportIcon  = isTrainTransport ? Train : Plane;
  const transportLabel = isTrainTransport ? 'Train' : 'Flight';

  const fmtDur = (dur: any): string => {
    if (!dur) return '';
    if (typeof dur === 'object' && dur.hours !== undefined)
      return dur.minutes > 0 ? `${dur.hours}h ${dur.minutes}m` : `${dur.hours}h`;
    return typeof dur === 'string' ? dur : '';
  };

  // ── Build normalized itinerary days ────────────────────────────────────
  const buildDays = () => {
    const overnightCount = plan.breakdown?.overnightCount ?? 0;
    const usableDays = plan.breakdown?.usableDays ??
      (plan.breakdown?.nightsUsed != null ? plan.breakdown.nightsUsed + 1 : null);
    const expectedDays = usableDays != null ? overnightCount + usableDays : null;
    const hotelCostPerNight = (plan.hotel?.pricePerNight ?? 0) > 0 ? plan.hotel!.pricePerNight : null;

    const normActivity = (a: any) => {
      let cost: number | null = null;
      if (a.cost != null && a.cost > 0) cost = a.cost;
      else if (a.price != null && a.price > 0) cost = a.price;
      else if (a.type === 'accommodation' && /check-?in/i.test(a.activity || a.title || a.name || '') && hotelCostPerNight)
        cost = hotelCostPerNight;
      else if (a.type === 'meal') {
        const t = (a.activity || a.name || '').toLowerCase();
        if (t.includes('breakfast')) cost = 200;
        else if (t.includes('lunch')) cost = 300;
        else if (t.includes('dinner')) cost = 500;
      }
      return {
        time: a.time || a.timeSlot || '',
        type: a.type || 'activity',
        title: a.activity || a.name || a.title || 'Activity',
        description: a.description || '',
        duration: a.duration || '',
        cost,
        status: a.costLabel || '',
      };
    };

    const normalize = (days: any[]) => days.map((day: any) => ({
      day: day.day,
      date: day.date || '',
      title: day.title || `Day ${day.day}`,
      isTransit: (day.title || '').toLowerCase().includes('transit'),
      activities: (day.activities || []).map(normActivity).filter((a: any) => a.title),
    }));

    if (plan.itinerary && plan.itinerary.length > 0 &&
        (expectedDays === null || plan.itinerary.length === expectedDays)) {
      return normalize(plan.itinerary);
    }

    // Fallback synthesis
    const tName = plan.flight?.outbound?.airline || plan.flight?.outbound?.name || plan.transport?.name || transportLabel;
    const src = formData?.origin || plan.flight?.outbound?.departure || 'Origin';
    const dst = formData?.destination || plan.flight?.outbound?.arrival || 'Destination';
    const depTime = plan.flight?.outbound?.departureTime || planArrivalInfo?.departureTime || '09:00';
    const arrTime = plan.flight?.outbound?.arrivalTime  || planArrivalInfo?.arrivalTime   || '12:00';
    const dur = fmtDur(plan.flight?.outbound?.duration) || '2h';
    const durationStr = typeof plan.duration === 'string' ? plan.duration : String(plan.duration || '3');
    const totalDays = (usableDays ?? parseInt(durationStr.match(/\d+/)?.[0] || '3')) + overnightCount;
    const days: any[] = [];

    for (let d = 1; d <= totalDays; d++) {
      if (d <= overnightCount) {
        days.push({ day: d, date: '', title: `Day ${d} — In Transit`, isTransit: true, activities: [
          { time: d === 1 ? depTime : 'All day', type: 'transport', title: `${tName}: ${src} → ${dst}`, description: `Duration: ${dur} • Journey begins`, duration: dur, cost: d === 1 ? (plan.breakdown?.transport || null) : null, status: '' },
          { time: 'Night', type: 'travel', title: 'In transit', description: `Resting on ${transportLabel.toLowerCase()}`, duration: '', cost: null, status: '' },
        ]});
        continue;
      }
      const di = d - overnightCount;
      const isFirst = di === 1;
      const isLast  = di === (usableDays ?? totalDays - overnightCount);
      const checkin = plan.hotel ? [{ time: '14:00', type: 'accommodation', title: 'Hotel Check-in', description: plan.hotel.name || '', duration: '', cost: hotelCostPerNight, status: hotelCostPerNight ? 'Per Night' : '' }] : [];
      const checkout = plan.hotel ? [{ time: '10:00', type: 'accommodation', title: 'Hotel Check-out', description: '', duration: '', cost: null, status: '' }] : [];

      if (isFirst && isLast) {
        days.push({ day: d, date: '', title: overnightCount > 0 ? 'Arrival & Departure' : 'Arrival Day', isTransit: false, activities: [
          ...(overnightCount === 0 ? [{ time: depTime, type: 'transport', title: `${tName}: ${src} → ${dst}`, description: `Duration: ${dur}`, duration: dur, cost: plan.breakdown?.transport ?? null, status: '' }] : []),
          ...(overnightCount > 0  ? [{ time: arrTime, type: 'travel', title: `Arrive at ${dst}`, description: '', duration: '', cost: null, status: '' }] : []),
          ...checkin, ...checkout,
        ]});
      } else if (isFirst) {
        days.push({ day: d, date: '', title: 'Arrival Day', isTransit: false, activities: [
          ...(overnightCount === 0 ? [{ time: depTime, type: 'transport', title: `${tName}: ${src} → ${dst}`, description: `Duration: ${dur}`, duration: dur, cost: plan.breakdown?.transport ?? null, status: '' }] : [{ time: arrTime, type: 'travel', title: `Arrive at ${dst}`, description: '', duration: '', cost: null, status: '' }]),
          ...checkin,
          { time: '17:00', type: 'leisure', title: 'Explore local neighborhood', description: 'Take a relaxed stroll around the city center', duration: '', cost: null, status: '' },
          { time: '19:30', type: 'meal', title: 'Welcome Dinner', description: 'Traditional regional cuisine', duration: '', cost: 500, status: '' },
        ]});
      } else if (isLast) {
        days.push({ day: d, date: '', title: 'Departure Day', isTransit: false, activities: [
          { time: '08:30', type: 'meal', title: 'Breakfast', description: '', duration: '', cost: 200, status: '' },
          ...checkout,
          { time: '11:00', type: 'leisure', title: 'Souvenir shopping & coffee', description: '', duration: '', cost: null, status: '' },
          { time: '18:00', type: 'transport', title: `${tName}: ${dst} → ${src}`, description: 'Return journey', duration: dur, cost: null, status: '' },
        ]});
      } else {
        days.push({ day: d, date: '', title: `Day ${d} — Explore ${dst}`, isTransit: false, activities: [
          { time: '08:30', type: 'meal', title: 'Breakfast', description: 'Energizing morning start', duration: '', cost: 200, status: '' },
          { time: '10:00', type: 'attraction', title: `Iconic sites of ${dst}`, description: `Guided discovery of historical landmarks`, duration: '3 hours', cost: null, status: '' },
          { time: '13:00', type: 'meal', title: 'Lunch', description: 'Local cafe stop', duration: '', cost: 300, status: '' },
          { time: '15:30', type: 'leisure', title: 'Scenic wander & relaxation', description: '', duration: '2 hours', cost: null, status: '' },
          { time: '19:30', type: 'meal', title: 'Evening Dinner', description: 'Culinary highlights', duration: '', cost: 500, status: '' },
          { time: '21:30', type: 'leisure', title: 'Stargazing / Night walk', description: 'Peaceful night ambiance', duration: '', cost: null, status: '' },
        ]});
      }
    }
    return days;
  };

  const itineraryDays = buildDays();

  // ── Map Route & Pins ──────────────────────────────────────────────────
  const outboundAny: any = plan.flight?.outbound || {};
  const originCoords      = resolveCoordinates(outboundAny.departure, formData?.origin);
  const destinationCoords = resolveCoordinates(outboundAny.arrival,   formData?.destination);
  let trainPaths:  [number, number][][] = [];
  let flightPaths: [number, number][][] = [];

  try {
    if (isTrainTransport) {
      const originName = typeof formData?.origin === 'string' ? formData.origin : '';
      const dest = typeof formData?.destination === 'string' ? formData.destination : '';
      const corridors = originName && dest ? getRailwayCorridors(originName, dest) : null;
      if (corridors && corridors.length > 0) trainPaths = corridors;
      else if (Array.isArray(outboundAny.routePath) && outboundAny.routePath.length > 1) trainPaths = [outboundAny.routePath];
      else if (originCoords && destinationCoords) trainPaths = [[originCoords, destinationCoords]];
    } else if (originCoords && destinationCoords) {
      flightPaths = [arcPath(originCoords, destinationCoords)];
    }
  } catch {
    trainPaths = [];
    flightPaths = [];
  }

  const topActivities = Array.isArray(plan.activities?.list) ? plan.activities.list.slice(0, 4) : [];
  let selectedPlaceNames: string[] = [];
  try {
    if (Array.isArray(formData?.selectedPlaceNames)) {
      selectedPlaceNames = formData.selectedPlaceNames.filter((n: unknown) => typeof n === 'string' && n);
    } else if (Array.isArray(formData?.selectedPlaces) && formData.selectedPlaces.every((x: any) => typeof x === 'string')) {
      const attractions = Array.isArray(destinationAttractions) ? destinationAttractions : [];
      selectedPlaceNames = attractions
        .filter((a: any) => formData.selectedPlaces.includes(a.id))
        .map((a: any) => a.name)
        .filter((n: unknown) => typeof n === 'string' && n);
    }
  } catch {
    selectedPlaceNames = [];
  }

  const destName = typeof formData?.destination === 'string' ? formData.destination : '';
  const placePins = scatterPlacesInCity(destName, selectedPlaceNames);
  const showPlacesMap = placePins.length > 0;

  const bd = plan.breakdown || {};
  const breakdown = [
    { label: 'Transport',     val: bd.transport || 0 },
    { label: 'Accommodation', val: bd.accommodation || 0 },
    { label: 'Activities',    val: bd.activities || 0 },
    { label: 'Meals',         val: bd.meals || 0 },
    { label: 'Misc',          val: bd.misc || 0 },
  ].filter(x => x.val > 0)
   .map(x => ({ ...x, pct: plan.price > 0 ? Math.round((x.val / plan.price) * 100) : 0 }));

  // ── Actions ───────────────────────────────────────────────────────────
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Trip link copied to clipboard!');
  };

  const handleDownload = () => {
    printItinerary({
      title: `${plan.name} (${plan.badge})`,
      origin: formData?.origin || 'Origin',
      destination: formData?.destination || 'Destination',
      dates: `${formData?.departureDate || ''} – ${formData?.returnDate || ''}`,
      duration: plan.duration,
      travelers: formData?.travelers || 1,
      totalCost: formatINR(plan.price),
      breakdown: [
        { label: 'Transport',      amount: formatINR(plan.breakdown.transport) },
        { label: 'Accommodation',  amount: formatINR(plan.breakdown.accommodation) },
        { label: 'Activities',     amount: formatINR(plan.breakdown.activities) },
        { label: 'Meals',          amount: formatINR(plan.breakdown.meals) },
        { label: 'Miscellaneous',  amount: formatINR(plan.breakdown.misc) },
      ],
      hotel: plan.hotel,
      transport: { mode: transportLabel, operator: outboundAny.airline || outboundAny.name, departure: outboundAny.departureTime, arrival: outboundAny.arrivalTime, class: outboundAny.class },
      days: itineraryDays.map(d => ({ day: d.day, title: d.title, date: d.date, activities: d.activities.map((a: any) => ({ time: a.time, title: a.title, description: a.description, cost: a.cost != null ? formatINR(a.cost) : '' })) })),
    });
    toast.success('Opening printable itinerary...');
  };

  const handleSaveTrip = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save this trip');
      navigate('/login', { state: { from: location.pathname, tripPlan: plan, formData } });
      return;
    }
    setIsSaving(true);
    try {
      await tripsAPI.saveTrip({ plan, formData });
      toast.success('Trip saved to your library!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save trip.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!id) return;
    if (!window.confirm('Delete this trip? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/user/trips/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Trip deleted');
        navigate('/saved-trips');
      } else {
        toast.error('Failed to delete trip');
      }
    } catch {
      toast.error('Failed to delete trip');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book this trip');
      navigate('/login', { state: { from: location.pathname, tripPlan: plan, formData } });
      return;
    }
    navigate('/booking-confirmation', { state: { tripPlan: plan, formData } });
  };

  const scrollToDay = (dayNum: number) => {
    setActiveDay(dayNum);
    dayRefs.current[dayNum - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen font-sans"
      style={{ background: '#011c12', color: C.textMain }}
    >
      {/* ── Dynamic Atmospheric Weather & Day/Night Background ──────────────── */}
      <AtmosphericWeatherBackground
        timeOfDay={timeOfDay}
        cityName={formData?.destination}
      />

      {/* Nav */}
      <div className="fixed top-0 inset-x-0 z-40"><Navigation /></div>

      {/* ── Two-Column Layout ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen pt-16">

        {/* ── LEFT: Dynamic Day Journey with Direct Text ──────────────────── */}
        <div
          className="min-w-0 flex-1 overflow-y-auto px-4 md:px-10 py-6"
          style={{
            maxHeight: 'calc(100vh - 64px)',
            scrollbarWidth: 'thin',
            scrollbarColor: `${C.teal} transparent`,
          }}
        >
          {/* Header & Breadcrumb */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pt-4 pb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-emerald-400"
              style={{ color: C.emerald }}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
                    style={{ background: 'rgba(80,200,120,0.18)', color: C.emerald }}
                  >
                    <MapPin className="h-3 w-3" /> {formData?.origin} → {formData?.destination}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
                    style={{ background: 'rgba(255,255,255,0.1)', color: C.mint }}
                  >
                    {plan.badge || 'Curated Itinerary'}
                  </span>
                </div>
                <h1
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.15,
                    textShadow: '0 2px 12px rgba(0,0,0,0.7)',
                  }}
                >
                  {plan.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs" style={{ color: C.textSub }}>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-emerald-400" /> {formData?.travelers || 1} Traveller{(formData?.travelers || 1) > 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-emerald-400" /> {plan.duration}</span>
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {typeof plan.rating === 'number' ? plan.rating.toFixed(1) : '4.8'}</span>
                </div>
              </div>

              {/* Total & Action Bar */}
              <div className="flex flex-col md:items-end gap-3">
                <div className="text-left md:text-right">
                  <div style={{ fontSize: '0.65rem', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Experience</div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontWeight: 800, color: C.emerald, textShadow: '0 2px 10px rgba(80,200,120,0.3)' }}>
                    {formatINR(plan.price)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: C.mint }}>
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </button>
                  <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: C.mint }}>
                    <Download className="h-3.5 w-3.5" /> Export PDF
                  </button>
                  {id && (
                    <button onClick={handleDeleteTrip} disabled={isDeleting} className="p-2 rounded-full text-rose-400 hover:bg-rose-500/20 transition-all border border-rose-500/30">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Atmosphere Weather Visual Controller Pill */}
            <div className="flex items-center justify-between p-2 rounded-2xl mb-6 backdrop-blur-md"
              style={{ background: 'rgba(1, 50, 32, 0.55)', border: `1px solid ${C.cardBorder}` }}>
              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Atmosphere</span>
                <span className="text-xs opacity-60">• Changes dynamically as you scroll</span>
              </div>
              <div className="flex gap-1">
                {[
                  { id: 'morning', label: 'Sunrise', icon: Sunrise },
                  { id: 'afternoon', label: 'Day', icon: Sun },
                  { id: 'evening', label: 'Dusk', icon: Sunset },
                  { id: 'night', label: 'Night', icon: Moon },
                ].map(item => {
                  const Icon = item.icon;
                  const active = timeOfDay === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTimeOfDay(item.id as TimeOfDay)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: active ? C.emerald : 'transparent',
                        color: active ? '#013220' : C.textSub,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" /> {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Selector Navigation Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {itineraryDays.map(d => (
                <button
                  key={d.day}
                  onClick={() => scrollToDay(d.day)}
                  className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                  style={{
                    background: activeDay === d.day ? C.emerald : 'rgba(1, 50, 32, 0.65)',
                    color:      activeDay === d.day ? '#013220' : C.mint,
                    border:     `1px solid ${activeDay === d.day ? C.emerald : C.cardBorder}`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Day {d.day}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Itinerary Days Timeline (Text directly on Background) ───────── */}
          <div className="space-y-12 pb-32">
            {itineraryDays.map((day, idx) => (
              <div
                key={day.day}
                ref={el => { dayRefs.current[idx] = el; }}
                className="relative pt-4"
              >
                {day.isTransit && <TransitSkyline />}

                {/* Day Header floating on background */}
                <div className="flex items-center gap-3.5 mb-5 pb-2 border-b border-white/10">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg"
                    style={{
                      background: C.emerald,
                      color: '#013220',
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '1rem',
                    }}
                  >
                    {day.day}
                  </div>
                  <div>
                    <h3
                      className="font-bold text-xl tracking-tight text-white"
                      style={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      }}
                    >
                      {day.title}
                    </h3>
                    {day.date && <p className="text-xs text-emerald-300 font-medium">{day.date}</p>}
                  </div>
                  {day.isTransit && (
                    <span className="ml-auto px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Transit Leg
                    </span>
                  )}
                </div>

                {/* Day Activities floating directly on background */}
                <div className="space-y-1 pl-1">
                  {day.activities.map((activity: any, aIdx: number) => (
                    <ActivityRow
                      key={`${day.day}-${aIdx}`}
                      activity={activity}
                      index={aIdx}
                      TransIcon={TransportIcon}
                      onVisible={handleActivityVisible}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Map & Executive Details Sidebar ─────────────────────── */}
        <div
          className="hidden lg:flex flex-col w-[clamp(380px,40vw,480px)] shrink-0 overflow-y-auto backdrop-blur-xl"
          style={{
            maxHeight: 'calc(100vh - 64px)',
            background: 'rgba(1, 35, 23, 0.82)',
            borderLeft: `1px solid ${C.cardBorder}`,
            scrollbarWidth: 'thin',
            scrollbarColor: `${C.teal} transparent`,
          }}
        >
          <div className="p-6 space-y-6">

            {/* Destination Place Map (or City Scatter Map) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <MapPin className="h-4 w-4" /> {formData?.destination} Exploration Map
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Interactive</span>
              </div>
              <PlacesMap
                places={placePins.length > 0 ? placePins : [
                  { name: `${formData?.destination || 'Destination'} Center`, coords: destinationCoords || [28.6139, 77.2090] },
                ]}
                cityLabel={formData?.destination}
              />
              {placePins.length > 0 && (
                <div className="mt-3 space-y-1 max-h-24 overflow-y-auto text-xs" style={{ scrollbarWidth: 'thin' }}>
                  {placePins.map((p, i) => (
                    <div key={p.name} className="text-xs text-emerald-100 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booking Action Card */}
            <div
              className="rounded-3xl p-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(11,110,79,0.35) 0%, rgba(1,50,32,0.6) 100%)',
                border: `1.5px solid ${C.cardBorder}`,
              }}
            >
              <div className="text-[11px] uppercase tracking-wider text-emerald-300/80 font-semibold mb-1">Trip Investment</div>
              <div className="text-3xl font-extrabold text-white mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                {formatINR(plan.price)}
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleBookNow}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                  style={{ background: C.emerald, color: '#013220' }}
                >
                  <CreditCard className="h-4 w-4" /> Confirm & Book Trip
                </button>
                <button
                  onClick={handleSaveTrip}
                  disabled={isSavingDraft}
                  className="w-full py-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:bg-emerald-500/20"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: C.mint,
                    border: `1px solid ${C.cardBorder}`,
                  }}
                >
                  {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                  {isSavingDraft ? 'Saving to account...' : 'Save to My Trips'}
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="rounded-3xl p-6" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300 mb-4">
                <IndianRupee className="h-4 w-4" /> Comprehensive Cost Breakdown
              </div>
              <div className="space-y-3.5">
                {breakdown.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-emerald-200">{item.label}</span>
                      <span className="text-white font-bold">{formatINR(item.val)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.pct}%`,
                          background: `linear-gradient(to right, ${C.teal}, ${C.emerald})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transport Details */}
            <div className="rounded-3xl p-6" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300 mb-3">
                <TransportIcon className="h-4 w-4" /> {transportLabel} Journey Overview
              </div>
              <h4 className="font-bold text-white text-sm mb-1">
                {outboundAny.airline || outboundAny.name || `${transportLabel} Express`}
              </h4>
              <p className="text-xs text-emerald-200/80 mb-2">
                {outboundAny.departure || formData?.origin} → {outboundAny.arrival || formData?.destination}
              </p>
              <div className="flex items-center gap-3 text-xs text-emerald-300/60 pt-2 border-t border-white/10">
                <span>Class: {outboundAny.class || 'Comfort'}</span>
                <span>•</span>
                <span>{outboundAny.duration ? fmtDur(outboundAny.duration) : 'Standard schedule'}</span>
              </div>
            </div>

            {/* Accommodation Details */}
            {plan.hotel && (
              <div className="rounded-3xl p-6" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300 mb-3">
                  <Hotel className="h-4 w-4" /> Selected Stay
                </div>
                <h4 className="font-bold text-white text-sm">{plan.hotel.name || 'Verified Hotel'}</h4>
                <div className="flex items-center gap-1 my-1.5">
                  {[...Array(Math.max(1, Math.min(5, Math.round(Number(plan.hotel.stars) || 3))))].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-xs text-emerald-200/70 ml-1.5">{plan.hotel.location || formData?.destination}</span>
                </div>
                {(plan.hotel.pricePerNight ?? 0) > 0 && (
                  <p className="text-xs font-semibold text-emerald-300 mt-2">
                    {formatINR(plan.hotel.pricePerNight!)} / night
                  </p>
                )}
              </div>
            )}

            {/* 24x7 Support */}
            <div className="rounded-3xl p-5" style={{ background: 'rgba(80,200,120,0.06)', border: `1px solid ${C.cardBorder}` }}>
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-300 mb-2">
                <ShieldAlert className="h-4 w-4" /> 24x7 Traveler Support
              </div>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Concierge desk available 24/7. Digital vouchers and real-time transit updates included with every booked trip.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 lg:hidden z-50 p-4 backdrop-blur-xl" style={{ background: 'rgba(1, 40, 26, 0.92)', borderTop: `1px solid ${C.cardBorder}` }}>
        <button
          onClick={handleBookNow}
          className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
          style={{ background: C.emerald, color: '#013220' }}
        >
          <CreditCard className="h-4 w-4" /> Book Trip • {formatINR(plan.price)}
        </button>
      </div>
    </motion.div>
  );
}
