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
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../axiosInstance";

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
import { ArrowLeft, Check, ChevronDown, ChevronUp } from "lucide-react-native";

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

  const collapseAll = () => {
    setExpandedServices({});
  };

  const clearAll = () => {
    setSelectedServices([]);
    setExpandedServices({});
    setResetCounter((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchCurrentServices = async () => {
      try {
        const response = await axiosInstance.get("nurses/me");
        if (response.data.services) {
          const serviceIds = response.data.services.map(
            (s: { id: string }) => s.id,
          );
          setSelectedServices(serviceIds);
        }
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (e: any) {
        Alert.alert("Error", e.response.data.detail);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    const getServices = async () => {
      try {
        const response = await axiosInstance.get("services/all");
        const activeServices = response.data.filter(
          (service: { is_active: boolean }) => service.is_active,
        );
        setServices(activeServices);
      } catch (e: any) {
        Alert.alert("Error", e.response.data.detail);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchCurrentServices();
    getServices();
  }, [fadeAnim]);

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
              await axiosInstance.put("nurses/services", {
                service_ids: selectedServices,
              });
            } else {
              Alert.alert("Failure", "Atleast choose one service.");
              return;
            }
            Alert.alert("Success", "Your services have been updated.");
            router.back();
          } catch (error: any) {
            Alert.alert("Error", error.response.data.detail);
          } finally {
            setLoading(false);
          }
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

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Box className="flex-row gap-4 items-center px-3 mt-5">
            <Pressable onPress={() => router.back()} className="ml-2">
              <Icon as={ArrowLeft} size="xl" />
            </Pressable>
            <Text
              className="text-2xl font-semibold"
              style={{ fontFamily: "Sen_Bold", color: colors.text }}
            >
              Edit Services
            </Text>
          </Box>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {servicesLoading ? (
              <Box className="flex-1 items-center justify-center my-10">
                <ActivityIndicator size="large" color={colors.primary} />
              </Box>
            ) : (
              <>
                <Box className="flex-row justify-between mt-2">
                  <Button
                    onPress={() => clearAll()}
                    className="bg-black/10 w-[120px] h-10 rounded-md active:opacity-70"
                    style={{
                      backgroundColor: colors.secondaryBackgroundGradient,
                    }}
                  >
                    <Text
                      style={{ fontFamily: "Sen_Bold", color: colors.text }}
                      className="text-lg font-semibold text-center"
                    >
                      Clear all
                    </Text>
                  </Button>
                  <Button
                    onPress={() => collapseAll()}
                    className="bg-black/10 w-[120px] h-10 rounded-md active:opacity-70"
                    style={{
                      backgroundColor: colors.secondaryBackgroundGradient,
                    }}
                  >
                    <Text
                      style={{ fontFamily: "Sen_Bold", color: colors.text }}
                      className="text-l font-semibold text-center"
                    >
                      Collapse all
                    </Text>
                  </Button>
                </Box>

                <Box
                  style={{
                    maxHeight: 450,
                    backgroundColor: colors.background,
                  }}
                  className="mb-4 mt-2 rounded-lg p-4"
                >
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {sortedServices.map((service) => {
                      const isExpanded = expandedServices[service.id];
                      const isSelected = selectedServices.includes(service.id);

                      return (
                        <Box
                          key={`${service.id}-${resetCounter}`}
                          className={`rounded-xl px-4 py-3 my-3 shadow-xl border-white/50 border`}
                          style={{
                            backgroundColor: isSelected
                              ? colors.secondaryBackground
                              : colors.background,
                            elevation: 20,
                          }}
                        >
                          {/* Top Row */}
                          <Box className="flex-row items-center justify-between">
                            <Checkbox
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
                                    return prev.filter(
                                      (id) => id !== service.id,
                                    );
                                  }
                                });
                              }}
                            >
                              <CheckboxIndicator className="mr-2">
                                <CheckboxIcon
                                  as={Check}
                                  width={15}
                                  color={
                                    isSelected
                                      ? colors.secondaryBackground
                                      : "white"
                                  }
                                />
                              </CheckboxIndicator>

                              <CheckboxLabel
                                style={{
                                  fontFamily: "Sen_Bold",
                                  color: colors.text,
                                }}
                                className="text-lg bg-transparent"
                              >
                                {service.service_name}
                              </CheckboxLabel>
                            </Checkbox>

                            {/* Expand / Collapse Button */}
                            <Button
                              onPress={() => toggleExpand(service.id)}
                              className="ml-2 h-8 active:opacity-70"
                              style={{
                                backgroundColor: !isSelected
                                  ? colors.background
                                  : colors.secondaryBackground,
                              }}
                            >
                              <ButtonIcon
                                color={colors.text}
                                as={isExpanded ? ChevronUp : ChevronDown}
                              />
                            </Button>
                          </Box>

                          {/* Expanded Section */}
                          {isExpanded && (
                            <Box
                              className={`mt-2 pt-3 border-t ${
                                isSelected
                                  ? "border-white/80"
                                  : "border-white/80"
                              }`}
                            >
                              <Text
                                style={{
                                  fontFamily: "Sen",
                                  color: isSelected ? "white" : colors.text,
                                }}
                              >
                                {service.description}
                              </Text>

                              <Text
                                style={{
                                  fontFamily: "Sen",
                                  color: isSelected ? "white" : colors.text,
                                }}
                              >
                                Duration: {service.duration}{" "}
                                {service.duration_type}
                              </Text>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </ScrollView>
                </Box>
              </>
            )}
            <Button
              onPress={handleSave}
              style={{
                backgroundColor: colors.secondaryBackgroundGradient,
              }}
              className=" h-16 rounded-[14px] items-center shadow-lg active:opacity-70"
            >
              {loading ? (
                <ButtonSpinner color="black" />
              ) : (
                <ButtonText
                  style={{ fontFamily: "Sen_Bold", color: colors.text }}
                  className="text-xl"
                >
                  Save Changes
                </ButtonText>
              )}
            </Button>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default EditServicesScreen;
