import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  CalendarDays,
  Dock,
  LocationEdit,
  LogOut,
  Mars,
  Phone,
  ShieldCheckIcon,
  ShieldOffIcon,
  Star,
  User as UserIcon,
  Venus,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../../axiosInstance";

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axiosInstance.get("nurses/me");
      setProfile(response.data);
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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  return (
    <SafeAreaView
      className="flex-1 bg-[#369BFF]/80"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="py-[20px]"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
            <VStack space="lg" className="bg-white rounded-[12px] p-4 mb-4">
              <Text
                style={{ fontFamily: "Sen_Bold" }}
                className="text-[18px] text-black"
              >
                Personal Information
              </Text>
              <Divider className="bg-gray-300" />
              <Box className="flex-row items-center mb-2 gap-4">
                <Icon as={Phone} className="text-black" />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  {profile.nurse.phone_number}
                </Text>
              </Box>
              <Box className="flex-row items-center mb-2 gap-4">
                <Icon as={CalendarDays} className="text-black" />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  {new Date(profile.nurse.date_of_birth).toLocaleDateString()}
                </Text>
              </Box>
              <Box className="flex-row items-center gap-4">
                <Icon
                  as={profile.nurse.gender === "Male" ? Mars : Venus}
                  className="text-black"
                />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  {profile.nurse.gender}
                </Text>
              </Box>
            </VStack>

            <VStack space="lg" className="bg-white rounded-[12px] p-4 mb-4">
              <Text
                style={{ fontFamily: "Sen_Bold" }}
                className="text-[18px] text-black"
              >
                Professional Details
              </Text>
              <Divider className="bg-gray-300" />
              <Box className="flex-row items-center mb-2 gap-4">
                <Icon as={BriefcaseBusiness} className="text-black" />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  {profile.nurse.years_of_experience} years of experience
                </Text>
              </Box>
              <Box className="flex-row items-center mb-2 gap-4">
                <Icon as={Dock} className="text-black" />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  License: {profile.nurse.license_number}
                </Text>
              </Box>
              <Box className="flex-row items-center gap-4">
                <Icon as={Star} className="text-black" />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  Rating: {profile.nurse.average_rating}
                </Text>
              </Box>
              {profile.nurse.bio ? (
                <Box className="flex-row items-center gap-4">
                  <Icon as={UserIcon} className="text-black" />
                  <Text
                    style={{ fontFamily: "Sen" }}
                    className="text-lg text-black"
                  >
                    {profile.nurse.bio}
                  </Text>
                </Box>
              ) : null}
            </VStack>

            <VStack space="lg" className="bg-white rounded-[12px] p-4">
              <Text
                style={{ fontFamily: "Sen_Bold" }}
                className="text-[18px] text-black"
              >
                Primary Address
              </Text>
              <Divider className="bg-gray-300" />
              <Box className="flex-row items-start gap-4">
                <Icon as={LocationEdit} className="text-black" />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  {profile.nurse.primary_address.address_line_1
                    ? `${profile.nurse.primary_address.address_line_1}\n`
                    : ""}
                  {profile.nurse.primary_address.city},{"\n"}
                  {profile.nurse.primary_address.state},{"\n"}
                  {profile.nurse.primary_address.pincode}
                </Text>
              </Box>
            </VStack>
          </Box>

          <Button
            className="bg-red-500 py-4 rounded-xl h-14 mt-6 mb-10"
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
