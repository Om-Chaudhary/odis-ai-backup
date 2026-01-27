import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useState, useCallback } from "react";
import { Card } from "@odis-ai/mobile/ui";

export default function Dashboard() {
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch dashboard data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName || "there"}!
        </Text>
        <Text className="mt-1 text-muted-foreground">
          Here's what's happening today
        </Text>
      </View>

      {/* Stats Grid */}
      <View className="mb-6 flex-row flex-wrap gap-4">
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-sm text-muted-foreground">Pending Calls</Text>
          <Text className="mt-1 text-2xl font-bold text-foreground">12</Text>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-sm text-muted-foreground">Completed Today</Text>
          <Text className="mt-1 text-2xl font-bold text-primary">24</Text>
        </Card>
      </View>

      <View className="mb-6 flex-row flex-wrap gap-4">
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-sm text-muted-foreground">Success Rate</Text>
          <Text className="mt-1 text-2xl font-bold text-foreground">94%</Text>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-sm text-muted-foreground">Avg Duration</Text>
          <Text className="mt-1 text-2xl font-bold text-foreground">2:45</Text>
        </Card>
      </View>

      {/* Recent Activity */}
      <View className="mb-4">
        <Text className="mb-3 text-lg font-semibold text-foreground">
          Recent Activity
        </Text>
        <Card>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-medium text-foreground">Max - Wellness Check</Text>
              <Text className="text-sm text-muted-foreground">Completed 10 min ago</Text>
            </View>
            <View className="rounded-full bg-green-100 px-2 py-1">
              <Text className="text-xs font-medium text-green-700">Success</Text>
            </View>
          </View>
        </Card>
      </View>

      <Card>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-medium text-foreground">Luna - Post-Surgery</Text>
            <Text className="text-sm text-muted-foreground">Scheduled for 2:00 PM</Text>
          </View>
          <View className="rounded-full bg-blue-100 px-2 py-1">
            <Text className="text-xs font-medium text-blue-700">Pending</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}
