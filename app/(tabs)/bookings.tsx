import {
  apiErrorMessage,
  formatDay,
  formatTimeRange,
  patientName,
  rootBookings,
  shiftsOf,
  shortAddress,
  statusMeta,
  type Booking,
} from "@/components/bookings/bookingUtils";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import { useFocusEffect, useRouter } from "expo-router";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../../axiosInstance";

const FILTERS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function BookingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("upcoming");

  const fetchBookings = useCallback(async (silent = false) => {
    try {
      const response = await axiosInstance.get("bookings/me");
      setBookings(response.data ?? []);
    } catch (error: any) {
      if (!silent) {
        Alert.alert(
          "Error",
          apiErrorMessage(error, "Could not load your bookings."),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBookings(true);
    }, [fetchBookings]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const visible = useMemo(() => {
    const roots = rootBookings(bookings).sort(
      (a, b) =>
        new Date(a.scheduled_start_time).getTime() -
        new Date(b.scheduled_start_time).getTime(),
    );
    if (filter === "completed") {
      return roots.filter((b) => b.booking_status === "Completed").reverse();
    }
    if (filter === "cancelled") {
      return roots
        .filter((b) => ["Cancelled", "Rejected"].includes(b.booking_status))
        .reverse();
    }
    return roots.filter(
      (b) => !["Completed", "Cancelled", "Rejected"].includes(b.booking_status),
    );
  }, [bookings, filter]);

  const renderCard = (booking: Booking) => {
    const meta = statusMeta(booking.booking_status, colors);
    const shifts = shiftsOf(bookings, booking.id);
    const doneShifts = shifts.filter(
      (s) => s.booking_status === "Completed",
    ).length;

    return (
      <Pressable
        key={booking.id}
        onPress={() =>
          router.push({
            pathname: "/booking-detail",
            params: { id: booking.id },
          })
        }
        className="rounded-2xl p-4 mb-3 border active:opacity-80"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        <Box className="flex-row items-start justify-between">
          <Box className="flex-1 pr-3">
            <Text
              style={{ fontFamily: Fonts.semibold, color: colors.text }}
              className="text-[16px]"
            >
              {patientName(booking)}
            </Text>
            <Text
              style={{ fontFamily: Fonts.regular, color: colors.textSecondary }}
              className="text-[14px] mt-0.5"
            >
              {booking.service?.service_name}
            </Text>
          </Box>
          <Box
            className="px-2 py-1 rounded-full border"
            style={{ backgroundColor: meta.bg, borderColor: meta.border }}
          >
            <Text
              style={{ fontFamily: Fonts.semibold, color: meta.fg }}
              className="text-[11px] uppercase"
            >
              {meta.label}
            </Text>
          </Box>
        </Box>

        <Box className="flex-row items-center gap-2 mt-3">
          <Icon as={CalendarDays} size="sm" style={{ color: colors.icon }} />
          <Text
            style={{ fontFamily: Fonts.medium, color: colors.text }}
            className="text-[14px]"
          >
            {formatDay(booking.scheduled_start_time)} ·{" "}
            {formatTimeRange(
              booking.scheduled_start_time,
              booking.scheduled_end_time,
            )}
          </Text>
        </Box>

        {!!shortAddress(booking.booking_address) && (
          <Box className="flex-row items-center gap-2 mt-2">
            <Icon as={MapPin} size="sm" style={{ color: colors.icon }} />
            <Text
              style={{ fontFamily: Fonts.regular, color: colors.textSecondary }}
              className="text-[13px] flex-1"
              numberOfLines={1}
            >
              {shortAddress(booking.booking_address)}
            </Text>
          </Box>
        )}

        <Box className="flex-row items-center justify-between mt-3">
          <Text
            style={{ fontFamily: Fonts.semibold, color: colors.primary }}
            className="text-[15px]"
          >
            ₹{booking.total_amount}
            {shifts.length > 0 ? (
              <Text
                style={{
                  fontFamily: Fonts.regular,
                  color: colors.textSecondary,
                }}
                className="text-[13px]"
              >
                {"  "}
                {doneShifts}/{shifts.length} visits done
              </Text>
            ) : null}
          </Text>
          <Icon
            as={ChevronRight}
            size="sm"
            style={{ color: colors.iconMuted }}
          />
        </Box>
      </Pressable>
    );
  };

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
          Bookings
        </Text>

        <Box
          className="flex-row mt-4 p-1 rounded-xl"
          style={{ backgroundColor: colors.surfaceMuted }}
        >
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
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
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      {loading ? (
        <Box className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </Box>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {visible.length === 0 ? (
            <Box className="items-center mt-16">
              <Icon
                as={CalendarDays}
                size="xl"
                style={{ color: colors.iconMuted }}
              />
              <Text
                style={{ fontFamily: Fonts.semibold, color: colors.text }}
                className="text-[16px] mt-3"
              >
                Nothing here yet
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.regular,
                  color: colors.textSecondary,
                }}
                className="text-[14px] mt-1 text-center"
              >
                {filter === "upcoming"
                  ? "New bookings will show up here once patients book you."
                  : `You have no ${filter} bookings.`}
              </Text>
            </Box>
          ) : (
            visible.map(renderCard)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
