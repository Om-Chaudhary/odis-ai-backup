import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { ArrowLeft, Phone, MessageSquare } from "lucide-react-native";
import { Card, Button } from "@odis-ai/mobile/ui";

// Mock data - will be replaced with API call
const MOCK_CASE_DETAILS = {
  id: "1",
  patientName: "Max",
  patientSpecies: "Dog",
  patientBreed: "Golden Retriever",
  ownerName: "John Smith",
  ownerPhone: "+1 (555) 123-4567",
  visitType: "Wellness Check",
  status: "pending",
  scheduledAt: "Today at 2:00 PM",
  veterinarian: "Dr. Sarah Wilson",
  notes: "Annual wellness exam. Owner mentioned Max has been scratching more than usual.",
  dischargeInstructions:
    "Continue regular diet. Apply flea prevention medication monthly. Schedule dental cleaning in 3 months.",
};

export default function CaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // TODO: Fetch case by id from API
  const caseData = MOCK_CASE_DETAILS;

  const handleInitiateCall = () => {
    // TODO: Trigger discharge call via API
    console.log("Initiating call for case:", id);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: caseData.patientName,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#171717" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
        {/* Patient Info */}
        <Card className="mb-4">
          <Text className="mb-2 text-lg font-semibold text-foreground">
            Patient Information
          </Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Name</Text>
              <Text className="font-medium text-foreground">{caseData.patientName}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Species</Text>
              <Text className="font-medium text-foreground">{caseData.patientSpecies}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Breed</Text>
              <Text className="font-medium text-foreground">{caseData.patientBreed}</Text>
            </View>
          </View>
        </Card>

        {/* Owner Info */}
        <Card className="mb-4">
          <Text className="mb-2 text-lg font-semibold text-foreground">
            Owner Information
          </Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Name</Text>
              <Text className="font-medium text-foreground">{caseData.ownerName}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Phone</Text>
              <Text className="font-medium text-primary">{caseData.ownerPhone}</Text>
            </View>
          </View>
        </Card>

        {/* Visit Info */}
        <Card className="mb-4">
          <Text className="mb-2 text-lg font-semibold text-foreground">
            Visit Details
          </Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Type</Text>
              <Text className="font-medium text-foreground">{caseData.visitType}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Scheduled</Text>
              <Text className="font-medium text-foreground">{caseData.scheduledAt}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Veterinarian</Text>
              <Text className="font-medium text-foreground">{caseData.veterinarian}</Text>
            </View>
          </View>
        </Card>

        {/* Notes */}
        <Card className="mb-4">
          <Text className="mb-2 text-lg font-semibold text-foreground">Notes</Text>
          <Text className="text-foreground">{caseData.notes}</Text>
        </Card>

        {/* Discharge Instructions */}
        <Card className="mb-6">
          <Text className="mb-2 text-lg font-semibold text-foreground">
            Discharge Instructions
          </Text>
          <Text className="text-foreground">{caseData.dischargeInstructions}</Text>
        </Card>

        {/* Action Buttons */}
        <View className="gap-3">
          <Button onPress={handleInitiateCall}>
            <Phone color="#ffffff" size={18} />
            <Text className="ml-2 font-semibold text-primary-foreground">
              Initiate Discharge Call
            </Text>
          </Button>

          <Button variant="outline">
            <MessageSquare color="#0d3d38" size={18} />
            <Text className="ml-2 font-semibold text-primary">
              Send SMS Reminder
            </Text>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
