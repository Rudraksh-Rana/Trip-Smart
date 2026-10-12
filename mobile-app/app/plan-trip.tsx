import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { generateTripPlans, formatINR } from '../src/services/api';
import { tripStore } from '../src/store/tripStore';

const POPULAR_DESTINATIONS = ['Goa', 'Jaipur', 'Manali', 'Kerala', 'Ladakh', 'Udaipur'];
const POPULAR_ORIGINS = ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Hyderabad'];

export default function PlanTripScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [origin, setOrigin] = useState('Delhi');
  const [destination, setDestination] = useState('Goa');
  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(28000);
  const [tripType, setTripType] = useState<'tour' | 'direct'>('tour');
  const [transportMode, setTransportMode] = useState<string[]>(['flights', 'trains']);

  const toggleTransport = (mode: string) => {
    if (transportMode.includes(mode)) {
      if (transportMode.length > 1) {
        setTransportMode(transportMode.filter(m => m !== mode));
      }
    } else {
      setTransportMode([...transportMode, mode]);
    }
  };

  const handleGenerate = async () => {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Missing Details', 'Please specify both origin and destination.');
      return;
    }

    setLoading(true);
    const params = {
      origin,
      destination,
      departureDate,
      travelers,
      budget,
      tripType,
      transportation: transportMode,
      starRating: 3,
    };

    tripStore.setSearchParams(params);

    try {
      const res = await generateTripPlans(params);
      if (res.success && res.plans.length > 0) {
        tripStore.setPlans(res.plans);
        router.push('/results');
      } else {
        Alert.alert('No Routes Found', res.error || 'Could not find itineraries for this route.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#012015' }}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        <TouchableOpacity
          onPress={() => step > 1 ? setStep(step - 1) : router.back()}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <Text style={{ color: '#50C878', fontWeight: 'bold', fontSize: 13 }}>← {step > 1 ? 'Back' : 'Home'}</Text>
        </TouchableOpacity>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>TripSmart Planner</Text>
        <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 12 }}>{step} / 3</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingVertical: 20 }}>

        {/* ── STEP 1: Route & Origin/Destination ────────────────────────── */}
        {step === 1 && (
          <View>
            <Text style={{ color: '#D1F2EB', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
              Where do you want to explore?
            </Text>
            <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 13, marginBottom: 24 }}>
              Enter cities or tap quick recommendations below.
            </Text>

            {/* Origin Input */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: '#50C878', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Starting From (Origin)
              </Text>
              <TextInput
                style={{
                  height: 52,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  color: '#ffffff',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(80,200,120,0.2)',
                }}
                placeholder="e.g. Delhi, Mumbai"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={origin}
                onChangeText={setOrigin}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 8 }}>
                {POPULAR_ORIGINS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setOrigin(c)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: origin === c ? '#50C878' : 'rgba(255,255,255,0.05)',
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: origin === c ? '#012015' : 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Destination Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#50C878', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Destination
              </Text>
              <TextInput
                style={{
                  height: 52,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  color: '#ffffff',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(80,200,120,0.2)',
                }}
                placeholder="e.g. Goa, Manali, Kerala"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={destination}
                onChangeText={setDestination}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 8 }}>
                {POPULAR_DESTINATIONS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setDestination(c)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: destination === c ? '#50C878' : 'rgba(255,255,255,0.05)',
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: destination === c ? '#012015' : 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Departure Date */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#50C878', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Departure Date
              </Text>
              <TextInput
                style={{
                  height: 50,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  color: '#ffffff',
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: 'rgba(80,200,120,0.2)',
                }}
                value={departureDate}
                onChangeText={setDepartureDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          </View>
        )}

        {/* ── STEP 2: Travelers & Travel Mode ──────────────────────────── */}
        {step === 2 && (
          <View>
            <Text style={{ color: '#D1F2EB', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
              Who is traveling?
            </Text>
            <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 13, marginBottom: 24 }}>
              Configure party size and preferred transport modes.
            </Text>

            {/* Travelers Count */}
            <Text style={{ color: '#50C878', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Number of Travelers
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setTravelers(n)}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: travelers === n ? '#50C878' : 'rgba(255,255,255,0.07)',
                    borderWidth: 1,
                    borderColor: travelers === n ? '#50C878' : 'rgba(80,200,120,0.2)',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: travelers === n ? '#012015' : '#ffffff' }}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transport Modes */}
            <Text style={{ color: '#50C878', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Transport Preferences
            </Text>
            <View style={{ gap: 10, marginBottom: 20 }}>
              {[
                { id: 'flights', label: 'Flights', desc: 'Fastest transit between major hubs' },
                { id: 'trains', label: 'Indian Railways (Trains)', desc: 'Scenic routes & sleeper coaches' },
              ].map(t => {
                const isSelected = transportMode.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => toggleTransport(t.id)}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: isSelected ? 'rgba(80,200,120,0.15)' : 'rgba(255,255,255,0.05)',
                      borderWidth: 1,
                      borderColor: isSelected ? '#50C878' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: isSelected ? '#50C878' : '#ffffff' }}>
                      {isSelected ? '✓ ' : ''}{t.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: 'rgba(209,242,235,0.6)', marginTop: 2 }}>{t.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── STEP 3: Budget & Travel Style ────────────────────────────── */}
        {step === 3 && (
          <View>
            <Text style={{ color: '#D1F2EB', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
              What is your budget?
            </Text>
            <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 13, marginBottom: 24 }}>
              Our multi-tiered algorithm fits flights, hotels, and activities inside this target.
            </Text>

            {/* Big Budget Display */}
            <View style={{ alignItems: 'center', marginVertical: 18, padding: 24, borderRadius: 24, backgroundColor: 'rgba(80,200,120,0.1)', borderWidth: 1, borderColor: 'rgba(80,200,120,0.25)' }}>
              <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Target Investment
              </Text>
              <Text style={{ color: '#50C878', fontSize: 38, fontWeight: '900', marginVertical: 6 }}>
                {formatINR(budget)}
              </Text>
              <Text style={{ color: 'rgba(209,242,235,0.8)', fontSize: 12 }}>
                ~ {formatINR(Math.round(budget / travelers))} per traveler
              </Text>

              {/* Quick Steppers */}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 18 }}>
                <TouchableOpacity
                  onPress={() => setBudget(Math.max(8000, budget - 4000))}
                  style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: 'bold' }}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setBudget(budget + 4000)}
                  style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Trip Style */}
            <Text style={{ color: '#50C878', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Itinerary Style
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setTripType('tour')}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: tripType === 'tour' ? 'rgba(80,200,120,0.2)' : 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: tripType === 'tour' ? '#50C878' : 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ fontWeight: 'bold', color: tripType === 'tour' ? '#50C878' : '#ffffff' }}>Curated Tour</Text>
                <Text style={{ fontSize: 11, color: 'rgba(209,242,235,0.6)', marginTop: 4 }}>Full daily plan with attractions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTripType('direct')}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: tripType === 'direct' ? 'rgba(80,200,120,0.2)' : 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: tripType === 'direct' ? '#50C878' : 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ fontWeight: 'bold', color: tripType === 'direct' ? '#50C878' : '#ffffff' }}>Direct Transit</Text>
                <Text style={{ fontSize: 11, color: 'rgba(209,242,235,0.6)', marginTop: 4 }}>Transport and stay only</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Bottom Button */}
      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: '#011910' }}>
        <TouchableOpacity
          onPress={() => {
            if (step < 3) setStep(step + 1);
            else handleGenerate();
          }}
          disabled={loading}
          style={{
            height: 54,
            borderRadius: 16,
            backgroundColor: '#50C878',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#50C878',
            shadowOpacity: 0.3,
            shadowRadius: 10,
          }}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#012015" />
              <Text style={{ color: '#012015', fontWeight: 'bold', fontSize: 15 }}>Connecting to Render Backend...</Text>
            </View>
          ) : (
            <Text style={{ color: '#012015', fontWeight: 'bold', fontSize: 16 }}>
              {step === 3 ? 'Generate Itineraries' : 'Continue →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
