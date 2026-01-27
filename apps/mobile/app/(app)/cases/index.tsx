import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Card } from "@odis-ai/mobile/ui";

// Mock data - will be replaced with API call
const MOCK_CASES = [
  {
    id: "1",
    patientName: "Max",
    ownerName: "John Smith",
    visitType: "Wellness Check",
    status: "pending",
    scheduledAt: "2:00 PM",
  },
  {
    id: "2",
    patientName: "Luna",
    ownerName: "Sarah Johnson",
    visitType: "Post-Surgery Follow-up",
    status: "completed",
    scheduledAt: "1:30 PM",
  },
  {
    id: "3",
    patientName: "Buddy",
    ownerName: "Mike Davis",
    visitType: "Dental Cleaning",
    status: "in_progress",
    scheduledAt: "11:00 AM",
  },
  {
    id: "4",
    patientName: "Bella",
    ownerName: "Emily Wilson",
    visitType: "Vaccination",
    status: "pending",
    scheduledAt: "3:30 PM",
  },
];

type CaseStatus = "pending" | "completed" | "in_progress";

function getStatusStyle(status: CaseStatus) {
  switch (status) {
    case "completed":
      return { bg: "bg-green-100", text: "text-green-700" };
    case "in_progress":
      return { bg: "bg-yellow-100", text: "text-yellow-700" };
    default:
      return { bg: "bg-blue-100", text: "text-blue-700" };
  }
}

function getStatusLabel(status: CaseStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    default:
      return "Pending";
  }
}

export default function CasesList() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch cases from API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderCase = ({
    item,
  }: {
    item: (typeof MOCK_CASES)[0];
  }) => {
    const statusStyle = getStatusStyle(item.status as CaseStatus);

    return (
      <Link href={`/(app)/cases/${item.id}` as const} asChild>
        <TouchableOpacity activeOpacity={0.7}>
          <Card className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="font-semibold text-foreground">
                    {item.patientName}
                  </Text>
                  <View className={`rounded-full px-2 py-0.5 ${statusStyle.bg}`}>
                    <Text className={`text-xs font-medium ${statusStyle.text}`}>
                      {getStatusLabel(item.status as CaseStatus)}
                    </Text>
                  </View>
                </View>
                <Text className="mt-1 text-sm text-muted-foreground">
                  {item.ownerName} • {item.visitType}
                </Text>
                <Text className="mt-0.5 text-sm text-muted-foreground">
                  {item.scheduledAt}
                </Text>
              </View>
              <ChevronRight color="#6b7280" size={20} />
            </View>
          </Card>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={MOCK_CASES}
        renderItem={renderCase}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground">Cases</Text>
            <Text className="mt-1 text-muted-foreground">
              {MOCK_CASES.length} cases today
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-muted-foreground">No cases found</Text>
          </View>
        }
      />
    </View>
  );
}
