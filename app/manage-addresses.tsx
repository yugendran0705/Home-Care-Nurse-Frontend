import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../axiosInstance";
interface Address {
  id: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  is_primary: boolean;
}

const ManageAddressesScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadFromAsyncStorage = useCallback(async () => {
    try {
      const cachedAddresses = await AsyncStorage.getItem("addresses");
      if (cachedAddresses) {
        const data = JSON.parse(cachedAddresses);
        setAddresses(data);
      } else {
        const response = await axiosInstance.get("addresses/me");
        setAddresses(response.data);
        await AsyncStorage.setItem("addresses", JSON.stringify(response.data));
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      Alert.alert("Error", "Failed to fetch addresses.");
      console.error(e);
    }
  }, [fadeAnim]);

  const fetchData = useCallback(async () => {
    try {
      const response = await axiosInstance.get("addresses/me");
      setAddresses(response.data);
      await AsyncStorage.setItem("addresses", JSON.stringify(response.data));
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      Alert.alert("Error", "Failed to fetch addresses.");
      console.error(e);
    }
  }, [fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      const initialLoad = async () => {
        setLoading(true);
        await loadFromAsyncStorage();
        setLoading(false);
      };
      initialLoad();
    }, [loadFromAsyncStorage]),
  );

  const handleSetPrimary = async (addressId: string) => {
    Alert.alert(
      "Set Primary Address",
      "Are you sure you want to set this address as primary?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "default",

          onPress: async () => {
            setLoading(true);
            try {
              await axiosInstance.patch(`addresses/set_primary/${addressId}`);
              Alert.alert("Success", "Primary address updated.");
              await fetchData();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.detail ??
                  "Failed to update primary address.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

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
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Box className="flex-row gap-4 items-center px-3 mt-5">
            <Pressable onPress={() => router.back()} className="ml-2">
              <Icon as={ArrowLeft} size="xl" color={colors.text} />
            </Pressable>
            <Text
              className="text-2xl font-semibold "
              style={{ fontFamily: Fonts.semibold, color: colors.text }}
            >
              Manage Addresses
            </Text>
          </Box>
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {addresses.map((addr) => (
              <VStack
                key={addr.id}
                style={{
                  backgroundColor: colors.secondaryBackground,
                  borderWidth: addr.is_primary ? 2 : 1,
                  borderColor: addr.is_primary ? colors.primary : colors.border,
                  shadowColor: colors.shadowColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 12,
                  elevation: 2,
                }}
                className="rounded-2xl p-4 mb-4"
              >
                <Box>
                  <Text
                    style={{ fontFamily: Fonts.semibold, color: colors.text }}
                    className="text-[16px] mb-[4px]"
                  >
                    {addr.address_line_1}, {addr.address_line_2}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.regular,
                      color: colors.textSecondary,
                    }}
                    className="text-[14px]"
                  >
                    {addr.city}, {addr.pincode}
                  </Text>
                </Box>

                <Divider
                  className="my-2"
                  style={{ backgroundColor: colors.border }}
                />

                <Box className="flex flex-row items-center justify-end pt-[15px] relative">
                  {addr.is_primary && (
                    <Box
                      style={{ backgroundColor: colors.accent }}
                      className=" absolute bottom-3 left-0 rounded-full px-3 py-1"
                    >
                      <Text
                        style={{
                          fontFamily: Fonts.semibold,
                          color: colors.text,
                        }}
                        className="text-[11px] uppercase"
                      >
                        Primary
                      </Text>
                    </Box>
                  )}
                  {!addr.is_primary && (
                    <Button
                      className="px-[15px] py-[8px] ml-[10px] rounded-lg border active:opacity-70"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }}
                      onPress={() => handleSetPrimary(addr.id)}
                    >
                      <ButtonText
                        style={{
                          fontFamily: Fonts.semibold,
                          color: colors.primary,
                        }}
                      >
                        Set as Primary
                      </ButtonText>
                    </Button>
                  )}
                  <Button
                    className="px-[15px] py-[8px] ml-[10px] rounded-lg border active:opacity-70"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                    onPress={() =>
                      router.push({
                        pathname: "/address-form",
                        params: { addressId: addr.id },
                      })
                    }
                  >
                    <ButtonText
                      style={{
                        fontFamily: Fonts.semibold,
                        color: colors.primary,
                      }}
                    >
                      Edit
                    </ButtonText>
                  </Button>
                </Box>
              </VStack>
            ))}

            <Button
              className="flex-row py-[15px] rounded-[14px] items-center justify-center mt-[10px] h-auto active:opacity-70"
              style={{
                backgroundColor: colors.secondaryBackgroundGradient,
              }}
              onPress={() => router.push("/address-form")}
            >
              <ButtonIcon
                as={Plus}
                className="mr-[10px]"
                color={colors.textInverted}
              />
              <ButtonText
                style={{
                  fontFamily: Fonts.semibold,
                  color: colors.textInverted,
                }}
                className=" text-[18px]"
              >
                Add New Address
              </ButtonText>
            </Button>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ManageAddressesScreen;
