import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{
        headerShown: false,
        gestureEnabled: true,   // 👈 THIS enables swipe back
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="token/[mint]" />
        <Stack.Screen name="orders" />
      </Stack>
    </SafeAreaProvider>
  );
}