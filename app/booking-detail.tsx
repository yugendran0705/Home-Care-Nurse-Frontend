import {
  apiErrorMessage,
  formatDay,
  formatTimeRange,
  isCompletable,
  patientName,
  shiftsOf,
  shortAddress,
  statusMeta,
  type Booking,
} from "@/components/bookings/bookingUtils";
import { CompleteVisitSheet } from "@/components/bookings/CompleteVisitSheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Phone,
  StickyNote,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../axiosInstance";

export default function BookingDetailScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { id } = useLocalSearchParams<{ id: string }>();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async (silent = false) => {
    try {
      const response = await axiosInstance.get("bookings/me");
      setBookings(response.data ?? []);
    } catch (error: any) {
      if (!silent) {
        Alert.alert(
          "Error",
          apiErrorMessage(error, "Could not load this booking."),
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

  const booking = bookings.find((item) => item.id === id);
  const shifts = useMemo(
    () => (id ? shiftsOf(bookings, id) : []),
    [bookings, id],
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

  if (!booking) {
    return (
      <Box
        className="flex-1 justify-center items-center px-8"
        style={{ backgroundColor: colors.background }}
      >
        <Text
          style={{ fontFamily: Fonts.regular, color: colors.textSecondary }}
          className="text-[15px] text-center"
        >
          This booking is no longer available.
        </Text>
      </Box>
    );
  }

  const meta = statusMeta(booking.booking_status, colors);
  const phone = booking.patient?.phone_number;
  // A Continuous booking is a single visit completed directly; a Daily_Shift
  // parent is closed out one shift at a time.
  const canCompleteWhole = shifts.length === 0 && isCompletable(booking);

  const infoRow = (icon: any, label: string, value: string) => (
    <Box className="flex-row items-start gap-3 mt-3">
      <Icon as={icon} size="sm" style={{ color: colors.icon }} />
      <Box className="flex-1">
        <Text
          style={{
            fontFamily: Fonts.semibold,
            color: colors.textSecondary,
            letterSpacing: 0.8,
          }}
          className="text-[11px] uppercase"
        >
          {label}
        </Text>
        <Text
          style={{ fontFamily: Fonts.regular, color: colors.text }}
          className="text-[15px] mt-0.5 leading-5"
        >
          {value}
        </Text>
      </Box>
    </Box>
  );

  const card = (children: React.ReactNode) => (
    <Box
      className="rounded-2xl p-4 mb-3 border"
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
      {children}
    </Box>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Box className="flex-row gap-4 items-center px-3 mt-5">
          <Pressable onPress={() => router.back()} className="ml-2">
            <Icon as={ArrowLeft} size="xl" color={colors.text} />
          </Pressable>
          <Text
            className="text-2xl"
            style={{ fontFamily: Fonts.semibold, color: colors.text }}
          >
            Booking
          </Text>
        </Box>

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
          {card(
            <>
              <Box className="flex-row items-start justify-between">
                <Box className="flex-1 pr-3">
                  <Text
                    style={{ fontFamily: Fonts.bold, color: colors.text }}
                    className="text-[20px]"
                  >
                    {booking.service?.service_name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.regular,
                      color: colors.textSecondary,
                    }}
                    className="text-[14px] mt-0.5"
                  >
                    for {patientName(booking)}
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

              <Divider
                className="my-3"
                style={{ backgroundColor: colors.border }}
              />

              {infoRow(
                CalendarDays,
                "When",
                `${formatDay(booking.scheduled_start_time)} · ${formatTimeRange(
                  booking.scheduled_start_time,
                  booking.scheduled_end_time,
                )}`,
              )}
              {!!shortAddress(booking.booking_address) &&
                infoRow(MapPin, "Where", shortAddress(booking.booking_address))}
              {!!booking.notes && infoRow(StickyNote, "Notes", booking.notes)}

              <Box className="flex-row items-center justify-between mt-4">
                <Text
                  style={{
                    fontFamily: Fonts.semibold,
                    color: colors.textSecondary,
                    letterSpacing: 0.8,
                  }}
                  className="text-[11px] uppercase"
                >
                  Total
                </Text>
                <Text
                  style={{ fontFamily: Fonts.bold, color: colors.primary }}
                  className="text-[18px]"
                >
                  ₹{booking.total_amount}
                </Text>
              </Box>
            </>,
          )}

          {!!phone &&
            card(
              <Pressable
                onPress={() => Linking.openURL(`tel:${phone}`)}
                className="flex-row items-center gap-3 active:opacity-70"
              >
                <Icon as={Phone} style={{ color: colors.primary }} />
                <Box className="flex-1">
                  <Text
                    style={{ fontFamily: Fonts.medium, color: colors.text }}
                    className="text-[15px]"
                  >
                    {phone}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.regular,
                      color: colors.textSecondary,
                    }}
                    className="text-[13px]"
                  >
                    Call {patientName(booking)}
                  </Text>
                </Box>
              </Pressable>,
            )}

          {shifts.length > 0 &&
            card(
              <>
                <Text
                  style={{ fontFamily: Fonts.semibold, color: colors.text }}
                  className="text-[16px]"
                >
                  Visits
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.regular,
                    color: colors.textSecondary,
                  }}
                  className="text-[13px] mt-0.5"
                >
                  Each visit is completed on its own with the patient&apos;s
                  code.
                </Text>
                <Divider
                  className="my-3"
                  style={{ backgroundColor: colors.border }}
                />
                {shifts.map((shift, index) => {
                  const shiftMeta = statusMeta(shift.booking_status, colors);
                  const completable = isCompletable(shift);
                  return (
                    <Box
                      key={shift.id}
                      className={index > 0 ? "mt-4" : ""}
                      style={{
                        opacity: shift.booking_status === "Cancelled" ? 0.6 : 1,
                      }}
                    >
                      <Box className="flex-row items-center justify-between">
                        <Box className="flex-1 pr-2">
                          <Text
                            style={{
                              fontFamily: Fonts.medium,
                              color: colors.text,
                            }}
                            className="text-[15px]"
                          >
                            {formatDay(shift.scheduled_start_time)}
                          </Text>
                          <Text
                            style={{
                              fontFamily: Fonts.regular,
                              color: colors.textSecondary,
                            }}
                            className="text-[13px] mt-0.5"
                          >
                            {formatTimeRange(
                              shift.scheduled_start_time,
                              shift.scheduled_end_time,
                            )}
                          </Text>
                        </Box>
                        {shift.booking_status === "Completed" ? (
                          <Box className="flex-row items-center gap-1">
                            <Icon
                              as={CheckCircle2}
                              size="sm"
                              style={{ color: colors.success }}
                            />
                            <Text
                              style={{
                                fontFamily: Fonts.semibold,
                                color: colors.success,
                              }}
                              className="text-[12px]"
                            >
                              Done
                            </Text>
                          </Box>
                        ) : completable ? (
                          <Pressable
                            onPress={() => setCompleting(shift)}
                            className="px-3 py-2 rounded-lg border active:opacity-70"
                            style={{
                              backgroundColor: colors.primaryTint,
                              borderColor: colors.primary,
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: Fonts.semibold,
                                color: colors.primaryDark,
                              }}
                              className="text-[13px]"
                            >
                              Complete
                            </Text>
                          </Pressable>
                        ) : (
                          <Box
                            className="px-2 py-1 rounded-full border"
                            style={{
                              backgroundColor: shiftMeta.bg,
                              borderColor: shiftMeta.border,
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: Fonts.semibold,
                                color: shiftMeta.fg,
                              }}
                              className="text-[11px] uppercase"
                            >
                              {shiftMeta.label}
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </>,
            )}
        </ScrollView>

        {canCompleteWhole && (
          <Box
            className="px-5 pt-3 pb-5 border-t"
            style={{
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Button
              onPress={() => setCompleting(booking)}
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
                Complete visit
              </ButtonText>
            </Button>
          </Box>
        )}

        <CompleteVisitSheet
          booking={completing}
          onClose={() => setCompleting(null)}
          onCompleted={async () => {
            setCompleting(null);
            await fetchBookings(true);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
