import { TimeOffPanel } from "@/components/availability/TimeOffPanel";
import { WorkingHoursPanel } from "@/components/availability/WorkingHoursPanel";
import { Box } from "@/components/ui/box";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import React, { useState } from "react";
import { Pressable, Text, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TABS = [
  { key: "hours", label: "Working hours" },
  { key: "timeOff", label: "Time off" },
] as const;

type PanelKey = (typeof TABS)[number]["key"];

export default function ScheduleScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [panel, setPanel] = useState<PanelKey>("hours");

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <Box className="px-5 pt-4">
        <Text
          className="text-2xl"
          style={{ fontFamily: Fonts.bold, color: colors.text }}
        >
          Schedule
        </Text>
        <Text
          style={{ fontFamily: Fonts.regular, color: colors.textSecondary }}
          className="text-[14px] mt-1"
        >
          When patients can book you, and when they can&apos;t.
        </Text>

        <Box
          className="flex-row mt-4 p-1 rounded-xl"
          style={{ backgroundColor: colors.surfaceMuted }}
        >
          {TABS.map((tab) => {
            const active = panel === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setPanel(tab.key)}
                className="flex-1 py-2 rounded-lg items-center active:opacity-70"
                style={{
                  backgroundColor: active ? colors.surface : "transparent",
                  shadowColor: active ? colors.shadowColor : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: active ? 0.08 : 0,
                  shadowRadius: 6,
                  elevation: active ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: active ? Fonts.semibold : Fonts.medium,
                    color: active ? colors.primaryDark : colors.textSecondary,
                  }}
                  className="text-[14px]"
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      {panel === "hours" ? <WorkingHoursPanel /> : <TimeOffPanel />}
    </SafeAreaView>
  );
}
