import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import data from "@/config";
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
  User as user,
  Venus,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

interface NurseProfile {
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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<NurseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const response = await axiosInstance.get(`${data.apiUrl}/nurses/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(response.data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.log("Failed to fetch profile", error);
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    router.replace("/sign-in");
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
                uri: profile.profile_picture_url || "https://picsum.photos/200",
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
            >{`${profile.first_name} ${profile.last_name}`}</Text>
            <Text
              style={{ fontFamily: "Sen" }}
              className="text-[16px] text-white/60 mt-1"
            >
              {profile.user.email}
            </Text>
            <Box className="flex-row items-center gap-1.5 mt-2 bg-[#2A2A2A] py-1 px-2 rounded-[12px]">
              <Icon
                as={profile.is_verified ? ShieldCheckIcon : ShieldOffIcon}
              />
              <Text
                style={{
                  fontSize: 16,
                  color: profile.is_verified ? "#4CD94" : "#FF9500",
                  fontFamily: "Sen",
                }}
              >
                {profile.is_verified ? "Verified" : "Not Verified"}
              </Text>
            </Box>
          </Box>

          <Box className="mb-2">
            {/* <Box className="bg-[#1A1A1A] rounded-[12px] p-4 mb-4"> */}
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
                  {profile.phone_number}
                </Text>
              </Box>
              <Box className="flex-row items-center mb-2 gap-4">
                <Icon as={CalendarDays} className="text-black" />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  {new Date(profile.date_of_birth).toLocaleDateString()}
                </Text>
              </Box>
              <Box className="flex-row items-center gap-4">
                <Icon
                  as={profile.gender === "Male" ? Mars : Venus}
                  className="text-black"
                />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  {profile.gender}
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
                  {profile.years_of_experience} years of experience
                </Text>
              </Box>
              <Box className="flex-row items-center mb-2 gap-4">
                <Icon as={Dock} className="text-black" />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  License: {profile.license_number}
                </Text>
              </Box>
              <Box className="flex-row items-center gap-4">
                <Icon as={Star} className="text-black" />
                <Text
                  style={{ fontFamily: "Sen" }}
                  className="text-lg text-black"
                >
                  Rating: {profile.average_rating}
                </Text>
              </Box>
              {profile.bio ? (
                <Box className="flex-row items-center gap-4">
                  <Icon as={user} className="text-black" />
                  <Text
                    style={{ fontFamily: "Sen" }}
                    className="text-lg text-black"
                  >
                    {profile.bio}
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
                  {profile.primary_address.address_line_1
                    ? `${profile.primary_address.address_line_1}\n`
                    : ""}
                  {profile.primary_address.city},{"\n"}
                  {profile.primary_address.state},{"\n"}
                  {profile.primary_address.pincode}
                </Text>
              </Box>
            </VStack>
          </Box>

          <Button
            className="bg-red-500 py-4 rounded-xl h-15 mt-6 mb-10"
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
