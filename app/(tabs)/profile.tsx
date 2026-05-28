import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import React, { useCallback, useState } from "react";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [address, setAddress] = useState<Address[] | null>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
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
          router.replace("/sign-in");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Box className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#4c8bf5" />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box className="flex-1 justify-center items-center bg-black">
        <Text style={{ fontFamily: "Sen" }} className="text-white">
          Failed to load profile. Please try again later.
        </Text>
      </Box>
    );
  }

  const renderPersonalInfo = () => (
    <>
      <VStack
        space="lg"
        style={{ backgroundColor: colors.secondaryBackground }}
        className="rounded-[12px] p-4 mb-4"
      >
        <Box className="flex-row justify-between">
          <Text
            style={{ fontFamily: "Sen_Bold", color: colors.text }}
            className="text-[18px]"
          >
            Personal Information
          </Text>
          <Pressable
            className="p-1 rounded-lg"
            onPress={() => router.push("/edit-personal-details")}
          >
            <Icon as={Edit} style={{ color: colors.text }} />
          </Pressable>
        </Box>

        <Divider className="bg-gray-300" />
        <Box className="flex-row items-center mb-2 gap-4">
          <Icon as={Phone} style={{ color: colors.text }} />
          <Text
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-lg "
          >
            {profile.nurse.phone_number}
          </Text>
        </Box>
        <Box className="flex-row items-center mb-2 gap-4">
          <Icon as={CalendarDays} style={{ color: colors.text }} />
          <Text
            style={{ fontFamily: "Sen", color: colors.text }}
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
            style={{ fontFamily: "Sen", color: colors.text }}
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
      style={{ backgroundColor: colors.secondaryBackground }}
      className="rounded-[12px] p-4 mb-4"
    >
      <Text
        style={{ fontFamily: "Sen_Bold", color: colors.text }}
        className="text-[18px]"
      >
        Professional Details
      </Text>
      <Divider className="bg-gray-300" />
      <Box className="flex-row items-center mb-2 gap-4">
        <Icon as={BriefcaseBusiness} style={{ color: colors.text }} />
        <Text
          style={{ fontFamily: "Sen", color: colors.text }}
          className="text-lg "
        >
          {profile.nurse.years_of_experience} years of experience
        </Text>
      </Box>
      <Box className="flex-row items-center mb-2 gap-4">
        <Icon as={Dock} style={{ color: colors.text }} />
        <Text
          style={{ fontFamily: "Sen", color: colors.text }}
          className="text-lg "
        >
          License: {profile.nurse.license_number}
        </Text>
      </Box>
      <Box className="flex-row items-center gap-4">
        <Icon as={Star} style={{ color: colors.text }} />
        <Text
          style={{ fontFamily: "Sen", color: colors.text }}
          className="text-lg "
        >
          Rating: {profile.nurse.average_rating}
        </Text>
      </Box>
      {profile.nurse.bio ? (
        <Box className="flex-row items-center gap-4">
          <Icon as={UserIcon} style={{ color: colors.text }} />
          <Text
            style={{ fontFamily: "Sen", color: colors.text }}
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
      style={{ backgroundColor: colors.secondaryBackground }}
      className="rounded-[12px] p-4 mb-4"
    >
      <Box className="flex-row justify-between">
        <Text
          style={{ fontFamily: "Sen_Bold", color: colors.text }}
          className="text-[18px]"
        >
          Services
        </Text>
        <Pressable
          className="p-1 rounded-lg"
          onPress={() => router.push("/edit-services")}
        >
          <Icon as={Edit} style={{ color: colors.text }} />
        </Pressable>
      </Box>
      <Divider className="bg-gray-300" />
      <Box style={{ maxHeight: 190 }}>
        <ScrollView
          // showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          nestedScrollEnabled
        >
          {profile.services.map((service) => {
            return (
              <Box
                key={service.id}
                className="rounded-xl mr-4"
                style={{
                  backgroundColor: colors.secondaryBackgroundGradient,
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
                    style={{ fontFamily: "Sen", color: colors.text }}
                    className="text-lg"
                  >
                    {service.service_name}
                  </Text>

                  <Icon as={LucideArrowRight} style={{ color: colors.text }} />
                </Pressable>
              </Box>
            );
          })}
        </ScrollView>
      </Box>
    </VStack>
  );

  const renderAddresses = () => (
    <VStack
      space="lg"
      style={{ backgroundColor: colors.secondaryBackground }}
      className="rounded-[12px] p-4 mb-4"
    >
      <Box className="flex-row justify-between">
        <Text
          style={{ fontFamily: "Sen_Bold", color: colors.text }}
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
          <Icon as={Edit} style={{ color: colors.text }} />
        </Pressable>
      </Box>
      <Divider className="bg-gray-300" />
      <Box style={{ maxHeight: 250 }}>
        <ScrollView
          // showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          nestedScrollEnabled
        >
          {address?.map((address) => (
            <Box
              key={address.id}
              className="flex-row items-start gap-4 p-2 rounded-lg"
              style={{ backgroundColor: colors.secondaryBackgroundGradient }}
            >
              <Icon as={LocationEdit} style={{ color: colors.text }} />
              <Box className="flex-1 flex-row items-start justify-between">
                <Text
                  style={{ fontFamily: "Sen", color: colors.text }}
                  className="text-lg"
                >
                  {address.address_line_1 ? `${address.address_line_1},\n` : ""}
                  {address.city},{"\n"}
                  {address.state},{"\n"}
                  {address.pincode}.
                </Text>
                {address.is_primary && (
                  <Box
                    style={{ backgroundColor: colors.success }}
                    className="rounded-[10px] px-2 py-1"
                  >
                    <Text
                      style={{ fontFamily: "Sen_Bold", color: colors.text }}
                      className=" text-[10px]"
                    >
                      Primary
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </ScrollView>
      </Box>
    </VStack>
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="py-[20px]"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        nestedScrollEnabled
      >
        <Animated.View className="px-6" style={{ opacity: fadeAnim }}>
          <Box className="items-center mb-6">
            <Image
              source={{
                uri:
                  profile.nurse.profile_picture_url ||
                  "https://picsum.photos/200",
              }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 3,
                borderColor: "white",
                marginBottom: 16,
              }}
            />
            <Text
              style={{ fontFamily: "Sen_Bold" }}
              className="text-[22px] text-white"
            >{`${profile.nurse.first_name} ${profile.nurse.last_name}`}</Text>
            <Text
              style={{ fontFamily: "Sen" }}
              className="text-[16px] text-white/60 mt-1"
            >
              {profile.nurse.user.email}
            </Text>
            <Box className="flex-row items-center gap-1.5 mt-2 bg-[#2A2A2A] py-1 px-2 rounded-[12px]">
              <Icon
                as={profile.nurse.is_verified ? ShieldCheckIcon : ShieldOffIcon}
              />
              <Text
                style={{
                  fontSize: 16,
                  color: profile.nurse.is_verified ? "#4CD964" : "#FF9500",
                  fontFamily: "Sen",
                }}
              >
                {profile.nurse.is_verified ? "Verified" : "Not Verified"}
              </Text>
            </Box>
          </Box>

          <Box className="mb-2">
            {renderPersonalInfo()}
            {renderProfessionalDetails()}
            {renderServices()}
            {renderAddresses()}
          </Box>

          <Button
            className="bg-red-500 py-4 rounded-xl h-14 mt-2 mb-10"
            onPress={handleLogout}
          >
            <ButtonIcon as={LogOut} className="text-white mr-2" />
            <Text
              style={{ fontFamily: "Sen_Bold" }}
              className="text-white text-[18px]"
            >
              Log Out
            </Text>
          </Button>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
