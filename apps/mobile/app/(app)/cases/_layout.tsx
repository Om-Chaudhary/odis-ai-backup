import { Stack } from "expo-router";

export default function CasesLayout() {
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
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Cases",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Case Details",
        }}
      />
    </Stack>
  );
}
