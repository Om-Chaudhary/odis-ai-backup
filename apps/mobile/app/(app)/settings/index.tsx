import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useState } from "react";
import { Stack } from "expo-router";
import { Bell, Moon, Volume2, ChevronRight } from "lucide-react-native";
import { Card } from "@odis-ai/mobile/ui";

export default function Settings() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
          headerStyle: { backgroundColor: "#f2f5f4" },
          headerTitleStyle: { color: "#171717", fontWeight: "600" },
        }}
      />
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
        {/* Notifications Section */}
        <Text className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Notifications
        </Text>
        <Card className="mb-6">
          <View className="flex-row items-center justify-between py-1">
            <View className="flex-row items-center gap-3">
              <Bell color="#6b7280" size={20} />
              <Text className="text-foreground">Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: "#d1d5db", true: "#0d3d38" }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        {/* Preferences Section */}
        <Text className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Preferences
        </Text>
        <Card className="mb-6">
          <View className="flex-row items-center justify-between border-b border-border py-3">
            <View className="flex-row items-center gap-3">
              <Volume2 color="#6b7280" size={20} />
              <Text className="text-foreground">Sound Effects</Text>
            </View>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: "#d1d5db", true: "#0d3d38" }}
              thumbColor="#ffffff"
            />
          </View>
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-3">
              <Moon color="#6b7280" size={20} />
              <Text className="text-foreground">Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#d1d5db", true: "#0d3d38" }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        {/* About Section */}
        <Text className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          About
        </Text>
        <Card>
          <TouchableOpacity className="flex-row items-center justify-between border-b border-border py-3">
            <Text className="text-foreground">Privacy Policy</Text>
            <ChevronRight color="#6b7280" size={20} />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center justify-between border-b border-border py-3">
            <Text className="text-foreground">Terms of Service</Text>
            <ChevronRight color="#6b7280" size={20} />
          </TouchableOpacity>
          <View className="flex-row items-center justify-between py-3">
            <Text className="text-foreground">Version</Text>
            <Text className="text-muted-foreground">1.0.0</Text>
          </View>
        </Card>
      </ScrollView>
    </>
  );
}
