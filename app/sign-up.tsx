import { Box } from "@/components/ui/box/index";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button/index";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox/index";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control/index";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon/index";
import {
  Input,
  InputField,
  InputIcon,
  InputSlot,
} from "@/components/ui/input/index";
import { Pressable } from "@/components/ui/pressable/index";
import { Text } from "@/components/ui/text/index";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Mars,
  Venus,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../axiosInstance";

interface Address {
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number;
  longitude: number;
}
interface FormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  license_number: string;
  years_of_experience: string;
  bio: string;
  profile_picture_url: string;
  address: Address;
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

const initialFormData: FormData = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  date_of_birth: "",
  gender: "",
  license_number: "",
  years_of_experience: "",
  bio: "",
  profile_picture_url: "",
  address: {
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    latitude: 19.076,
    longitude: 72.8777,
  },
};

export default function SignUpScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const actionButtonShadow = {
    backgroundColor: colors.secondaryBackgroundGradient,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  };

  const normalizeErrorMessage = (value: unknown, fallback: string) => {
    if (typeof value === "string") {
      // Return fallback if string is empty
      return value.trim() || fallback;
    }
    if (Array.isArray(value)) {
      const joined = value.join("\n").trim();
      return joined || fallback;
    }
    if (value && typeof value === "object") {
      try {
        const stringified = JSON.stringify(value);
        return stringified.trim() || fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedServices, setExpandedServices] = useState<
    Record<string, boolean>
  >({});
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  const sortedServices = useMemo(() => {
    const selectedSet = new Set(selectedServices);

    return [...services].sort((a, b) => {
      const aSelected = selectedSet.has(a.id);
      const bSelected = selectedSet.has(b.id);

      if (aSelected === bSelected) return 0;

      return aSelected ? -1 : 1;
    });
  }, [services, selectedServices]);

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

  // --- ANIMATION VALUE FOR BUTTON PRESS ---
  const scale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleButtonPressIn = () => {
    scale.value = withSpring(0.95);
  };
  const handleButtonPressOut = () => {
    scale.value = withSpring(1);
  };

  // --- LOCATION FETCH ---
  useEffect(() => {
    if (step === 0) {
      router.back();
    }

    const controller = new AbortController();

    const getServices = async () => {
      setError("");
      setServicesLoading(true);
      try {
        const response = await axiosInstance.get("services/all", {
          signal: controller.signal,
        });
        const activeServices = response.data.filter(
          (service: { is_active: boolean }) => service.is_active,
        );

        setServices(activeServices);
        setServicesLoaded(true);
        return;
      } catch (e: any) {
        if (e.name === "CanceledError" || e.name === "AbortError") {
          return;
        }
        const apiMessage =
          e?.response?.data?.detail ?? e?.response?.data?.message;
        const errorMessage =
          normalizeErrorMessage(
            apiMessage,
            "Get services failed. Please try again.",
          ) || e.message;
        setError(errorMessage);
      } finally {
        setServicesLoading(false);
      }
    };

    // Only fetch services once when step changes to 5 and they haven't been loaded yet
    if (step === 5 && !servicesLoaded) {
      getServices();
    }

    if (step === 3 && !hasInitializedLocation) {
      const getLocation = async () => {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Permission to access location was denied");
          setLoading(false);
          setHasInitializedLocation(true);
          return;
        }
        try {
          let currentLocation = await Location.getCurrentPositionAsync({});
          handleAddressChange("latitude", currentLocation.coords.latitude);
          handleAddressChange("longitude", currentLocation.coords.longitude);
        } catch {
          setError("Could not fetch location. Please select it on the map.");
        } finally {
          setHasInitializedLocation(true);
          setLoading(false);
        }
      };

      getLocation();
    }

    return () => {
      controller.abort();
    };
  }, [step, hasInitializedLocation, servicesLoaded]);

  const handleFormChange = (
    field: keyof Omit<FormData, "address">,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleAddressChange = (
    field: keyof Address,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      let fDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
        .toString()
        .padStart(
          2,
          "0",
        )}-${selectedDate.getDate().toString().padStart(2, "0")}`;
      handleFormChange("date_of_birth", fDate);
    }
  };

  const validateEmail = (email: string) => {
    // Simple regex for email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 8 chars, at least one letter, one number, and one special character
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
  };

  const isStepValid = () => {
    if (step === 1) {
      return !!(
        formData.email &&
        formData.password &&
        formData.first_name &&
        formData.last_name &&
        formData.date_of_birth &&
        formData.phone_number &&
        formData.gender
      );
    }
    if (step === 2) {
      return !!(
        formData.license_number &&
        formData.years_of_experience &&
        formData.profile_picture_url
      );
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      return !!(
        formData.address.address_line_1 &&
        formData.address.city &&
        formData.address.state &&
        formData.address.pincode &&
        formData.address.pincode.length === 6
      );
    }
    if (step === 5) {
      return !!(selectedServices.length !== 0);
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (
        !formData.email ||
        !formData.password ||
        !formData.first_name ||
        !formData.last_name ||
        !formData.date_of_birth ||
        !formData.phone_number ||
        !formData.gender
      ) {
        setError("Please fill all required fields in Step 1.");
        return;
      }
      if (!validateEmail(formData.email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!validatePassword(formData.password)) {
        setError(
          "Password must be at least 8 characters, include at least one letter, one number, and one special character.",
        );
        return;
      }
      if (formData.phone_number.length !== 10) {
        setError("Phone number must be 10 digits.");
        return;
      }
    }
    if (
      step === 2 &&
      (!formData.license_number ||
        !formData.years_of_experience ||
        !formData.profile_picture_url)
    ) {
      setError(
        "Please provide your license number, years of experience, and a profile picture URL.",
      );
      return;
    }
    if (
      step === 4 &&
      (!formData.address.address_line_1 ||
        !formData.address.city ||
        !formData.address.state ||
        !formData.address.pincode ||
        formData.address.pincode.length !== 6)
    ) {
      setError("Please provide your city, state and pincode.");
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handlePrevStep = () => {
    if (step !== 0) {
      setStep((s) => s - 1);
    }
    setError("");
    return;
  };

  const handleConfirmLocationAndGeocode = async () => {
    if (isGeocoding) return;
    setIsGeocoding(true);
    setError("");
    try {
      const { latitude, longitude } = formData.address;
      const geocodedAddresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocodedAddresses && geocodedAddresses.length > 0) {
        const addr = geocodedAddresses[0];
        // Use a single state update for better performance
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            address_line_1:
              `${addr.streetNumber || ""} ${addr.street || ""}`.trim(),
            city: addr.city || "",
            state: addr.region || "",
            pincode: addr.postalCode || "",
            country: addr.country || prev.address.country,
          },
        }));
      } else {
        setError("Could not determine address. Please enter it manually.");
      }
    } catch (error) {
      console.error("Geocoding Error:", error);
      setError("Failed to fetch address details. Please enter them manually.");
    } finally {
      setIsGeocoding(false);
      setStep(4); // Move to the next step regardless of success
    }
  };

  const handleSignUp = async () => {
    if (step === 5 && selectedServices.length === 0) {
      setError("Please select a service.");
      return;
    }
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...formData,
        years_of_experience: parseInt(formData.years_of_experience, 10) || 0,
        services: [
          {
            service_ids: selectedServices,
          },
        ],
      };

      const response = await axiosInstance.post("nurses/register", payload);
      const { access_token, refresh_token } = response.data;

      // Store tokens immediately after first response
      await AsyncStorage.setItem("access_token", access_token);
      await AsyncStorage.setItem("refresh_token", refresh_token);

      Alert.alert("Success!", "Your nurse profile has been created.", [
        { text: "OK", onPress: () => router.push("/(tabs)/profile") },
      ]);
    } catch (e: any) {
      console.warn(
        "Registration error details: ",
        e?.response?.data || e.message,
      );
      const apiMessage =
        e?.response?.data?.detail ?? e?.response?.data?.message;

      const errorMessage = normalizeErrorMessage(
        apiMessage,
        "Registration failed. Please try again.",
      );
      // Ensure we always have a string, never an object
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER STEPS WITH FADE/SLIDE ANIMATIONS ---
  const renderStepOne = () => (
    <>
      <Text
        style={{ fontFamily: "Sen_Bold", color: colors.text }}
        className="text-2xl font-semibold  mb-5 text-center"
      >
        Step 1: Personal Details
      </Text>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            First Name
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: Dhruva"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.first_name}
            onChangeText={(text) => handleFormChange("first_name", text)}
            type="text"
          />
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            Last Name
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: U R"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.last_name}
            onChangeText={(text) => handleFormChange("last_name", text)}
            type="text"
          />
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            Email
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: example@gmail.com"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.email}
            onChangeText={(text) => handleFormChange("email", text)}
            autoCapitalize="none"
            type="text"
          />
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            Password
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 pl-2 pr-4 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            type={isPasswordVisible ? "text" : "password"}
            placeholder="eg: ********"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.password}
            onChangeText={(text) => handleFormChange("password", text)}
          />
          <InputSlot onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <InputIcon
              color={colors.text}
              as={isPasswordVisible ? EyeIcon : EyeOffIcon}
            />
          </InputSlot>
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            Phone
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: 9876543210"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.phone_number}
            onChangeText={(text) => handleFormChange("phone_number", text)}
            keyboardType="phone-pad"
            type="text"
          />
        </Input>
      </FormControl>

      <Pressable onPress={() => setShowDatePicker(true)}>
        <Text
          style={{ fontFamily: "Sen", color: colors.text }}
          className="text-md uppercase font-Sen mb-2"
        >
          Date of birth
        </Text>
        <Box
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="h-16 rounded-[14px] px-[15px] mb-[15px] mt-1 justify-center"
        >
          <Text
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md"
          >
            {formData.date_of_birth || "2000-00-00"}
          </Text>
        </Box>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
      <Text
        style={{ fontFamily: "Sen", color: colors.text }}
        className="text-md uppercase font-Sen mb-2"
      >
        Gender
      </Text>
      <Box className="flex-row justify-between gap-4 mb-[15px]">
        {["Male", "Female"].map((g) => {
          const isActive = formData.gender === g;

          return (
            <Button
              key={g}
              onPress={() => handleFormChange("gender", g)}
              className={`h-16 flex-1 rounded-xl flex-row items-center justify-center bg-transparent border border-white/50`}
              variant="solid"
              style={{
                backgroundColor: !isActive
                  ? colors.background
                  : colors.secondaryBackground,
              }}
            >
              <ButtonIcon
                as={g === "Male" ? Mars : Venus}
                className={`mr-2 `}
                style={{ color: colors.text }}
              />

              <ButtonText
                style={{ fontFamily: "Sen", color: colors.text }}
                className={`text-[16px] font-medium `}
              >
                {g}
              </ButtonText>
            </Button>
          );
        })}
      </Box>
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text
        style={{ fontFamily: "Sen_Bold", color: colors.text }}
        className="text-2xl font-semibold mb-5 text-center"
      >
        Step 2: Professional Details
      </Text>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className=" text-md uppercase font-Sen"
          >
            License Number
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: RN-2026-001"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.license_number}
            onChangeText={(text) => handleFormChange("license_number", text)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            Years of Experience
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: 5"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.years_of_experience}
            onChangeText={(text) =>
              handleFormChange("years_of_experience", text)
            }
            keyboardType="number-pad"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            Profile Picture URL
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: https://..."
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.profile_picture_url}
            onChangeText={(text) =>
              handleFormChange("profile_picture_url", text)
            }
            autoCapitalize="none"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            Short Bio
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-24  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{
              fontFamily: "Sen",
              textAlignVertical: "top",
              color: colors.text,
            }}
            className="mt-4"
            placeholder="Write a short bio (optional)"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.bio}
            onChangeText={(text) => handleFormChange("bio", text)}
            multiline
          />
        </Input>
      </FormControl>
    </>
  );

  const renderStepThree = () => (
    <Box className="flex-1 min-h-[500px]">
      <Text
        style={{ fontFamily: "Sen_Bold", color: colors.text }}
        className="text-2xl font-semibold mb-5 text-center"
      >
        Step 3: Pin Your Location
      </Text>
      <Box
        style={{
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 4,
          backgroundColor: colors.secondaryBackground,
        }}
        className="flex-1 rounded-[14px] overflow-hidden justify-center items-center mb-5"
      >
        <MapView
          style={{ width: "100%", height: "100%" }}
          region={{
            latitude: formData.address.latitude,
            longitude: formData.address.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            draggable
            coordinate={{
              latitude: formData.address.latitude,
              longitude: formData.address.longitude,
            }}
            onDragEnd={(e) => {
              handleAddressChange(
                "latitude",
                e.nativeEvent.coordinate.latitude,
              );
              handleAddressChange(
                "longitude",
                e.nativeEvent.coordinate.longitude,
              );
            }}
          />
        </MapView>
        {loading && (
          <Box
            className="absolute inset-0 items-center justify-center "
            style={{ backgroundColor: colors.secondaryBackground }}
          >
            <ActivityIndicator size="large" color={colors.text} />
          </Box>
        )}
      </Box>
      <Button
        style={{
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 4,
          backgroundColor: colors.secondaryBackgroundGradient,
        }}
        className="h-[55px] rounded-[14px] items-center justify-center mt-[10px]"
        onPress={handleConfirmLocationAndGeocode}
        isDisabled={loading}
      >
        {isGeocoding ? (
          <ActivityIndicator color="#192f6a" />
        ) : (
          <Text
            style={{ fontFamily: "Sen_Bold", color: colors.text }}
            className="text-[18px]"
          >
            Confirm Location
          </Text>
        )}
      </Button>
    </Box>
  );

  const renderStepFour = () => (
    <>
      <Text
        style={{ fontFamily: "Sen_Bold", color: colors.text }}
        className="text-2xl font-semibold mb-5 text-center"
      >
        Step 4: Confirm Address
      </Text>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            Address Line 1
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: 221B Baker Street"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.address.address_line_1}
            onChangeText={(text) => handleAddressChange("address_line_1", text)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            City
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: Mumbai"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.address.city}
            onChangeText={(text) => handleAddressChange("city", text)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className="text-md uppercase font-Sen"
          >
            State
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: Maharashtra"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.address.state}
            onChangeText={(text) => handleAddressChange("state", text)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen", color: colors.text }}
            className=" text-md uppercase font-Sen"
          >
            Pincode
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.secondaryBackground,
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", color: colors.text }}
            placeholder="eg: 400001"
            placeholderTextColor={colors.text}
            cursorColor={colors.text}
            value={formData.address.pincode}
            onChangeText={(text) => handleAddressChange("pincode", text)}
            keyboardType="number-pad"
          />
        </Input>
      </FormControl>
    </>
  );

  const renderStepFive = () => (
    <>
      <Text
        style={{ fontFamily: "Sen_Bold", color: colors.text }}
        className="text-2xl font-semibold mb-1 text-center"
      >
        Step 5: Choose Services
      </Text>
      {servicesLoading ? (
        <Box className="flex-1 items-center justify-center my-10">
          <ActivityIndicator size="large" color="#ffffff" />
        </Box>
      ) : (
        <>
          <Box className="flex-row justify-between mt-6">
            <Button
              onPress={() => clearAll()}
              className="bg-black/10 w-[120px] h-10 rounded-md active:opacity-70"
              style={{ backgroundColor: colors.secondaryBackgroundGradient }}
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
              style={{ backgroundColor: colors.secondaryBackgroundGradient }}
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
                              return prev.filter((id) => id !== service.id);
                            }
                          });
                        }}
                      >
                        <CheckboxIndicator className="mr-2">
                          <CheckboxIcon
                            as={Check}
                            width={15}
                            color={
                              isSelected ? colors.secondaryBackground : "white"
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
                          isSelected ? "border-white/80" : "border-white/80"
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
                          Duration: {service.duration} {service.duration_type}
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
    </>
  );

  return (
    <LinearGradient colors={["#1a1a1a", "#000000"]} className="flex-1">
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 40,
              justifyContent: "center",
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              key={step}
              entering={FadeInRight.duration(500)
                .delay(200)
                .easing(Easing.out(Easing.exp))}
              exiting={FadeOutLeft.duration(200).easing(Easing.in(Easing.exp))}
            >
              <Text
                style={{ fontFamily: "Sen_Bold", color: colors.text }}
                className="text-[28px] text-center mb-[30px]"
              >
                Create Account
              </Text>

              {step === 1 && renderStepOne()}
              {step === 2 && renderStepTwo()}
              {step === 3 && renderStepThree()}
              {step === 4 && renderStepFour()}
              {step === 5 && renderStepFive()}

              {error ? (
                <Box className="bg-white/70 rounded-2xl border border-white/20">
                  <Text
                    style={{ fontFamily: "Sen", color: colors.error }}
                    className=" text-center my-[10px] text-[14px]"
                  >
                    {error}
                  </Text>
                </Box>
              ) : null}

              <Animated.View className="mt-5" style={buttonAnimatedStyle}>
                <Box className="flex-row justify-center gap-10">
                  <Button
                    className="h-[55px] w-[120px] rounded-[14px] items-center active:opacity-70"
                    style={actionButtonShadow}
                    onPress={handlePrevStep}
                    onPressIn={handleButtonPressIn}
                    onPressOut={handleButtonPressOut}
                  >
                    <ButtonIcon color={colors.text} as={ArrowLeft} />
                    <ButtonText
                      style={{ fontFamily: "Sen_Bold", color: colors.text }}
                      size="xl"
                    >
                      Prev
                    </ButtonText>
                  </Button>
                  {step < 5 ? (
                    <Button
                      className={`h-[55px] rounded-[14px] items-center ${"w-[120px]"} active:opacity-70`}
                      style={actionButtonShadow}
                      isDisabled={loading || !isStepValid()}
                      onPress={handleNextStep}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                    >
                      <ButtonText
                        style={{ fontFamily: "Sen_Bold", color: colors.text }}
                        size="xl"
                      >
                        Next
                      </ButtonText>
                      <ButtonIcon color={colors.text} as={ArrowRight} />
                    </Button>
                  ) : (
                    <Button
                      className=" h-[55px] w-[120px] rounded-[14px] items-center active:opacity-70"
                      style={actionButtonShadow}
                      isDisabled={loading || !isStepValid()}
                      onPress={handleSignUp}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                    >
                      {loading ? (
                        <ActivityIndicator color="#192f6a" />
                      ) : (
                        <ButtonText
                          style={{ fontFamily: "Sen_Bold", color: colors.text }}
                          className="text-xl"
                        >
                          Sign Up
                        </ButtonText>
                      )}
                    </Button>
                  )}
                </Box>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
