import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="plan-trip" />
      <Stack.Screen name="results" />
      <Stack.Screen name="trip-details" />
      <Stack.Screen name="my-trips" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
