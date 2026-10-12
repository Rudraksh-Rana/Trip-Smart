import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { tripStore } from '../src/store/tripStore';
import { formatINR, MobileTripPlan } from '../src/services/api';

export default function ResultsScreen() {
  const router = useRouter();
  const params = tripStore.getSearchParams();
  const allPlans = tripStore.getPlans();
  const [filter, setFilter] = useState<'all' | 'budget' | 'comfort'>('all');

  const filteredPlans = allPlans.filter(p => {
    if (filter === 'budget') return p.tier.toLowerCase().includes('budget');
    if (filter === 'comfort') return p.tier.toLowerCase().includes('comfort') || p.tier.toLowerCase().includes('premium');
    return true;
  });

  const handleSelectPlan = (plan: MobileTripPlan) => {
    tripStore.setSelectedPlan(plan);
    router.push('/trip-details');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#012015' }}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
        >
          <Text style={{ color: '#50C878', fontSize: 16, fontWeight: 'bold' }}>←</Text>
        </TouchableOpacity>

        <Text style={{ color: '#D1F2EB', fontSize: 26, fontWeight: 'bold', lineHeight: 32 }}>
          Synthesized Expeditions
        </Text>
        <Text style={{ color: 'rgba(209,242,235,0.7)', fontSize: 13, marginTop: 4 }}>
          {params.origin} → {params.destination} • {params.travelers} Traveler{params.travelers > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Quick Filter Tabs */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          {[
            { id: 'all', label: 'All Options' },
            { id: 'budget', label: 'Budget-Focused' },
            { id: 'comfort', label: 'Comfort & Premium' },
          ].map(f => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id as any)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filter === f.id ? '#50C878' : 'rgba(255,255,255,0.08)',
                marginRight: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: filter === f.id ? '#012015' : 'rgba(255,255,255,0.8)' }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Plans List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ gap: 16 }}>
          {filteredPlans.map((plan) => {
            const isTrain = plan.transport.mode === 'train';

            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.88}
                onPress={() => handleSelectPlan(plan)}
                style={{
                  borderRadius: 22,
                  backgroundColor: 'rgba(1, 40, 26, 0.75)',
                  borderWidth: 1,
                  borderColor: 'rgba(80, 200, 120, 0.25)',
                  padding: 20,
                  shadowColor: '#000',
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                }}
              >
                {/* Tier & Price Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={{
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 10,
                        backgroundColor: 'rgba(80,200,120,0.2)',
                        color: '#50C878',
                        fontSize: 11,
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}>
                        {plan.tier}
                      </Text>
                      <Text style={{ color: 'rgba(209,242,235,0.6)', fontSize: 12 }}>{plan.duration}</Text>
                    </View>
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
                      {plan.name}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#50C878', fontSize: 22, fontWeight: '900' }}>
                      {formatINR(plan.totalCost)}
                    </Text>
                    <Text style={{ color: 'rgba(209,242,235,0.5)', fontSize: 10 }}>Total trip cost</Text>
                  </View>
                </View>

                {/* Key Logistics */}
                <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15 }}>{isTrain ? '🚂' : '✈️'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, flex: 1 }} numberOfLines={1}>
                      {plan.transport.name} ({plan.transport.duration})
                    </Text>
                  </View>

                  {plan.accommodation && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 15 }}>🏨</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, flex: 1 }} numberOfLines={1}>
                        {plan.accommodation.name} ({'★'.repeat(plan.accommodation.stars)})
                      </Text>
                    </View>
                  )}
                </View>

                {/* Highlights */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, marginBottom: 14 }}>
                  {plan.highlights.map((h, i) => (
                    <Text key={i} style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: 'rgba(209,242,235,0.8)',
                      fontSize: 11,
                    }}>
                      • {h}
                    </Text>
                  ))}
                </View>

                {/* CTA */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(209,242,235,0.5)', fontSize: 11 }}>
                    {plan.itinerary.length} Days Itinerary Included
                  </Text>
                  <Text style={{ color: '#50C878', fontSize: 13, fontWeight: 'bold' }}>
                    View Full Details →
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
