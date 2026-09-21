import axiosInstance from "@/axiosInstance";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Divider } from "@/components/ui/divider";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Animated, Pressable, useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

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

const ServiceScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { id } = useLocalSearchParams();
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [service, setService] = useState<Service | null>(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const response = await axiosInstance.get(`nursing_services/one/${id}`);

        setService(response.data);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (error: any) {
        Alert.alert(
          "Failure",
          error?.response?.data?.detail ??
            "Something went wrong. Please try again.",
        );
        router.back();
      }
    };

    if (id && typeof id == "string") {
      fetchServiceData();
    }
  }, [fadeAnim, id]);

  const renderOnError = () => (
    <>
      <Text
        style={{ fontFamily: Fonts.semibold, color: colors.text }}
        className="text-[20px] mt-10 text-center"
      >
        This service could not be loaded.
      </Text>
    </>
  );

  const renderDetails = () => (
    <>
      <Box className="mt-6 mb-6">
        <Text
          style={{
            fontFamily: Fonts.semibold,
            color: colors.textSecondary,
            letterSpacing: 0.8,
          }}
          className="text-[12px] uppercase mb-1"
        >
          Service
        </Text>
        <Text
          style={{ fontFamily: Fonts.bold, color: colors.text }}
          className="text-[28px] leading-9"
        >
          {service?.service_name}
        </Text>
      </Box>

      <VStack
        space="xl"
        style={{
          backgroundColor: colors.secondaryBackground,
          borderColor: colors.border,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }}
        className="p-5 rounded-2xl border"
      >
        <VStack space="xs">
          <Text
            style={{
              fontFamily: Fonts.semibold,
              color: colors.textSecondary,
              letterSpacing: 0.8,
            }}
            className="text-[12px] uppercase"
          >
            Description
          </Text>

          <Text
            style={{ fontFamily: Fonts.regular, color: colors.text }}
            className="text-[16px] leading-6"
          >
            {service?.description}
          </Text>
        </VStack>

        <Divider style={{ backgroundColor: colors.border }} />

        <HStack className="justify-between">
          <VStack space="xs">
            <Text
              style={{
                fontFamily: Fonts.semibold,
                color: colors.textSecondary,
                letterSpacing: 0.8,
              }}
              className="text-[12px] uppercase"
            >
              Duration
            </Text>

            <Text
              style={{ fontFamily: Fonts.semibold, color: colors.text }}
              className="text-[18px]"
            >
              {service?.duration} {service?.duration_type}
            </Text>
          </VStack>

          <VStack space="xs" className="items-end">
            <Text
              style={{
                fontFamily: Fonts.semibold,
                color: colors.textSecondary,
                letterSpacing: 0.8,
              }}
              className="text-[12px] uppercase"
            >
              Base Price
            </Text>

            <Text
              style={{ fontFamily: Fonts.bold, color: colors.primary }}
              className="text-[18px]"
            >
              ₹{service?.base_price}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Animated.View className="p-6" style={{ opacity: fadeAnim }}>
          <Pressable onPress={() => router.back()}>
            <Icon as={ArrowLeft} size="xl" color={colors.text} />
          </Pressable>
          {service ? renderDetails() : renderOnError()}
        </Animated.View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ServiceScreen;
