import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { tripStore } from '../src/store/tripStore';

const FEATURED_ESCAPES = [
  { city: 'Goa', state: 'West Coast', price: '₹12k', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80' },
  { city: 'Jaipur', state: 'Rajasthan', price: '₹8k', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80' },
  { city: 'Manali', state: 'Himachal', price: '₹14k', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80' },
  { city: 'Kerala', state: 'South Coast', price: '₹16k', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80' },
];

export default function LandingScreen() {
  const router = useRouter();

  const handleQuickDestination = (city: string) => {
    tripStore.setSearchParams({
      origin: 'Delhi',
      destination: city,
      departureDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      travelers: 2,
      budget: 25000,
      tripType: 'tour',
    });
    router.push('/plan-trip');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#011c12' }}>
      <StatusBar style="light" />

      {/* Top Brand Bar */}
      <View style={{
        paddingHorizontal: 20, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#50C878' }} />
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>
            TRIPSMART
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/my-trips')}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <Text style={{ color: '#50C878', fontWeight: 'bold', fontSize: 12 }}>Saved Trips</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero Banner */}
        <View style={{ padding: 20 }}>
          <View style={{
            borderRadius: 28, padding: 24,
            backgroundColor: '#012b1d',
            borderWidth: 1, borderColor: 'rgba(80, 200, 120, 0.25)',
          }}>
            <Text style={{ color: '#50C878', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              Intelligent Multi-Tier Travel
            </Text>
            <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '900', lineHeight: 38, marginBottom: 12 }}>
              Plan Smarter.{'\n'}Travel Better.
            </Text>
            <Text style={{ color: 'rgba(209,242,235,0.7)', fontSize: 14, lineHeight: 20, marginBottom: 22 }}>
              Algorithmic itinerary synthesis connecting live Indian transport schedules, verified stays, and AI budget allocation.
            </Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => router.push('/plan-trip')}
                style={{
                  height: 52, borderRadius: 16,
                  backgroundColor: '#50C878',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#012015', fontSize: 16, fontWeight: 'bold' }}>
                  Start Planning →
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/my-trips')}
                style={{
                  height: 48, borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#D1F2EB', fontSize: 14, fontWeight: '600' }}>
                  View Saved Itineraries
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Featured Indian Escapes */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
              Featured Escapes
            </Text>
            <Text style={{ color: '#50C878', fontSize: 12, fontWeight: 'bold' }}>
              Tap to customize
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {FEATURED_ESCAPES.map(item => (
              <TouchableOpacity
                key={item.city}
                activeOpacity={0.85}
                onPress={() => handleQuickDestination(item.city)}
                style={{
                  width: '48%',
                  borderRadius: 20,
                  overflow: 'hidden',
                  backgroundColor: '#012b1d',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Image
                  source={{ uri: item.img }}
                  style={{ width: '100%', height: 110 }}
                  resizeMode="cover"
                />
                <View style={{ padding: 12 }}>
                  <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: 'bold' }}>{item.city}</Text>
                  <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 11, marginTop: 1 }}>{item.state}</Text>
                  <Text style={{ color: '#50C878', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>from {item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Live System Status Badge */}
        <View style={{ margin: 20, padding: 16, borderRadius: 18, backgroundColor: 'rgba(80,200,120,0.08)', borderWidth: 1, borderColor: 'rgba(80,200,120,0.2)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#50C878' }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>Connected to Production</Text>
            <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 11 }}>tripsmart.onrender.com live</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
