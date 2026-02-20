import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
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
      const response = await axiosInstance.get("nurses/me");
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
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4c8bf5" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centeredContainer}>
        <ThemedText>Failed to load profile. Please try again later.</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.headerContainer}>
            <Image
              source={{
                uri:
                  profile.profile_picture_url ||
                  "https://via.placeholder.com/150",
              }}
              style={styles.profilePicture}
            />
            <ThemedText
              style={styles.nameText}
            >{`${profile.first_name} ${profile.last_name}`}</ThemedText>
            <ThemedText style={styles.emailText}>
              {profile.user.email}
            </ThemedText>
            <View style={styles.verifiedBadge}>
              <Ionicons
                name={
                  profile.is_verified ? "shield-checkmark" : "shield-outline"
                }
                size={20}
                color={profile.is_verified ? "#4CD964" : "#FF9500"}
              />
              <ThemedText
                style={{ color: profile.is_verified ? "#4CD94" : "#FF9500" }}
              >
                {profile.is_verified ? "Verified" : "Not Verified"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Personal Information
              </ThemedText>
              <View style={styles.detailItem}>
                <Ionicons name="call-outline" size={20} style={styles.icon} />
                <ThemedText>{profile.phone_number}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  style={styles.icon}
                />
                <ThemedText>
                  {new Date(profile.date_of_birth).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="male-female-outline"
                  size={20}
                  style={styles.icon}
                />
                <ThemedText>{profile.gender}</ThemedText>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Professional Details
              </ThemedText>
              <View style={styles.detailItem}>
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  style={styles.icon}
                />
                <ThemedText>
                  {profile.years_of_experience} years of experience
                </ThemedText>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  style={styles.icon}
                />
                <ThemedText>License: {profile.license_number}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="star-outline" size={20} style={styles.icon} />
                <ThemedText>Rating: {profile.average_rating}</ThemedText>
              </View>
              <ThemedText style={styles.bioText}>{profile.bio}</ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Primary Address
              </ThemedText>
              <View style={styles.detailItem}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  style={styles.icon}
                />
                <ThemedText>{`${profile.primary_address.address_line_1}, ${profile.primary_address.city}, ${profile.primary_address.state} - ${profile.primary_address.pincode}`}</ThemedText>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="white" />
            <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  scrollContainer: { paddingVertical: 20 },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  container: { paddingHorizontal: 24 },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#4c8bf5",
    marginBottom: 16,
  },
  nameText: { fontSize: 26, fontWeight: "bold", color: "#FFFFFF" },
  emailText: { fontSize: 16, color: "#B0B0B0", marginTop: 4 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#2A2A2A",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  detailsContainer: { gap: 16 },
  section: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { color: "#4c8bf5" },
  bioText: { color: "#B0B0B0", fontStyle: "italic", marginTop: 8 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff3b30",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
    gap: 10,
  },
  logoutButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
