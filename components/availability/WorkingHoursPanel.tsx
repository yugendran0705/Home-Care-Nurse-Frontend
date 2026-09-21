import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { Clock, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  useColorScheme,
} from "react-native";
import axiosInstance from "../../axiosInstance";

interface WorkingHourSlot {
  id: string;
  nurse_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// The API numbers days 0-6 starting on Monday (models.WorkingHours).
const DAYS = [
  { index: 0, short: "Mon", long: "Monday" },
  { index: 1, short: "Tue", long: "Tuesday" },
  { index: 2, short: "Wed", long: "Wednesday" },
  { index: 3, short: "Thu", long: "Thursday" },
  { index: 4, short: "Fri", long: "Friday" },
  { index: 5, short: "Sat", long: "Saturday" },
  { index: 6, short: "Sun", long: "Sunday" },
];

/** "09:00:00" -> "9:00 AM" */
const formatTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
};

/** Date -> "09:00:00", the local wall-clock format the API stores. */
const toApiTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}:00`;

const dateFromApiTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const apiErrorMessage = (error: any, fallback: string) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
};

export function WorkingHoursPanel() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [slots, setSlots] = useState<WorkingHourSlot[]>([]);
  const [nurseId, setNurseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // "Add slot" sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(() => dateFromApiTime("09:00"));
  const [endTime, setEndTime] = useState(() => dateFromApiTime("17:00"));
  const [picker, setPicker] = useState<"start" | "end" | null>(null);
  const [sheetError, setSheetError] = useState("");

  const fetchSlots = useCallback(async () => {
    try {
      let id = nurseId;
      if (!id) {
        const cachedProfile = await AsyncStorage.getItem("profile");
        const profile = cachedProfile
          ? JSON.parse(cachedProfile)
          : (await axiosInstance.get("nurses/me")).data;
        id = profile?.nurse?.id ?? null;
        setNurseId(id);
      }
      if (!id) throw new Error("Could not identify the current nurse.");

      const response = await axiosInstance.get(`working_hours/nurse/${id}`);
      setSlots(response.data?.working_hours ?? []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        apiErrorMessage(error, "Could not load your working hours."),
      );
    } finally {
      setLoading(false);
    }
  }, [nurseId]);

  useFocusEffect(
    useCallback(() => {
      fetchSlots();
    }, [fetchSlots]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSlots();
    setRefreshing(false);
  }, [fetchSlots]);

  const slotsByDay = useMemo(() => {
    const grouped: Record<number, WorkingHourSlot[]> = {};
    DAYS.forEach((day) => (grouped[day.index] = []));
    slots.forEach((slot) => {
      if (grouped[slot.day_of_week]) grouped[slot.day_of_week].push(slot);
    });
    Object.values(grouped).forEach((daySlots) =>
      daySlots.sort((a, b) => a.start_time.localeCompare(b.start_time)),
    );
    return grouped;
  }, [slots]);

  const activeCount = slots.filter((slot) => slot.is_active).length;

  const openSheet = (day?: number) => {
    setSelectedDays(day === undefined ? [] : [day]);
    setStartTime(dateFromApiTime("09:00"));
    setEndTime(dateFromApiTime("17:00"));
    setSheetError("");
    setSheetOpen(true);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const onPickTime = (event: DateTimePickerEvent, selected?: Date) => {
    const which = picker;
    setPicker(Platform.OS === "ios" ? which : null);
    if (event.type === "dismissed" || !selected) return;
    if (which === "start") setStartTime(selected);
    if (which === "end") setEndTime(selected);
  };

  const handleAddSlots = async () => {
    if (saving) return;
    if (selectedDays.length === 0) {
      setSheetError("Pick at least one day.");
      return;
    }
    if (toApiTime(endTime) <= toApiTime(startTime)) {
      setSheetError("End time must be after the start time.");
      return;
    }

    setSaving(true);
    setSheetError("");
    const payload = selectedDays.map((day) => ({
      day_of_week: day,
      start_time: toApiTime(startTime),
      end_time: toApiTime(endTime),
    }));

    try {
      // One slot goes to the single-create route; several days in one go is
      // exactly what /bulk is for, and it rejects the whole batch on overlap.
      if (payload.length === 1) {
        await axiosInstance.post("working_hours/", payload[0]);
      } else {
        await axiosInstance.post("working_hours/bulk", payload);
      }
      setSheetOpen(false);
      await fetchSlots();
    } catch (error: any) {
      setSheetError(
        apiErrorMessage(error, "Could not save these hours. Try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (slot: WorkingHourSlot) => {
    const next = !slot.is_active;
    setSlots((prev) =>
      prev.map((item) =>
        item.id === slot.id ? { ...item, is_active: next } : item,
      ),
    );
    try {
      await axiosInstance.put(`working_hours/${slot.id}`, { is_active: next });
    } catch (error: any) {
      setSlots((prev) =>
        prev.map((item) =>
          item.id === slot.id ? { ...item, is_active: slot.is_active } : item,
        ),
      );
      Alert.alert(
        "Error",
        apiErrorMessage(error, "Could not update the slot."),
      );
    }
  };

  const handleDelete = (slot: WorkingHourSlot) => {
    Alert.alert(
      "Remove slot",
      `Remove ${formatTime(slot.start_time)} – ${formatTime(
        slot.end_time,
      )} from ${DAYS[slot.day_of_week]?.long ?? "this day"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(`working_hours/${slot.id}`);
              setSlots((prev) => prev.filter((item) => item.id !== slot.id));
            } catch (error: any) {
              Alert.alert(
                "Error",
                apiErrorMessage(error, "Could not remove the slot."),
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Box
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </Box>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Box
          className="rounded-xl px-4 py-3 mb-4 border flex-row items-center gap-3"
          style={{
            backgroundColor: colors.primaryTint,
            borderColor: colors.primarySoft,
          }}
        >
          <Icon as={Clock} color={colors.primary} />
          <Text
            style={{ fontFamily: Fonts.regular, color: colors.primaryDark }}
            className="text-[13px] flex-1 leading-5"
          >
            {activeCount === 0
              ? "Patients can't find you until you add at least one slot."
              : `Patients can book you in ${activeCount} active ${
                  activeCount === 1 ? "slot" : "slots"
                } each week.`}
          </Text>
        </Box>

        {DAYS.map((day) => {
          const daySlots = slotsByDay[day.index] ?? [];
          return (
            <Box
              key={day.index}
              className="rounded-2xl p-4 mb-3 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Box className="flex-row items-center justify-between">
                <Text
                  style={{ fontFamily: Fonts.semibold, color: colors.text }}
                  className="text-[16px]"
                >
                  {day.long}
                </Text>
                <Pressable
                  onPress={() => openSheet(day.index)}
                  className="flex-row items-center gap-1 px-2 py-1 rounded-lg active:opacity-70"
                >
                  <Icon as={Plus} size="sm" color={colors.primary} />
                  <Text
                    style={{
                      fontFamily: Fonts.semibold,
                      color: colors.primary,
                    }}
                    className="text-[13px]"
                  >
                    Add
                  </Text>
                </Pressable>
              </Box>

              {daySlots.length > 0 && (
                <Divider
                  className="my-3"
                  style={{ backgroundColor: colors.border }}
                />
              )}

              {daySlots.length === 0 ? (
                <Text
                  style={{
                    fontFamily: Fonts.regular,
                    color: colors.textMuted,
                  }}
                  className="text-[14px] mt-1"
                >
                  Not available
                </Text>
              ) : (
                daySlots.map((slot, index) => (
                  <Box
                    key={slot.id}
                    className={`flex-row items-center justify-between ${
                      index > 0 ? "mt-3" : ""
                    }`}
                  >
                    <Text
                      style={{
                        fontFamily: Fonts.medium,
                        color: slot.is_active ? colors.text : colors.textMuted,
                      }}
                      className="text-[15px]"
                    >
                      {formatTime(slot.start_time)} –{" "}
                      {formatTime(slot.end_time)}
                    </Text>
                    <Box className="flex-row items-center gap-2">
                      <Switch
                        value={slot.is_active}
                        onValueChange={() => handleToggleActive(slot)}
                        trackColor={{
                          false: colors.border,
                          true: colors.primarySoft,
                        }}
                        thumbColor={
                          slot.is_active ? colors.primary : colors.textMuted
                        }
                      />
                      <Pressable
                        onPress={() => handleDelete(slot)}
                        className="p-2 rounded-lg active:opacity-70"
                      >
                        <Icon as={Trash2} size="sm" color={colors.error} />
                      </Pressable>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          );
        })}
      </ScrollView>

      <Box
        className="px-5 pt-3 pb-5 border-t"
        style={{
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Button
          onPress={() => openSheet()}
          style={{ backgroundColor: colors.secondaryBackgroundGradient }}
          className="h-14 rounded-xl items-center active:opacity-90"
        >
          <ButtonIcon
            as={Plus}
            style={{ color: colors.textInverted }}
            className="mr-2"
          />
          <ButtonText
            style={{
              fontFamily: Fonts.semibold,
              color: colors.textInverted,
              fontSize: 17,
              lineHeight: 22,
            }}
          >
            Add Working Hours
          </ButtonText>
        </Button>
      </Box>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(15,23,42,0.45)" }}
          onPress={() => setSheetOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl px-5 pt-5 pb-8"
            style={{ backgroundColor: colors.surface }}
            onPress={(event) => event.stopPropagation()}
          >
            <Text
              style={{ fontFamily: Fonts.semibold, color: colors.text }}
              className="text-[18px] mb-1"
            >
              Add working hours
            </Text>
            <Text
              style={{
                fontFamily: Fonts.regular,
                color: colors.textSecondary,
              }}
              className="text-[13px] mb-4"
            >
              Pick the days and the window you can take visits.
            </Text>

            <Text
              style={{
                fontFamily: Fonts.semibold,
                color: colors.textSecondary,
                letterSpacing: 0.8,
              }}
              className="text-[12px] uppercase mb-2"
            >
              Days
            </Text>
            <Box className="flex-row flex-wrap gap-2 mb-5">
              {DAYS.map((day) => {
                const active = selectedDays.includes(day.index);
                return (
                  <Pressable
                    key={day.index}
                    onPress={() => toggleDay(day.index)}
                    className="px-3 py-2 rounded-full border active:opacity-70"
                    style={{
                      backgroundColor: active
                        ? colors.primaryTint
                        : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                      borderWidth: active ? 2 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: active ? Fonts.semibold : Fonts.regular,
                        color: active ? colors.primaryDark : colors.text,
                      }}
                      className="text-[14px]"
                    >
                      {day.short}
                    </Text>
                  </Pressable>
                );
              })}
            </Box>

            <Box className="flex-row gap-3 mb-4">
              {(["start", "end"] as const).map((which) => (
                <Box key={which} className="flex-1">
                  <Text
                    style={{
                      fontFamily: Fonts.semibold,
                      color: colors.textSecondary,
                      letterSpacing: 0.8,
                    }}
                    className="text-[12px] uppercase mb-2"
                  >
                    {which === "start" ? "Starts" : "Ends"}
                  </Text>
                  <Pressable
                    onPress={() => setPicker(which)}
                    className="h-14 rounded-xl border justify-center px-4 active:opacity-70"
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: Fonts.medium,
                        color: colors.text,
                      }}
                      className="text-[16px]"
                    >
                      {formatTime(
                        toApiTime(which === "start" ? startTime : endTime),
                      )}
                    </Text>
                  </Pressable>
                </Box>
              ))}
            </Box>

            {!!sheetError && (
              <Box
                className="rounded-xl px-3 py-2 mb-3 border"
                style={{
                  backgroundColor: colors.errorSoft,
                  borderColor: colors.error,
                }}
              >
                <Text
                  style={{ fontFamily: Fonts.regular, color: colors.error }}
                  className="text-[13px] leading-5"
                >
                  {sheetError}
                </Text>
              </Box>
            )}

            <Button
              onPress={handleAddSlots}
              isDisabled={saving}
              style={{ backgroundColor: colors.secondaryBackgroundGradient }}
              className="h-14 rounded-xl items-center active:opacity-90"
            >
              <ButtonText
                style={{
                  fontFamily: Fonts.semibold,
                  color: colors.textInverted,
                  fontSize: 17,
                  lineHeight: 22,
                }}
              >
                {saving ? "Saving…" : "Save"}
              </ButtonText>
            </Button>
          </Pressable>
        </Pressable>

        {picker && (
          <DateTimePicker
            value={picker === "start" ? startTime : endTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={onPickTime}
          />
        )}
      </Modal>
    </>
  );
}
