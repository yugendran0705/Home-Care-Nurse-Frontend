import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { CalendarOff, Pencil, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
} from "react-native";
import axiosInstance from "../../axiosInstance";

interface BlackoutDate {
  id: string;
  nurse_id: string;
  start_datetime: string;
  end_datetime: string;
  reason?: string | null;
}

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * The API requires start_datetime to be in the future, so a range that begins
 * today (or an ongoing one being edited) starts from now rather than midnight.
 */
const apiStartDatetime = (date: Date) => {
  const midnight = startOfDay(date);
  const now = new Date();
  return midnight < now ? new Date(now.getTime() + 60_000) : midnight;
};

const endOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 0);
  return copy;
};

const formatDate = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const dayCount = (start: string, end: string) => {
  const from = startOfDay(new Date(start)).getTime();
  const to = startOfDay(new Date(end)).getTime();
  return Math.max(1, Math.round((to - from) / 86400000) + 1);
};

const apiErrorMessage = (error: any, fallback: string) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
};

export function TimeOffPanel() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [blackouts, setBlackouts] = useState<BlackoutDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BlackoutDate | null>(null);
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());
  const [reason, setReason] = useState("");
  const [picker, setPicker] = useState<"start" | "end" | null>(null);
  const [sheetError, setSheetError] = useState("");

  const fetchBlackouts = useCallback(async () => {
    try {
      const response = await axiosInstance.get("blackout-dates/me");
      setBlackouts(response.data ?? []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        apiErrorMessage(error, "Could not load your time off."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBlackouts();
    }, [fetchBlackouts]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBlackouts();
    setRefreshing(false);
  }, [fetchBlackouts]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const sorted = [...blackouts].sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() -
        new Date(b.start_datetime).getTime(),
    );
    return {
      upcoming: sorted.filter(
        (item) => new Date(item.end_datetime).getTime() >= now,
      ),
      past: sorted
        .filter((item) => new Date(item.end_datetime).getTime() < now)
        .reverse(),
    };
  }, [blackouts]);

  const openSheet = (existing?: BlackoutDate) => {
    setEditing(existing ?? null);
    setStartDate(existing ? new Date(existing.start_datetime) : new Date());
    setEndDate(existing ? new Date(existing.end_datetime) : new Date());
    setReason(existing?.reason ?? "");
    setSheetError("");
    setSheetOpen(true);
  };

  const onPickDate = (event: DateTimePickerEvent, selected?: Date) => {
    const which = picker;
    setPicker(Platform.OS === "ios" ? which : null);
    if (event.type === "dismissed" || !selected) return;
    if (which === "start") {
      setStartDate(selected);
      // Keep the range valid rather than letting the API reject it later.
      if (selected > endDate) setEndDate(selected);
    }
    if (which === "end") setEndDate(selected);
  };

  const handleSave = async () => {
    if (saving) return;
    if (endOfDay(endDate) < startOfDay(startDate)) {
      setSheetError("The end date can't be before the start date.");
      return;
    }

    setSaving(true);
    setSheetError("");
    const payload = {
      start_datetime: apiStartDatetime(startDate).toISOString(),
      end_datetime: endOfDay(endDate).toISOString(),
      reason: reason.trim() || null,
    };

    try {
      if (editing) {
        await axiosInstance.put(`blackout-dates/${editing.id}`, payload);
      } else {
        await axiosInstance.post("blackout-dates/", payload);
      }
      setSheetOpen(false);
      await fetchBlackouts();
    } catch (error: any) {
      setSheetError(
        apiErrorMessage(error, "Could not save this time off. Try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: BlackoutDate) => {
    Alert.alert(
      "Remove time off",
      `Remove ${formatDate(item.start_datetime)} – ${formatDate(
        item.end_datetime,
      )}? Patients will be able to book you on these days again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(`blackout-dates/${item.id}`);
              setBlackouts((prev) =>
                prev.filter((entry) => entry.id !== item.id),
              );
            } catch (error: any) {
              Alert.alert(
                "Error",
                apiErrorMessage(error, "Could not remove this time off."),
              );
            }
          },
        },
      ],
    );
  };

  const renderItem = (item: BlackoutDate, isPast: boolean) => (
    <Box
      key={item.id}
      className="rounded-2xl p-4 mb-3 border"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        opacity: isPast ? 0.7 : 1,
      }}
    >
      <Box className="flex-row items-start justify-between">
        <Box className="flex-1 pr-3">
          <Text
            style={{ fontFamily: Fonts.semibold, color: colors.text }}
            className="text-[16px]"
          >
            {formatDate(item.start_datetime)}
            {dayCount(item.start_datetime, item.end_datetime) > 1
              ? ` – ${formatDate(item.end_datetime)}`
              : ""}
          </Text>
          <Text
            style={{ fontFamily: Fonts.regular, color: colors.textSecondary }}
            className="text-[13px] mt-1"
          >
            {dayCount(item.start_datetime, item.end_datetime)}{" "}
            {dayCount(item.start_datetime, item.end_datetime) === 1
              ? "day"
              : "days"}
            {item.reason ? ` · ${item.reason}` : ""}
          </Text>
        </Box>
        {!isPast && (
          <Box className="flex-row items-center gap-1">
            <Pressable
              onPress={() => openSheet(item)}
              className="p-2 rounded-lg active:opacity-70"
            >
              <Icon as={Pencil} size="sm" color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item)}
              className="p-2 rounded-lg active:opacity-70"
            >
              <Icon as={Trash2} size="sm" color={colors.error} />
            </Pressable>
          </Box>
        )}
      </Box>
    </Box>
  );

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
          <Icon as={CalendarOff} color={colors.primary} />
          <Text
            style={{ fontFamily: Fonts.regular, color: colors.primaryDark }}
            className="text-[13px] flex-1 leading-5"
          >
            Days marked here override your working hours, so no one can book you
            on them.
          </Text>
        </Box>

        {blackouts.length === 0 ? (
          <Box className="items-center mt-12">
            <Icon as={CalendarOff} size="xl" color={colors.iconMuted} />
            <Text
              style={{ fontFamily: Fonts.semibold, color: colors.text }}
              className="text-[16px] mt-3"
            >
              No time off yet
            </Text>
            <Text
              style={{
                fontFamily: Fonts.regular,
                color: colors.textSecondary,
              }}
              className="text-[14px] mt-1 text-center"
            >
              Add the days you&apos;re unavailable and we&apos;ll keep them
              free.
            </Text>
          </Box>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text
                  style={{
                    fontFamily: Fonts.semibold,
                    color: colors.textSecondary,
                    letterSpacing: 0.8,
                  }}
                  className="text-[12px] uppercase mb-2"
                >
                  Upcoming
                </Text>
                {upcoming.map((item) => renderItem(item, false))}
              </>
            )}

            {past.length > 0 && (
              <>
                <Divider
                  className="my-4"
                  style={{ backgroundColor: colors.border }}
                />
                <Text
                  style={{
                    fontFamily: Fonts.semibold,
                    color: colors.textSecondary,
                    letterSpacing: 0.8,
                  }}
                  className="text-[12px] uppercase mb-2"
                >
                  Past
                </Text>
                {past.map((item) => renderItem(item, true))}
              </>
            )}
          </>
        )}
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
            Add Time Off
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
              className="text-[18px] mb-4"
            >
              {editing ? "Edit time off" : "Add time off"}
            </Text>

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
                    {which === "start" ? "From" : "To"}
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
                      style={{ fontFamily: Fonts.medium, color: colors.text }}
                      className="text-[15px]"
                    >
                      {formatDate(which === "start" ? startDate : endDate)}
                    </Text>
                  </Pressable>
                </Box>
              ))}
            </Box>

            <Text
              style={{
                fontFamily: Fonts.semibold,
                color: colors.textSecondary,
                letterSpacing: 0.8,
              }}
              className="text-[12px] uppercase mb-2"
            >
              Reason (optional)
            </Text>
            <Input
              className="mb-4 rounded-xl h-14 pl-3 border"
              size="md"
              style={{
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              }}
            >
              <InputField
                style={{ fontFamily: Fonts.regular, color: colors.text }}
                placeholder="eg: Vacation"
                placeholderTextColor={colors.textMuted}
                cursorColor={colors.cursorColor}
                value={reason}
                onChangeText={setReason}
                maxLength={255}
              />
            </Input>

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
              onPress={handleSave}
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
            value={picker === "start" ? startDate : endDate}
            mode="date"
            display="default"
            minimumDate={picker === "end" ? startDate : new Date()}
            onChange={onPickDate}
          />
        )}
      </Modal>
    </>
  );
}
