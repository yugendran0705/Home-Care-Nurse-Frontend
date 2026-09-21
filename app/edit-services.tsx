import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
} from "react-native";
import Reanimated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../axiosInstance";

import { AnimatedChevron } from "@/components/AnimatedChevron";
import { Box } from "@/components/ui/box";
import {
  Button,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, Check } from "lucide-react-native";

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

const EditServicesScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [initialSelectedServices, setInitialSelectedServices] = useState<
    string[]
  >([]);
  const [expandedServices, setExpandedServices] = useState<
    Record<string, boolean>
  >({});
  const sortedServices = useMemo(() => {
    const selectedSet = new Set(selectedServices);

    return [...services].sort((a, b) => {
      const aSelected = selectedSet.has(a.id);
      const bSelected = selectedSet.has(b.id);

      if (aSelected === bSelected) return 0;

      return aSelected ? -1 : 1;
    });
  }, [services, selectedServices]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [resetCounter, setResetCounter] = useState(0);

  const toggleExpand = (id: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const anyExpanded = Object.values(expandedServices).some(Boolean);

  const toggleAll = () => {
    if (anyExpanded) {
      setExpandedServices({});
      return;
    }
    setExpandedServices(
      Object.fromEntries(services.map((service) => [service.id, true])),
    );
  };

  const clearAll = () => {
    setSelectedServices([]);
    setExpandedServices({});
    setResetCounter((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchCurrentServices = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem("profile");
        const data = cachedProfile
          ? JSON.parse(cachedProfile)
          : (await axiosInstance.get("nurses/me")).data;
        if (data.services) {
          const serviceIds = data.services.map((s: { id: string }) => s.id);
          setSelectedServices(serviceIds);
          setInitialSelectedServices(serviceIds);
        }
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (e: any) {
        Alert.alert(
          "Error",
          e?.response?.data?.detail ?? "Could not fetch your details.",
        );
        router.back();
      } finally {
        setLoading(false);
      }
    };

    const getServices = async () => {
      try {
        const response = await axiosInstance.get("nursing_services/all");
        const activeServices = response.data.filter(
          (service: { is_active: boolean }) => service.is_active,
        );
        setServices(activeServices);
      } catch (e: any) {
        Alert.alert(
          "Error",
          e?.response?.data?.detail ?? "Could not fetch your details.",
        );
      } finally {
        setServicesLoading(false);
      }
    };

    fetchCurrentServices();
    getServices();
  }, [fadeAnim]);

  const areEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;

    const setB = new Set(b);

    return a.every((id: string) => setB.has(id));
  };

  const handleSave = async () => {
    Alert.alert("Update Services", "Are you sure you want to save this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save",
        style: "default",

        onPress: async () => {
          setLoading(true);
          try {
            if (selectedServices.length > 0) {
              if (!areEqual(selectedServices, initialSelectedServices)) {
                await axiosInstance.put("nurses/services", {
                  service_ids: selectedServices,
                });
                const response = await axiosInstance.get("nurses/me");
                await AsyncStorage.setItem(
                  "profile",
                  JSON.stringify(response.data),
                );
              }
              Alert.alert("Success", "Your services have been updated.");
              router.back();
            } else {
              Alert.alert("Failure", "Atleast choose one service.");
              return;
            }
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.detail ?? "Could not update your details.",
            );
          } finally {
            setLoading(false);
          }
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

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Animated.View className="flex-1" style={{ opacity: fadeAnim }}>
          <Box className="flex-row gap-4 items-center px-3 mt-5">
            <Pressable onPress={() => router.back()} className="ml-2">
              <Icon as={ArrowLeft} size="xl" color={colors.text} />
            </Pressable>
            <Text
              className="text-2xl font-semibold"
              style={{ fontFamily: Fonts.semibold, color: colors.text }}
            >
              Edit Services
            </Text>
          </Box>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
          >
            {servicesLoading ? (
              <Box className="flex-1 items-center justify-center my-10">
                <ActivityIndicator size="large" color={colors.primary} />
              </Box>
            ) : (
              <>
                <Box className="flex-row justify-between mt-2">
                  <Button
                    onPress={() => clearAll()}
                    className="w-[120px] h-10 rounded-lg border active:opacity-70"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: Fonts.semibold,
                        color: colors.primary,
                      }}
                      className="text-[14px] text-center"
                    >
                      Clear all
                    </Text>
                  </Button>
                  <Button
                    onPress={toggleAll}
                    className="w-[120px] h-10 rounded-lg border active:opacity-70"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: Fonts.semibold,
                        color: colors.primary,
                      }}
                      className="text-[14px] text-center"
                    >
                      {anyExpanded ? "Collapse all" : "Expand all"}
                    </Text>
                  </Button>
                </Box>

                <Box className="mb-1 mt-2">
                  {sortedServices.map((service) => {
                    const isExpanded = expandedServices[service.id];
                    const isSelected = selectedServices.includes(service.id);

                    return (
                      <Reanimated.View
                        key={`${service.id}-${resetCounter}`}
                        layout={LinearTransition.duration(200)}
                        className={`rounded-xl px-4 py-3 my-2 border`}
                        style={{
                          backgroundColor: isSelected
                            ? colors.primarySoft
                            : colors.surface,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        }}
                      >
                        {/* Top Row */}
                        <Box className="flex-row items-start justify-between">
                          <Checkbox
                            className="flex-1 items-start"
                            value={service.id}
                            size="md"
                            isChecked={isSelected}
                            onChange={(checked: boolean) => {
                              setSelectedServices((prev) => {
                                if (checked) {
                                  return prev.includes(service.id)
                                    ? prev
                                    : [...prev, service.id];
                                } else {
                                  return prev.filter((id) => id !== service.id);
                                }
                              });
                            }}
                          >
                            <CheckboxIndicator
                              className="mr-2"
                              style={{
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : colors.surface,
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.borderStrong,
                              }}
                            >
                              <CheckboxIcon
                                as={Check}
                                width={15}
                                color={colors.textInverted}
                              />
                            </CheckboxIndicator>

                            <CheckboxLabel
                              style={{
                                fontFamily: Fonts.semibold,
                                color: colors.text,
                                flexShrink: 1,
                              }}
                              className="text-[16px] bg-transparent leading-6"
                            >
                              {service.service_name}
                            </CheckboxLabel>
                          </Checkbox>

                          {/* Expand / Collapse Button */}
                          <Button
                            onPress={() => toggleExpand(service.id)}
                            className="ml-2 h-8 shrink-0 active:opacity-70"
                            style={{ backgroundColor: "transparent" }}
                          >
                            <AnimatedChevron
                              expanded={!!isExpanded}
                              color={colors.icon}
                            />
                          </Button>
                        </Box>

                        {/* Expanded Section */}
                        {isExpanded && (
                          <Reanimated.View
                            entering={FadeIn.duration(180)}
                            exiting={FadeOut.duration(120)}
                            className="mt-2 pt-3 border-t"
                            style={{ borderTopColor: colors.border }}
                          >
                            <Text
                              style={{
                                fontFamily: Fonts.regular,
                                color: colors.text,
                              }}
                            >
                              {service.description}
                            </Text>

                            <Text
                              style={{
                                fontFamily: Fonts.regular,
                                color: colors.text,
                              }}
                            >
                              Duration: {service.duration}{" "}
                              {service.duration_type}
                            </Text>
                          </Reanimated.View>
                        )}
                      </Reanimated.View>
                    );
                  })}
                </Box>
              </>
            )}
          </ScrollView>
          <Box
            className="px-5 pt-3 pb-5 border-t"
            style={{
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Button
              onPress={handleSave}
              style={{
                backgroundColor: colors.secondaryBackgroundGradient,
              }}
              className="h-14 rounded-xl items-center active:opacity-90"
            >
              {loading ? (
                <ButtonSpinner color={colors.textInverted} />
              ) : (
                <ButtonText
                  style={{
                    fontFamily: Fonts.semibold,
                    color: colors.textInverted,
                  }}
                  className="text-[17px]"
                >
                  Save Changes
                </ButtonText>
              )}
            </Button>
          </Box>
        </Animated.View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default EditServicesScreen;
