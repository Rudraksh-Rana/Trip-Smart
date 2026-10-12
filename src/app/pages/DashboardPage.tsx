import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass, TrendingUp, Sparkles, Calendar, Plane, Train, MapPin,
  IndianRupee, ArrowRight, ShieldCheck, Zap, Activity, Clock,
  ChevronRight, RefreshCw, Layers, Award, BarChart3, Bookmark
} from 'lucide-react';
import { formatINR, tripsAPI } from '../../services/api';

// ── Color Palette ────────────────────────────────────────────────────────
const C = {
  bg:         '#011e13',
  surface:    'rgba(1, 35, 23, 0.75)',
  surfaceHi:  'rgba(11, 75, 52, 0.45)',
  teal:       '#0B6E4F',
  emerald:    '#50C878',
  mint:       '#D1F2EB',
  cardBorder: 'rgba(80, 200, 120, 0.16)',
  textMain:   '#ffffff',
  textSub:    'rgba(209, 242, 235, 0.72)',
  textDim:    'rgba(209, 242, 235, 0.45)',
};

// ── Verified Destination Photography with Fallbacks ────────────────────────
const DESTINATION_MEDIA: Record<string, { img: string; state: string; season: string; budget: string }> = {
  jaipur: {
    img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    state: 'Rajasthan',
    season: 'Oct – Mar',
    budget: '₹8k – 18k',
  },
  goa: {
    img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    state: 'Goa',
    season: 'Nov – Feb',
    budget: '₹12k – 25k',
  },
  manali: {
    img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    state: 'Himachal Pradesh',
    season: 'Year-round',
    budget: '₹14k – 28k',
  },
  kerala: {
    img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    state: 'Kerala',
    season: 'Sep – Mar',
    budget: '₹15k – 32k',
  },
  ladakh: {
    img: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
    state: 'Ladakh',
    season: 'May – Sep',
    budget: '₹22k – 45k',
  },
  udaipur: {
    img: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
    state: 'Rajasthan',
    season: 'Oct – Mar',
    budget: '₹11k – 24k',
  },
  varanasi: {
    img: 'https://images.unsplash.com/photo-1561361058-c24e01238a46?auto=format&fit=crop&w=800&q=80',
    state: 'Uttar Pradesh',
    season: 'Oct – Mar',
    budget: '₹6k – 14k',
  },
  ooty: {
    img: 'https://images.unsplash.com/photo-1598901847919-b0e9be6c62db?auto=format&fit=crop&w=800&q=80',
    state: 'Tamil Nadu',
    season: 'Mar – Jun',
    budget: '₹9k – 20k',
  },
};

function getDestinationPhoto(city: string): string {
  const normalized = String(city || '').toLowerCase().trim();
  for (const [key, val] of Object.entries(DESTINATION_MEDIA)) {
    if (normalized.includes(key)) return val.img;
  }
  return 'https://images.unsplash.com/photo-1477587458883-47145ed6979c?auto=format&fit=crop&w=800&q=80';
}

// ── Real Routes for Fare Radar ──────────────────────────────────────────
const POPULAR_ROUTES = [
  { label: 'Delhi → Goa',     from: 'DEL', to: 'GOI', mode: 'flight', price: 5200, trend: 'rising', pct: '+4.2%' },
  { label: 'Mumbai → Goa',    from: 'BOM', to: 'GOI', mode: 'flight', price: 4100, trend: 'stable', pct: '0.0%' },
  { label: 'Delhi → Jaipur',  from: 'DEL', to: 'JAI', mode: 'train',  price: 550,  trend: 'stable', pct: '-1.0%' },
  { label: 'Bengaluru → Goa', from: 'BLR', to: 'GOI', mode: 'flight', price: 4800, trend: 'rising', pct: '+6.1%' },
  { label: 'Mumbai → Pune',   from: 'BOM', to: 'PNQ', mode: 'train',  price: 220,  trend: 'stable', pct: '0.0%' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(POPULAR_ROUTES[0]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [budgetSlider, setBudgetSlider] = useState<number>(6000);
  const [budgetBreakdown, setBudgetBreakdown] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Time greeting
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // ── Fetch Core Dashboard Data ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const tripsRes = await fetch('/api/user/trips', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const tripsData = tripsRes.ok ? await tripsRes.json() : { data: [] };
      const trips = tripsData.data || [];
      setSavedTrips(trips);

      // Recommendations
      try {
        const rec = await tripsAPI.getRecommendations();
        setRecommendations(rec.data || []);
      } catch {
        setRecommendations([]);
      }

      // Alternatives from first trip or dummy plan
      try {
        const planForAlts = trips[0] || {
          destination: { name: 'Goa' }, source: { name: 'Mumbai' }, travelers: 2,
        };
        const altRes = await fetch('http://127.0.0.1:8001/alternatives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_plan: planForAlts }),
        });
        if (altRes.ok) {
          const d = await altRes.json();
          setAlternatives(d.recommendations || []);
        }
      } catch {
        setAlternatives([]);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Query Price Forecast on Selected Route ─────────────────────────────
  useEffect(() => {
    const queryForecast = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8001/price-forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_price: selectedRoute.price,
            departure_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            transport_mode: selectedRoute.mode,
          }),
        });
        if (res.ok) {
          const d = await res.json();
          setForecastData(d);
        }
      } catch {
        setForecastData(null);
      }
    };
    queryForecast();
  }, [selectedRoute]);

  // ── Query Q-Learning Budget Allocation ──────────────────────────────────
  useEffect(() => {
    const queryBudget = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8001/budget-allocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            remaining_budget: budgetSlider,
            context: { days: 4, tier: 'comfort' },
          }),
        });
        if (res.ok) {
          const d = await res.json();
          setBudgetBreakdown(d.allocations);
        }
      } catch {
        setBudgetBreakdown(null);
      }
    };
    queryBudget();
  }, [budgetSlider]);

  const totalSaved = savedTrips.length;
  const totalSpend = savedTrips.reduce((s, t) => s + (t.selectedPlan?.totalCost || 0), 0);

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: C.bg, color: C.textMain }}
    >
      <Navigation />

      {/* ── Executive Hero Header ────────────────────────────────────────── */}
      <div className="relative pt-24 pb-10 px-4 md:px-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Executive Travel Command Center
              </span>
            </div>
            <h1
              className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {greeting}, {user?.name?.split(' ')[0] || 'Traveller'}
            </h1>
            <p className="text-sm max-w-xl" style={{ color: C.textSub }}>
              Real-time fare intelligence, algorithmic itinerary synthesis, and smart post-trip budget optimization.
            </p>
          </div>

          {/* Quick Hub Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/plan-trip')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-transform active:scale-95 shadow-lg"
              style={{ background: C.emerald, color: '#01281a' }}
            >
              <Compass className="w-4 h-4" /> Plan New Journey
            </button>
            <button
              onClick={() => { setIsRefreshing(true); fetchData().finally(() => setIsRefreshing(false)); }}
              className="p-3 rounded-2xl border border-white/10 hover:bg-white/5 transition-all text-emerald-300"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Metric Highlights ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            className="rounded-3xl p-5 backdrop-blur-md"
            style={{ background: C.surface, border: `1px solid ${C.cardBorder}` }}
          >
            <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-2">
              <span>Saved Itineraries</span>
              <Bookmark className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
              {totalSaved}
            </div>
            <p className="text-[11px] text-emerald-200/60 mt-1">Ready for departure</p>
          </div>

          <div
            className="rounded-3xl p-5 backdrop-blur-md"
            style={{ background: C.surface, border: `1px solid ${C.cardBorder}` }}
          >
            <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-2">
              <span>Portfolio Spend</span>
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
              {totalSpend > 0 ? formatINR(totalSpend) : '₹0'}
            </div>
            <p className="text-[11px] text-emerald-200/60 mt-1">Curated journey value</p>
          </div>

          <div
            className="rounded-3xl p-5 backdrop-blur-md"
            style={{ background: C.surface, border: `1px solid ${C.cardBorder}` }}
          >
            <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-2">
              <span>ML Engine</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-300" style={{ fontFamily: '"Playfair Display", serif' }}>
              Active
            </div>
            <p className="text-[11px] text-emerald-200/60 mt-1">XGBoost & Q-Learning live</p>
          </div>

          <div
            className="rounded-3xl p-5 backdrop-blur-md"
            style={{ background: C.surface, border: `1px solid ${C.cardBorder}` }}
          >
            <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-2">
              <span>Next Travel Window</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
              Weekend
            </div>
            <p className="text-[11px] text-emerald-200/60 mt-1">Optimal booking period</p>
          </div>
        </div>

        {/* ── Main Layout: 2 Columns ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">

          {/* ── LEFT COLUMN (2/3): Saved Trips & Trending Escapes ───────── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Saved Trips Section with Real Pictures */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight text-white"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                  >
                    Your Saved Expeditions
                  </h2>
                  <p className="text-xs" style={{ color: C.textSub }}>
                    Full itinerary drafts saved to your profile
                  </p>
                </div>
                <Link
                  to="/saved-trips"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  View all ({totalSaved}) <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-56 rounded-3xl animate-pulse bg-white/5 border border-white/10" />
                  ))}
                </div>
              ) : savedTrips.length === 0 ? (
                <div
                  className="rounded-3xl p-8 text-center border border-dashed border-emerald-500/30 backdrop-blur-sm"
                  style={{ background: 'rgba(1, 40, 26, 0.4)' }}
                >
                  <Compass className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-80" />
                  <h3 className="text-base font-bold text-white mb-1">No trips saved yet</h3>
                  <p className="text-xs text-emerald-200/70 max-w-sm mx-auto mb-5">
                    Plan your next getaway in seconds with our multi-tier algorithm.
                  </p>
                  <button
                    onClick={() => navigate('/plan-trip')}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-all"
                  >
                    Generate a Trip
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {savedTrips.slice(0, 4).map((trip) => {
                    const destCity = trip.destination || 'Destination';
                    const photo = getDestinationPhoto(destCity);
                    const cost = trip.selectedPlan?.totalCost || 0;

                    return (
                      <motion.div
                        key={trip._id}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => navigate(`/saved-trips/${trip._id}`)}
                        className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-lg border border-white/10"
                        style={{ background: '#01261a' }}
                      >
                        {/* High-res destination photo */}
                        <div className="h-40 w-full relative overflow-hidden">
                          <img
                            src={photo}
                            alt={destCity}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              // Reliable fallback
                              (e.target as HTMLImageElement).src = DESTINATION_MEDIA.goa.img;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#01261a] via-[#01261a]/40 to-transparent" />
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-emerald-300 border border-white/10">
                            {trip.selectedPlan?.tier || 'Curated'}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 -mt-4 relative z-10">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                                <MapPin className="w-3.5 h-3.5" /> {trip.source} → {trip.destination}
                              </div>
                              <h4 className="text-base font-bold text-white mt-1">
                                {destCity} Expedition
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-emerald-300">
                                {formatINR(cost)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-emerald-200/60">
                            <span>{trip.travelers || 1} Traveller{(trip.travelers || 1) > 1 ? 's' : ''}</span>
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                              View Itinerary <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trending Indian Escapes Gallery */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight text-white"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                  >
                    Trending Indian Destinations
                  </h2>
                  <p className="text-xs" style={{ color: C.textSub }}>
                    Verified photography & seasonal budget estimates
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(DESTINATION_MEDIA).slice(0, 8).map(([cityKey, info]) => {
                  const cityName = cityKey.charAt(0).toUpperCase() + cityKey.slice(1);
                  return (
                    <motion.div
                      key={cityKey}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => navigate('/plan-trip')}
                      className="group relative rounded-3xl overflow-hidden cursor-pointer aspect-[3/4] shadow-md border border-white/10"
                    >
                      <img
                        src={info.img}
                        alt={cityName}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DESTINATION_MEDIA.jaipur.img;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                      <div className="absolute bottom-0 inset-x-0 p-3.5">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          {info.state}
                        </span>
                        <h4 className="text-base font-bold text-white leading-tight">
                          {cityName}
                        </h4>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-200">
                          <span>{info.season}</span>
                          <span className="font-bold text-emerald-300">{info.budget}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (1/3): ML Fare Radar & Q-Learning Studio ──── */}
          <div className="space-y-6">

            {/* 1. Live XGBoost Fare Trend Radar */}
            <div
              className="rounded-3xl p-6 backdrop-blur-xl border border-white/10"
              style={{ background: C.surface }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Fare Intelligence Radar</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  XGBoost
                </span>
              </div>

              {/* Route Selector Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4">
                {POPULAR_ROUTES.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setSelectedRoute(r)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: selectedRoute.label === r.label ? C.emerald : 'rgba(255,255,255,0.06)',
                      color: selectedRoute.label === r.label ? '#01281a' : C.mint,
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Active Route Forecast Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                      {selectedRoute.mode.toUpperCase()} ROUTE
                    </span>
                    <h4 className="text-xl font-bold text-white mt-0.5">
                      {formatINR(selectedRoute.price)}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      selectedRoute.trend === 'rising' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {selectedRoute.trend === 'rising' ? '↑ Rising' : '→ Stable'}
                    </span>
                    <p className="text-[10px] text-emerald-200/60 mt-1">{selectedRoute.pct} 7d projected</p>
                  </div>
                </div>

                {forecastData && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs">
                    <p className="text-emerald-200/90 leading-relaxed font-medium">
                      💡 {forecastData.message}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-[11px] text-emerald-400 font-semibold">
                      <span>Recommendation:</span>
                      <span className="uppercase">{forecastData.recommendation?.replace('_', ' ')}</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-emerald-200/60 leading-relaxed">
                Trained on Indian peak-season booking curves & least-squares fare slopes.
              </p>
            </div>

            {/* 2. Interactive Q-Learning Budget Allocator Studio */}
            <div
              className="rounded-3xl p-6 backdrop-blur-xl border border-white/10"
              style={{ background: C.surface }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Post-Booking Budget AI</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                  Q-Learning RL
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-emerald-200">Discretionary Fund:</span>
                  <span className="font-bold text-white text-sm">{formatINR(budgetSlider)}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="25000"
                  step="1000"
                  value={budgetSlider}
                  onChange={(e) => setBudgetSlider(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Real-time category allocation */}
              {budgetBreakdown && (
                <div className="space-y-3">
                  {[
                    { key: 'experience', label: 'Experiences & Activities', color: '#f59e0b' },
                    { key: 'local_transport', label: 'Local City Mobility', color: '#38bdf8' },
                    { key: 'meals', label: 'Regional Dining', color: '#10b981' },
                    { key: 'stay_upgrade', label: 'Stay Upgrades', color: '#a855f7' },
                  ].map(cat => {
                    const amount = budgetBreakdown[cat.key] || 0;
                    const pct = Math.round((amount / budgetSlider) * 100);
                    return (
                      <div key={cat.key} className="text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-emerald-200/80">{cat.label}</span>
                          <span className="font-bold text-white">{formatINR(amount)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, background: cat.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Concierge Trust Badge */}
            <div
              className="rounded-3xl p-5 border border-emerald-500/20 flex items-start gap-3.5"
              style={{ background: 'rgba(80, 200, 120, 0.06)' }}
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">TripSmart Guarantee</h4>
                <p className="text-[11px] text-emerald-200/70 leading-relaxed">
                  Every synthesized route cross-references official railway tables, domestic airline inventory, and verified guest reviews.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
