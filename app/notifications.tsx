import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import {
  isUnread,
  useNotifications,
  type AppNotification,
} from "@/hooks/useNotifications";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CalendarCheck,
  CalendarX2,
  ChevronRight,
  Megaphone,
  Star,
  type LucideIcon,
} from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// `type` is free-form on the backend, so match on keywords. Types sent to
// nurses today: booking_cancelled, review_received.
function iconFor(
  n: AppNotification,
  colors: (typeof Colors)["light"],
): { Icon: LucideIcon; bg: string; fg: string } {
  const t = n.type.toLowerCase();
  if (t.includes("cancel") || t.includes("reject"))
    return { Icon: CalendarX2, bg: colors.errorSoft, fg: colors.error };
  if (t.includes("review") || t.includes("rating"))
    return { Icon: Star, bg: colors.warningSoft, fg: colors.warning };
  if (t.includes("booking") || t.includes("shift") || t.includes("visit"))
    return {
      Icon: CalendarCheck,
      bg: colors.primarySoft,
      fg: colors.primaryDark,
    };
  if (n.audience_type !== "user")
    return { Icon: Megaphone, bg: colors.warningSoft, fg: colors.warning };
  return { Icon: Bell, bg: colors.primarySoft, fg: colors.primaryDark };
}

// booking-detail is keyed on the root booking, so prefer the parent id.
const bookingTarget = (n: AppNotification): string | null =>
  n.data?.parent_booking_id ?? n.data?.booking_id ?? null;

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function sectionTitle(iso: string): string {
  const day = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  if (day === today) return "Today";
  if (day === today - 86_400_000) return "Yesterday";
  return "Earlier";
}

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const {
    notifications,
    loading,
    loadingMore,
    error,
    fetchFirstPage,
    fetchMore,
    markRead,
  } = useNotifications();

  // First focus loads the feed; coming back refreshes the newest page in
  // place and keeps older pages + scroll position.
  const hasLoadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      fetchFirstPage({ mode: hasLoadedRef.current ? "merge" : "replace" });
      hasLoadedRef.current = true;
    }, [fetchFirstPage]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFirstPage();
    setRefreshing(false);
  }, [fetchFirstPage]);

  // The feed arrives newest-first, so grouping in order keeps sections sorted.
  const sections = useMemo(() => {
    const groups: { title: string; data: AppNotification[] }[] = [];
    for (const n of notifications) {
      const title = sectionTitle(n.created_at);
      const last = groups[groups.length - 1];
      if (last?.title === title) last.data.push(n);
      else groups.push({ title, data: [n] });
    }
    return groups;
  }, [notifications]);

  const unreadCount = notifications.filter(isUnread).length;

  useEffect(() => {
    if (loading) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [loading, fadeAnim]);

  const onPressItem = (n: AppNotification) => {
    markRead(n);
    const target = bookingTarget(n);
    if (target)
      router.push({ pathname: "/booking-detail", params: { id: target } });
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const unread = isUnread(item);
    const { Icon: TypeIcon, bg, fg } = iconFor(item, colors);
    const linked = bookingTarget(item) !== null;
    return (
      <Pressable
        onPress={() => onPressItem(item)}
        className="rounded-2xl p-4 mb-3 border active:opacity-80"
        style={{
          backgroundColor: unread ? colors.primaryTint : colors.surface,
          borderColor: unread ? colors.primarySoft : colors.border,
        }}
      >
        <Box className="flex-row items-start">
          <Box
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: bg }}
          >
            <TypeIcon size={18} color={fg} />
          </Box>
          <Box className="flex-1">
            <Box className="flex-row items-start justify-between">
              <Text
                numberOfLines={2}
                className="text-[14px] flex-1 mr-2"
                style={{ fontFamily: Fonts.semibold, color: colors.text }}
              >
                {item.title}
              </Text>
              <Box className="flex-row items-center">
                <Text
                  className="text-[12px]"
                  style={{
                    fontFamily: Fonts.regular,
                    color: colors.textSecondary,
                  }}
                >
                  {relativeTime(item.created_at)}
                </Text>
                {unread ? (
                  <Box
                    className="w-2 h-2 rounded-full ml-1.5"
                    style={{ backgroundColor: colors.primary }}
                  />
                ) : null}
              </Box>
            </Box>
            <Text
              numberOfLines={3}
              className="text-[13px] mt-1"
              style={{
                fontFamily: Fonts.regular,
                color: colors.textSecondary,
                lineHeight: 19,
              }}
            >
              {item.body}
            </Text>
            {linked ? (
              <Box className="flex-row items-center mt-1.5">
                <Text
                  className="text-[12px] mr-1"
                  style={{ fontFamily: Fonts.semibold, color: colors.primary }}
                >
                  View booking
                </Text>
                <ChevronRight size={12} color={colors.primary} />
              </Box>
            ) : null}
          </Box>
        </Box>
      </Pressable>
    );
  };

  const centered = (children: ReactNode) => (
    <Box className="flex-1 justify-center items-center px-6">{children}</Box>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        edges={["top", "left", "right"]}
      >
        <Box className="flex-row items-center px-5 pt-4 pb-3">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Icon as={ArrowLeft} size="xl" style={{ color: colors.text }} />
          </Pressable>
          <Text
            className="text-2xl flex-1"
            style={{ fontFamily: Fonts.bold, color: colors.text }}
          >
            Notifications
          </Text>
          {unreadCount > 0 ? (
            <Box
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <Text
                className="text-[12px]"
                style={{
                  fontFamily: Fonts.semibold,
                  color: colors.primaryDark,
                }}
              >
                {unreadCount} new
              </Text>
            </Box>
          ) : null}
        </Box>

        {loading ? (
          centered(<ActivityIndicator size="large" color={colors.primary} />)
        ) : error && notifications.length === 0 ? (
          <Animated.View className="flex-1" style={{ opacity: fadeAnim }}>
            {centered(
              <>
                <Text
                  className="text-[15px] text-center mb-3"
                  style={{ fontFamily: Fonts.regular, color: colors.text }}
                >
                  {error}
                </Text>
                <Pressable onPress={() => fetchFirstPage()}>
                  <Text
                    className="text-[15px]"
                    style={{
                      fontFamily: Fonts.semibold,
                      color: colors.primary,
                    }}
                  >
                    Retry
                  </Text>
                </Pressable>
              </>,
            )}
          </Animated.View>
        ) : (
          <Animated.View className="flex-1" style={{ opacity: fadeAnim }}>
            <SectionList
              sections={sections}
              keyExtractor={(n) => n.id}
              renderItem={renderItem}
              renderSectionHeader={({ section }) => (
                <Text
                  className="text-[12px] py-2"
                  style={{
                    fontFamily: Fonts.semibold,
                    color: colors.textSecondary,
                    backgroundColor: colors.background,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  {section.title}
                </Text>
              )}
              stickySectionHeadersEnabled
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 24,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
              onEndReached={fetchMore}
              onEndReachedThreshold={0.4}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              ListFooterComponent={
                loadingMore ? (
                  <Box className="py-4 items-center">
                    <ActivityIndicator color={colors.primary} />
                  </Box>
                ) : null
              }
              // A plain View: VirtualizedList clones this element with a style
              // array, which the gluestack Box can't take on web.
              ListEmptyComponent={
                <View style={{ flex: 1 }}>
                  {centered(
                    <>
                      <Box
                        className="w-16 h-16 rounded-full items-center justify-center mb-4"
                        style={{ backgroundColor: colors.primarySoft }}
                      >
                        <BellOff size={28} color={colors.primaryDark} />
                      </Box>
                      <Text
                        className="text-[16px]"
                        style={{
                          fontFamily: Fonts.semibold,
                          color: colors.text,
                        }}
                      >
                        You&apos;re all caught up
                      </Text>
                      <Text
                        className="text-[14px] text-center mt-1"
                        style={{
                          fontFamily: Fonts.regular,
                          color: colors.textSecondary,
                        }}
                      >
                        Booking updates and announcements will show up here.
                      </Text>
                    </>,
                  )}
                </View>
              }
            />
          </Animated.View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
