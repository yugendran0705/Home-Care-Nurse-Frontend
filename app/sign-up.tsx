import { Box } from "@/components/ui/box/index";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button/index";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Mars, Venus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  const actionButtonShadow = {
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  };

  const normalizeErrorMessage = (value: unknown, fallback: string) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join("\n");
    if (value && typeof value === "object") return JSON.stringify(value);
    return fallback;
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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

    if (step !== 3 || hasInitializedLocation) return;

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
  }, [step, hasInitializedLocation]);

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
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...formData,
        years_of_experience: parseInt(formData.years_of_experience, 10) || 0,
      };

      const response = await axiosInstance.post("nurses/register", payload);
      const { access_token, refresh_token } = response.data;
      await AsyncStorage.setItem("access_token", access_token);
      await AsyncStorage.setItem("refresh_token", refresh_token);
      Alert.alert("Success!", "Your nurse profile has been created.", [
        { text: "OK", onPress: () => router.push("/(tabs)/profile") },
      ]);
    } catch (e: any) {
      const apiMessage =
        e?.response?.data?.detail ?? e?.response?.data?.message;
      const errorMessage =
        e.message ||
        normalizeErrorMessage(
          apiMessage,
          "Registration failed. Please try again.",
        );
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER STEPS WITH FADE/SLIDE ANIMATIONS ---
  const renderStepOne = () => (
    <>
      <Text
        style={{ fontFamily: "Sen_Bold" }}
        className="text-2xl font-semibold text-[#E2E8F0] mb-5 text-center"
      >
        Step 1: Personal Details
      </Text>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: Dhruva"
            placeholderTextColor="#000000a1"
            value={formData.first_name}
            onChangeText={(text) => handleFormChange("first_name", text)}
            cursorColor="black"
            type="text"
          />
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: U R"
            placeholderTextColor="#000000a1"
            value={formData.last_name}
            onChangeText={(text) => handleFormChange("last_name", text)}
            cursorColor="black"
            type="text"
          />
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: example@gmail.com"
            placeholderTextColor="#000000a1"
            value={formData.email}
            onChangeText={(text) => handleFormChange("email", text)}
            autoCapitalize="none"
            cursorColor="black"
            type="text"
          />
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 pr-4 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            type={isPasswordVisible ? "text" : "password"}
            placeholder="eg: ********"
            placeholderTextColor="#000000a1"
            value={formData.password}
            onChangeText={(text) => handleFormChange("password", text)}
            cursorColor="black"
          />
          <InputSlot onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <InputIcon as={isPasswordVisible ? EyeIcon : EyeOffIcon} />
          </InputSlot>
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: 9876543210"
            placeholderTextColor="#000000a1"
            value={formData.phone_number}
            onChangeText={(text) => handleFormChange("phone_number", text)}
            keyboardType="phone-pad"
            cursorColor="black"
            type="text"
          />
        </Input>
      </FormControl>

      <Pressable onPress={() => setShowDatePicker(true)}>
        <Text
          style={{ fontFamily: "Sen" }}
          className="text-white text-md uppercase font-Sen mb-2"
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
          }}
          className="h-16 bg-[#F0F5FA] rounded-[14px] px-[15px] mb-[15px] mt-1 justify-center"
        >
          <Text
            style={{ fontFamily: "Sen" }}
            className={
              formData.date_of_birth
                ? "text-[14px] text-black"
                : "text-[14px] text-[#000000]/60"
            }
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
        style={{ fontFamily: "Sen" }}
        className="text-white text-md uppercase font-Sen mb-2"
      >
        Gender
      </Text>
      <Box className="flex-row justify-between gap-4 mb-[15px]">
        {["Male", "Female"].map((g) => {
          const isActive = formData.gender === g;

          return (
            <Box
              key={g}
              className={`flex-1 rounded-[16px] p-[3px] ${isActive ? "bg-black/10" : "bg-[#F0F5FA]"}`}
            >
              <Button
                onPress={() => handleFormChange("gender", g)}
                className={`h-[50px] rounded-[14px] flex-row items-center justify-center ${
                  isActive ? "bg-white/50" : "bg-[#F0F5FA]"
                }`}
                variant="solid"
              >
                <ButtonIcon
                  as={g === "Male" ? Mars : Venus}
                  className={`mr-[8px] ${
                    isActive ? "text-black" : "text-black/70"
                  }`}
                />

                <ButtonText
                  style={{ fontFamily: "Sen" }}
                  className={`text-[16px] font-medium ${
                    isActive ? "text-black" : "text-black/70"
                  }`}
                >
                  {g}
                </ButtonText>
              </Button>
            </Box>
          );
        })}
      </Box>
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text
        style={{ fontFamily: "Sen_Bold" }}
        className="text-2xl font-semibold text-[#E2E8F0] mb-5 text-center"
      >
        Step 2: Professional Details
      </Text>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: RN-2026-001"
            placeholderTextColor="#000000a1"
            value={formData.license_number}
            onChangeText={(text) => handleFormChange("license_number", text)}
            cursorColor="black"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: 5"
            placeholderTextColor="#000000a1"
            value={formData.years_of_experience}
            onChangeText={(text) =>
              handleFormChange("years_of_experience", text)
            }
            keyboardType="number-pad"
            cursorColor="black"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: https://..."
            placeholderTextColor="#000000a1"
            value={formData.profile_picture_url}
            onChangeText={(text) =>
              handleFormChange("profile_picture_url", text)
            }
            autoCapitalize="none"
            cursorColor="black"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-24 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen", textAlignVertical: "top" }}
            className="text-black mt-4"
            placeholder="Write a short bio (optional)"
            placeholderTextColor="#000000a1"
            value={formData.bio}
            onChangeText={(text) => handleFormChange("bio", text)}
            multiline
            cursorColor="black"
          />
        </Input>
      </FormControl>
    </>
  );

  const renderStepThree = () => (
    <Box className="flex-1 min-h-[500px]">
      <Text
        style={{ fontFamily: "Sen_Bold" }}
        className="text-2xl font-semibold text-[#E2E8F0] mb-5 text-center"
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
        }}
        className="flex-1 rounded-[14px] overflow-hidden bg-[#F0F5FA] justify-center items-center mb-5"
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
          <Box className="absolute inset-0 items-center justify-center bg-black/10">
            <ActivityIndicator size="large" color="#000" />
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
        }}
        className="bg-[#F0F5FA] h-[55px] rounded-[14px] items-center justify-center mt-[10px]"
        onPress={handleConfirmLocationAndGeocode}
        isDisabled={loading}
      >
        {isGeocoding ? (
          <ActivityIndicator color="#192f6a" />
        ) : (
          <Text
            style={{ fontFamily: "Sen_Bold" }}
            className="text-black text-[18px]"
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
        style={{ fontFamily: "Sen_Bold" }}
        className="text-2xl font-semibold text-[#E2E8F0] mb-5 text-center"
      >
        Step 4: Confirm Address
      </Text>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: 221B Baker Street"
            placeholderTextColor="#000000a1"
            value={formData.address.address_line_1}
            onChangeText={(text) => handleAddressChange("address_line_1", text)}
            cursorColor="black"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: Mumbai"
            placeholderTextColor="#000000a1"
            value={formData.address.city}
            onChangeText={(text) => handleAddressChange("city", text)}
            cursorColor="black"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: Maharashtra"
            placeholderTextColor="#000000a1"
            value={formData.address.state}
            onChangeText={(text) => handleAddressChange("state", text)}
            cursorColor="black"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen" }}
            className="text-white text-md uppercase font-Sen"
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
          }}
          className="my-1 rounded-xl h-16 bg-[#F0F5FA] pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen" }}
            className="text-black"
            placeholder="eg: 400001"
            placeholderTextColor="#000000a1"
            value={formData.address.pincode}
            onChangeText={(text) => handleAddressChange("pincode", text)}
            keyboardType="number-pad"
            cursorColor="black"
          />
        </Input>
      </FormControl>
    </>
  );

  return (
    <LinearGradient colors={["#1a1a1a", "#000000"]} className="flex-1">
      <SafeAreaView className="flex-1 bg-[#369BFF]/80">
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
                style={{ fontFamily: "Sen_Bold" }}
                className="text-[28px] text-[#F7FAFC] text-center mb-[30px]"
              >
                Create Account
              </Text>

              {step === 1 && renderStepOne()}
              {step === 2 && renderStepTwo()}
              {step === 3 && renderStepThree()}
              {step === 4 && renderStepFour()}

              {error ? (
                <Box className="bg-white/70 rounded-2xl border border-white/20">
                  <Text
                    style={{ fontFamily: "Sen" }}
                    className="text-red-500 text-center my-[10px] text-[14px]"
                  >
                    {error}
                  </Text>
                </Box>
              ) : null}

              <Animated.View className="mt-5" style={buttonAnimatedStyle}>
                <Box className="flex-row justify-center gap-10">
                  <Button
                    className="bg-[#F0F5FA] h-[55px] w-[120px] rounded-[14px] items-center"
                    style={actionButtonShadow}
                    onPress={handlePrevStep}
                    onPressIn={handleButtonPressIn}
                    onPressOut={handleButtonPressOut}
                  >
                    <ButtonIcon as={ArrowLeft} />
                    <ButtonText
                      style={{ fontFamily: "Sen_Bold" }}
                      className="text-black text-xl"
                    >
                      Prev
                    </ButtonText>
                  </Button>
                  {step !== 3 &&
                    (step < 4 ? (
                      <Button
                        className={`bg-[#F0F5FA] h-[55px] rounded-[14px] items-center ${"w-[120px]"}`}
                        style={actionButtonShadow}
                        isDisabled={loading}
                        onPress={handleNextStep}
                        onPressIn={handleButtonPressIn}
                        onPressOut={handleButtonPressOut}
                      >
                        <ButtonText
                          style={{ fontFamily: "Sen_Bold" }}
                          className="text-black text-xl"
                        >
                          Next
                        </ButtonText>
                        <ButtonIcon as={ArrowRight} />
                      </Button>
                    ) : (
                      <Button
                        className="bg-[#F0F5FA] h-[55px] w-[120px] rounded-[14px] items-center"
                        style={actionButtonShadow}
                        isDisabled={loading}
                        onPress={handleSignUp}
                        onPressIn={handleButtonPressIn}
                        onPressOut={handleButtonPressOut}
                      >
                        {loading ? (
                          <ActivityIndicator color="#192f6a" />
                        ) : (
                          <ButtonText
                            style={{ fontFamily: "Sen_Bold" }}
                            className="text-black text-xl"
                          >
                            Sign Up
                          </ButtonText>
                        )}
                      </Button>
                    ))}
                </Box>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
