import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  CalendarDays,
  Dock,
  Edit,
  LocationEdit,
  LogOut,
  LucideArrowRight,
  Mars,
  Phone,
  ShieldCheckIcon,
  ShieldOffIcon,
  Star,
  User as UserIcon,
  Venus,
} from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../../axiosInstance";
import { Colors } from "../../constants/Colors";
import { Fonts } from "../../constants/Typography";

interface User {
  id: string;
  email: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface Address {
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: string;
  longitude: string;
  is_primary: boolean;
  id: string;
  user_id: string;
}

interface Nurse {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  license_number: string;
  years_of_experience: number;
  bio: string;
  profile_picture_url: string;
  id: string;
  is_verified: boolean;
  average_rating: string;
  user: User;
  primary_address: Address;
}

interface Service {
  service_name: string;
  description: string;
  base_price: string;
  duration: number;
  duration_type: string;
  is_active: boolean;
  is_qualified: boolean;
  id: string;
}

interface Profile {
  nurse: Nurse;
  services: Service[];
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isFirstMount = useRef(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [address, setAddress] = useState<Address[] | null>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const router = useRouter();
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchProfile = useCallback(async () => {
    try {
      const [profileResponse, addressResponse] = await Promise.all([
        axiosInstance.get("nurses/me"),
        axiosInstance.get("addresses/me"),
      ]);
      setProfile(profileResponse.data);
      setAddress([...addressResponse.data].reverse());

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        "profile",
        JSON.stringify(profileResponse.data),
      );
      await AsyncStorage.setItem(
        "addresses",
        JSON.stringify(addressResponse.data),
      );

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (e: any) {
      console.log("Failed to fetch profile", e.message || e);
    } finally {
      setLoading(false);
    }
  }, [fadeAnim]);

  const loadFromAsyncStorage = useCallback(async () => {
    try {
      const profileData = await AsyncStorage.getItem("profile");
      const addressesData = await AsyncStorage.getItem("addresses");

      if (profileData) {
        setProfile(JSON.parse(profileData));
      }
      if (addressesData) {
        setAddress(JSON.parse(addressesData));
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (e: any) {
      console.error("Failed to load from AsyncStorage:", e);
    }
  }, [fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        if (isFirstMount.current) {
          // First mount: fetch from API
          await fetchProfile();
          isFirstMount.current = false;
        } else {
          // Subsequent mounts: load from AsyncStorage
          await loadFromAsyncStorage();
        }
        setLoading(false);
      };
      loadData();
    }, [fetchProfile, loadFromAsyncStorage]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("access_token");
          await AsyncStorage.removeItem("refresh_token");
          await AsyncStorage.removeItem("profile");
          await AsyncStorage.removeItem("addresses");
          router.replace("/sign-in");
        },
      },
    ]);
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

  if (!profile) {
    return (
      <Box
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ fontFamily: Fonts.regular, color: colors.text }}>
          Failed to load profile. Please try again later.
        </Text>
      </Box>
    );
  }

  const renderPersonalInfo = () => (
    <>
      <VStack
        space="lg"
        style={{
          backgroundColor: colors.secondaryBackground,
          borderColor: colors.border,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }}
        className="rounded-2xl p-5 mb-4 border"
      >
        <Box className="flex-row justify-between">
          <Text
            style={{ fontFamily: Fonts.semibold, color: colors.text }}
            className="text-[18px]"
          >
            Personal Information
          </Text>
          <Pressable
            className="p-1 rounded-lg"
            onPress={() => router.push("/edit-personal-details")}
          >
            <Icon as={Edit} style={{ color: colors.primary }} />
          </Pressable>
        </Box>

        <Divider style={{ backgroundColor: colors.border }} />
        <Box className="flex-row items-center mb-2 gap-4">
          <Icon as={Phone} style={{ color: colors.icon }} />
          <Text
            style={{ fontFamily: Fonts.regular, color: colors.text }}
            className="text-lg "
          >
            {profile.nurse.phone_number}
          </Text>
        </Box>
        <Box className="flex-row items-center mb-2 gap-4">
          <Icon as={CalendarDays} style={{ color: colors.icon }} />
          <Text
            style={{ fontFamily: Fonts.regular, color: colors.text }}
            className="text-lg "
          >
            {new Date(profile.nurse.date_of_birth).toLocaleDateString()}
          </Text>
        </Box>
        <Box className="flex-row items-center gap-4">
          <Icon
            as={profile.nurse.gender === "Male" ? Mars : Venus}
            style={{ color: colors.text }}
          />
          <Text
            style={{ fontFamily: Fonts.regular, color: colors.text }}
            className="text-lg "
          >
            {profile.nurse.gender}
          </Text>
        </Box>
      </VStack>
    </>
  );

  const renderProfessionalDetails = () => (
    <VStack
      space="lg"
      style={{
        backgroundColor: colors.secondaryBackground,
        borderColor: colors.border,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}
      className="rounded-2xl p-5 mb-4 border"
    >
      <Text
        style={{ fontFamily: Fonts.semibold, color: colors.text }}
        className="text-[18px]"
      >
        Professional Details
      </Text>
      <Divider style={{ backgroundColor: colors.border }} />
      <Box className="flex-row items-center mb-2 gap-4">
        <Icon as={BriefcaseBusiness} style={{ color: colors.icon }} />
        <Text
          style={{ fontFamily: Fonts.regular, color: colors.text }}
          className="text-lg "
        >
          {profile.nurse.years_of_experience} years of experience
        </Text>
      </Box>
      <Box className="flex-row items-center mb-2 gap-4">
        <Icon as={Dock} style={{ color: colors.icon }} />
        <Text
          style={{ fontFamily: Fonts.regular, color: colors.text }}
          className="text-lg "
        >
          License: {profile.nurse.license_number}
        </Text>
      </Box>
      <Box className="flex-row items-center gap-4">
        <Icon as={Star} style={{ color: colors.accent }} />
        <Text
          style={{ fontFamily: Fonts.regular, color: colors.text }}
          className="text-lg "
        >
          Rating: {profile.nurse.average_rating}
        </Text>
      </Box>
      {profile.nurse.bio ? (
        <Box className="flex-row items-center gap-4">
          <Icon as={UserIcon} style={{ color: colors.icon }} />
          <Text
            style={{ fontFamily: Fonts.regular, color: colors.text }}
            className="text-lg "
          >
            {profile.nurse.bio}
          </Text>
        </Box>
      ) : null}
    </VStack>
  );

  const renderServices = () => (
    <VStack
      space="lg"
      style={{
        backgroundColor: colors.secondaryBackground,
        borderColor: colors.border,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}
      className="rounded-2xl p-5 mb-4 border"
    >
      <Box className="flex-row justify-between">
        <Text
          style={{ fontFamily: Fonts.semibold, color: colors.text }}
          className="text-[18px]"
        >
          Services
        </Text>
        <Pressable
          className="p-1 rounded-lg"
          onPress={() => router.push("/edit-services")}
        >
          <Icon as={Edit} style={{ color: colors.primary }} />
        </Pressable>
      </Box>
      <Divider style={{ backgroundColor: colors.border }} />
      <Box style={{ maxHeight: 190 }}>
        <ScrollView
          // showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          nestedScrollEnabled
        >
          {!profile.services || profile.services.length === 0 ? (
            <Box className="flex flex-col items-center">
              <Text
                className="text-xl"
                style={{ color: colors.text, fontFamily: Fonts.regular }}
              >
                Choose a service.
              </Text>
            </Box>
          ) : (
            profile.services.map((service) => {
              return (
                <Box
                  key={service.id}
                  className="rounded-xl border"
                  style={{
                    backgroundColor: colors.primaryTint,
                    borderColor: colors.primarySoft,
                  }}
                >
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/service-page",
                        params: {
                          id: service.id,
                        },
                      })
                    }
                    className="flex-row justify-between items-center px-4 py-3"
                  >
                    <Text
                      style={{
                        fontFamily: Fonts.semibold,
                        color: colors.primaryDark,
                      }}
                      className="text-[16px]"
                    >
                      {service.service_name}
                    </Text>

                    <Icon
                      as={LucideArrowRight}
                      style={{ color: colors.primary }}
                    />
                  </Pressable>
                </Box>
              );
            })
          )}
        </ScrollView>
      </Box>
    </VStack>
  );

  const renderAddresses = () => (
    <VStack
      space="lg"
      style={{
        backgroundColor: colors.secondaryBackground,
        borderColor: colors.border,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}
      className="rounded-2xl p-5 mb-4 border"
    >
      <Box className="flex-row justify-between">
        <Text
          style={{ fontFamily: Fonts.semibold, color: colors.text }}
          className="text-[18px]"
        >
          Addresses
        </Text>
        <Pressable
          className="p-1 rounded-lg"
          onPress={() => {
            router.push("/manage-addresses");
          }}
        >
          <Icon as={Edit} style={{ color: colors.primary }} />
        </Pressable>
      </Box>
      <Divider style={{ backgroundColor: colors.border }} />
      <Box style={{ maxHeight: 250 }}>
        <ScrollView
          // showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          nestedScrollEnabled
        >
          {address?.map((address) => (
            <Box
              key={address.id}
              className="flex-row items-start gap-3 p-3 rounded-xl"
              style={{
                backgroundColor: address.is_primary
                  ? colors.primaryTint
                  : colors.surfaceMuted,
                borderWidth: 1,
                borderColor: address.is_primary
                  ? colors.primarySoft
                  : colors.border,
              }}
            >
              <Icon as={LocationEdit} style={{ color: colors.primary }} />
              <Box className="flex-1 flex-row items-start justify-between">
                <Text
                  style={{ fontFamily: Fonts.regular, color: colors.text }}
                  className="text-[15px] leading-6"
                >
                  {address.address_line_1 ? `${address.address_line_1},\n` : ""}
                  {address.address_line_2 ? `${address.address_line_2},\n` : ""}
                  {address.city},{"\n"}
                  {address.state},{"\n"}
                  {address.pincode}.
                </Text>
              </Box>
              {address.is_primary && (
                <Box
                  style={{ backgroundColor: colors.accent }}
                  className="rounded-full px-2 py-1"
                >
                  <Text
                    style={{ fontFamily: Fonts.semibold, color: colors.text }}
                    className="text-[10px] uppercase"
                  >
                    Primary
                  </Text>
                </Box>
              )}
            </Box>
          ))}
        </ScrollView>
      </Box>
    </VStack>
  );

  const initials = `${profile.nurse.first_name?.[0] ?? ""}${
    profile.nurse.last_name?.[0] ?? ""
  }`.toUpperCase();

  const avatarStyle = {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    marginBottom: 14,
  } as const;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="py-[20px]"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        nestedScrollEnabled
      >
        <Animated.View className="px-6" style={{ opacity: fadeAnim }}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              paddingVertical: 24,
              alignItems: "center",
              marginBottom: 20,
              shadowColor: colors.primaryDeep,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            {profile.nurse.profile_picture_url && !avatarFailed ? (
              <Image
                source={{ uri: profile.nurse.profile_picture_url }}
                style={avatarStyle}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <Box
                style={[
                  avatarStyle,
                  {
                    backgroundColor: "rgba(255,255,255,0.16)",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: Fonts.semibold,
                    color: colors.textInverted,
                  }}
                  className="text-[36px]"
                >
                  {initials}
                </Text>
              </Box>
            )}
            <Text
              style={{ fontFamily: Fonts.bold, color: colors.textInverted }}
              className="text-[22px]"
            >{`${profile.nurse.first_name} ${profile.nurse.last_name}`}</Text>
            <Text
              style={{
                fontFamily: Fonts.regular,
                color: colors.textMutedInverted,
              }}
              className="text-[14px] mt-1"
            >
              {profile.nurse.user.email}
            </Text>
            <Box
              className="flex-row items-center gap-1.5 mt-3 py-1 px-3 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
            >
              <Icon
                as={profile.nurse.is_verified ? ShieldCheckIcon : ShieldOffIcon}
                style={{
                  color: profile.nurse.is_verified
                    ? colors.textInverted
                    : colors.accent,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: profile.nurse.is_verified
                    ? colors.textInverted
                    : colors.accent,
                  fontFamily: Fonts.semibold,
                }}
              >
                {profile.nurse.is_verified ? "Verified" : "Not Verified"}
              </Text>
            </Box>
          </LinearGradient>

          <Box className="mb-2">
            {renderPersonalInfo()}
            {renderProfessionalDetails()}
            {renderServices()}
            {renderAddresses()}
          </Box>

          <Button
            className="rounded-xl h-14 mt-2 mb-10 border active:opacity-80"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            onPress={handleLogout}
          >
            <ButtonIcon
              as={LogOut}
              style={{ color: colors.error }}
              className="mr-2"
            />
            <ButtonText
              style={{
                fontFamily: Fonts.semibold,
                color: colors.error,
                fontSize: 16,
                lineHeight: 22,
              }}
            >
              Log Out
            </ButtonText>
          </Button>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
