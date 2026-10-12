import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView, Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { tripStore } from '../src/store/tripStore';
import { formatINR } from '../src/services/api';

export default function TripDetailsScreen() {
  const router = useRouter();
  const plan = tripStore.getSelectedPlan();
  const params = tripStore.getSearchParams();
  const [activeDay, setActiveDay] = useState(1);
  const [isSaved, setIsSaved] = useState(false);

  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#012015', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>No Trip Selected</Text>
        <TouchableOpacity
          onPress={() => router.push('/plan-trip')}
          style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#50C878', borderRadius: 20 }}
        >
          <Text style={{ color: '#012015', fontWeight: 'bold' }}>Plan a Trip</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const days = plan.itinerary || [];
  const currentDay = days.find(d => d.day === activeDay) || days[0];

  const handleSave = () => {
    tripStore.saveCurrentTrip();
    setIsSaved(true);
    Alert.alert('Trip Saved', 'This itinerary has been saved to your My Trips library!');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my TripSmart itinerary for ${params.destination}! Total estimated cost: ${formatINR(plan.totalCost)}.`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#012015' }}>
      <StatusBar style="light" />

      {/* Top Bar */}
      <View style={{
        paddingHorizontal: 20, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)'
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <Text style={{ color: '#50C878', fontWeight: 'bold', fontSize: 13 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Itinerary Overview</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <Text style={{ color: '#50C878', fontWeight: 'bold', fontSize: 13 }}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* Hero Card */}
        <View style={{ padding: 20 }}>
          <View style={{
            borderRadius: 24, padding: 20,
            backgroundColor: 'rgba(1, 40, 26, 0.85)',
            borderWidth: 1, borderColor: 'rgba(80, 200, 120, 0.3)',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ color: '#50C878', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {params.origin} → {params.destination}
                </Text>
                <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>
                  {plan.name}
                </Text>
                <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 12, marginTop: 2 }}>
                  {params.travelers} Traveler{params.travelers > 1 ? 's' : ''} • {plan.duration}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#50C878', fontSize: 24, fontWeight: '900' }}>
                  {formatINR(plan.totalCost)}
                </Text>
                <Text style={{ color: 'rgba(209,242,235,0.5)', fontSize: 10 }}>Total budget</Text>
              </View>
            </View>

            {/* Quick action buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                onPress={handleSave}
                style={{
                  flex: 1, height: 44, borderRadius: 12,
                  backgroundColor: isSaved ? 'rgba(80,200,120,0.3)' : 'rgba(255,255,255,0.1)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: isSaved ? '#50C878' : 'rgba(255,255,255,0.15)'
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>
                  {isSaved ? '✓ Saved' : '🔖 Save to Library'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/my-trips')}
                style={{
                  flex: 1, height: 44, borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#D1F2EB', fontSize: 13, fontWeight: 'bold' }}>
                  View All Trips
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Day Selector */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Daily Schedule
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {days.map((d) => (
              <TouchableOpacity
                key={d.day}
                onPress={() => setActiveDay(d.day)}
                style={{
                  paddingHorizontal: 18, paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: activeDay === d.day ? '#50C878' : 'rgba(255,255,255,0.06)',
                  marginRight: 8,
                }}
              >
                <Text style={{
                  fontSize: 13, fontWeight: 'bold',
                  color: activeDay === d.day ? '#012015' : 'rgba(255,255,255,0.8)'
                }}>
                  Day {d.day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Day Activities */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: '#D1F2EB', fontSize: 16, fontWeight: 'bold', marginBottom: 14 }}>
            {currentDay?.title || `Day ${activeDay}`}
          </Text>

          <View style={{ gap: 12 }}>
            {currentDay?.activities?.map((act: any, idx: number) => {
              return (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    gap: 14,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.06)'
                  }}
                >
                  {/* Timeline dot */}
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#50C878', marginTop: 5 }} />

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 12, fontWeight: '600' }}>
                        {act.time || 'All Day'}
                      </Text>
                      {act.cost ? (
                        <Text style={{ color: '#50C878', fontSize: 12, fontWeight: 'bold' }}>
                          {formatINR(act.cost)}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginTop: 2 }}>
                      {act.title}
                    </Text>

                    {act.description ? (
                      <Text style={{ color: 'rgba(209,242,235,0.65)', fontSize: 12, marginTop: 2 }}>
                        {act.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 14 }}>
            Investment Breakdown
          </Text>
          <View style={{
            borderRadius: 20, padding: 18,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            gap: 10,
          }}>
            {[
              { label: 'Transport', val: plan.breakdown?.transport || 0 },
              { label: 'Accommodation', val: plan.breakdown?.accommodation || 0 },
              { label: 'Activities & Tours', val: plan.breakdown?.activities || 0 },
              { label: 'Estimated Meals', val: plan.breakdown?.meals || 0 },
            ].map(item => (
              <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: 'rgba(209,242,235,0.7)', fontSize: 13 }}>{item.label}</Text>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>{formatINR(item.val)}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Floating Bottom CTA */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 20, backgroundColor: 'rgba(1, 25, 16, 0.95)',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)'
      }}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Booking Confirmation', `Your booking for ${params.destination} has been verified! Have a great trip.`);
          }}
          style={{
            height: 54, borderRadius: 16,
            backgroundColor: '#50C878',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#012015', fontSize: 16, fontWeight: 'bold' }}>
            Book Trip • {formatINR(plan.totalCost)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
