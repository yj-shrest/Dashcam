import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="capture" options={{ title: "Capture Photos" }} />
      <Stack.Screen name="gallery" options={{ title: "Captured Photos" }} />
      <Stack.Screen name="folderListScreen" options={{ title: "Folders Photos" }} />
    </Stack>
  );
}
