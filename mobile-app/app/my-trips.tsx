import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { tripStore } from '../src/store/tripStore';
import { formatINR } from '../src/services/api';

export default function MyTripsScreen() {
  const router = useRouter();
  const savedTrips = tripStore.getSavedTrips();

  const handleOpenTrip = (saved: any) => {
    tripStore.setSelectedPlan(saved.plan);
    tripStore.setSearchParams(saved.params);
    router.push('/trip-details');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#012015' }}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{
        paddingHorizontal: 20, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)'
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <Text style={{ color: '#50C878', fontWeight: 'bold', fontSize: 13 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>My Trips</Text>
        <TouchableOpacity
          onPress={() => router.push('/plan-trip')}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#50C878' }}
        >
          <Text style={{ color: '#012015', fontWeight: 'bold', fontSize: 12 }}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingVertical: 20 }}>
        {savedTrips.length === 0 ? (
          <View style={{
            alignItems: 'center', justifyContent: 'center',
            paddingVertical: 80, paddingHorizontal: 20,
            borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          }}>
            <Text style={{ fontSize: 42, marginBottom: 14 }}>🗺️</Text>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>
              No Saved Trips Yet
            </Text>
            <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
              Use the Trip Planner to generate an itinerary and tap "Save to Library".
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/plan-trip')}
              style={{
                paddingHorizontal: 24, paddingVertical: 12,
                borderRadius: 16, backgroundColor: '#50C878',
              }}
            >
              <Text style={{ color: '#012015', fontWeight: 'bold', fontSize: 14 }}>
                Start Planning
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {savedTrips.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => handleOpenTrip(item)}
                style={{
                  borderRadius: 20,
                  backgroundColor: 'rgba(1, 40, 26, 0.8)',
                  borderWidth: 1,
                  borderColor: 'rgba(80, 200, 120, 0.25)',
                  padding: 18,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={{ color: '#50C878', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {item.params.origin} → {item.params.destination}
                    </Text>
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>
                      {item.plan.name}
                    </Text>
                    <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 12, marginTop: 2 }}>
                      Saved on {item.savedAt} • {item.plan.duration}
                    </Text>
                  </View>

                  <Text style={{ color: '#50C878', fontSize: 18, fontWeight: '900' }}>
                    {formatINR(item.plan.totalCost)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                  <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 12 }}>
                    {item.plan.itinerary.length} Days Schedule
                  </Text>
                  <Text style={{ color: '#50C878', fontSize: 12, fontWeight: 'bold' }}>
                    Open Itinerary →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
