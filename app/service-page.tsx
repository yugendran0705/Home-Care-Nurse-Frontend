import axiosInstance from "@/axiosInstance";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
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
        const response = await axiosInstance.get(`services/one/${id}`);

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
      }
    };

    if (id) {
      fetchServiceData();
    }
  }, [fadeAnim, id]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Animated.View className="p-6" style={{ opacity: fadeAnim }}>
          <Pressable onPress={() => router.back()}>
            <Icon as={ArrowLeft} size="xl" />
          </Pressable>
          <Box className="flex-row mt-10 items-center justify-center relative mb-6">
            <Text
              style={{ fontFamily: "Sen_Bold", color: colors.text }}
              size="5xl"
              className="items-center"
            >
              {service?.service_name}
            </Text>
          </Box>

          <VStack
            space="4xl"
            style={{ backgroundColor: colors.secondaryBackground }}
            className="p-4 rounded-lg mt-5"
          >
            <VStack space="sm">
              <Text
                style={{ fontFamily: "Sen_Bold", color: colors.text }}
                size="2xl"
              >
                Description
              </Text>
              <Text style={{ fontFamily: "Sen", color: colors.text }} size="xl">
                {service?.description}
              </Text>
            </VStack>
            <HStack className="justify-between">
              <VStack>
                <Text
                  style={{ fontFamily: "Sen_Bold", color: colors.text }}
                  size="2xl"
                >
                  Duration
                </Text>
                <Text
                  style={{ fontFamily: "Sen", color: colors.text }}
                  className="mt-1"
                  size="xl"
                >
                  {service?.duration} {service?.duration_type}
                </Text>
              </VStack>
              <VStack className="items-center">
                <Text
                  style={{ fontFamily: "Sen_Bold", color: colors.text }}
                  size="2xl"
                >
                  Base Price
                </Text>
                <Text
                  style={{ fontFamily: "Sen", color: colors.text }}
                  className="mt-1"
                  size="xl"
                >
                  {service?.base_price}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Animated.View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ServiceScreen;
