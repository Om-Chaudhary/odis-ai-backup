import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f2f5f4",
        },
        headerTitleStyle: {
          color: "#171717",
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
