import { Tabs } from "expo-router";
import { CalendarCheck, CalendarClock, User } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <TabNavigator />
    </SafeAreaProvider>
  );
}

function TabNavigator() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  // Without the inset the labels sit under the gesture bar on Android.
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontFamily: Fonts.medium,
          fontSize: 12,
        },
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            height: 58 + insets.bottom,
            paddingBottom: insets.bottom + 6,
            paddingTop: 6,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color }) => <CalendarCheck size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <CalendarClock size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
