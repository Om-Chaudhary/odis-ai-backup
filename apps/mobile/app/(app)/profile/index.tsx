import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { LogOut, User, Mail, Building2, ChevronRight } from "lucide-react-native";
import { Card, Button } from "@odis-ai/mobile/ui";

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Profile",
          headerStyle: { backgroundColor: "#f2f5f4" },
          headerTitleStyle: { color: "#171717", fontWeight: "600" },
        }}
      />
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
        {/* Avatar and Name */}
        <View className="mb-6 items-center">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Text className="text-2xl font-bold text-primary-foreground">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Text>
          </View>
          <Text className="text-xl font-bold text-foreground">
            {user?.fullName || "User"}
          </Text>
          <Text className="mt-1 text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        {/* Account Info */}
        <Text className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Account Information
        </Text>
        <Card className="mb-6">
          <View className="flex-row items-center gap-3 border-b border-border py-3">
            <User color="#6b7280" size={20} />
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Full Name</Text>
              <Text className="font-medium text-foreground">
                {user?.fullName || "Not set"}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3 border-b border-border py-3">
            <Mail color="#6b7280" size={20} />
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Email</Text>
              <Text className="font-medium text-foreground">
                {user?.primaryEmailAddress?.emailAddress || "Not set"}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3 py-3">
            <Building2 color="#6b7280" size={20} />
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Clinic</Text>
              <Text className="font-medium text-foreground">
                {/* TODO: Get clinic from user metadata */}
                Demo Veterinary Clinic
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <Text className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Account Actions
        </Text>
        <Card className="mb-6">
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <Text className="text-foreground">Edit Profile</Text>
            <ChevronRight color="#6b7280" size={20} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out */}
        <Button variant="destructive" onPress={handleSignOut}>
          <LogOut color="#ffffff" size={18} />
          <Text className="ml-2 font-semibold text-white">Sign Out</Text>
        </Button>
      </ScrollView>
    </>
  );
}
