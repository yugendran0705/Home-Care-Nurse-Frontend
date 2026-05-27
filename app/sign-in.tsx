import { Box } from "@/components/ui/box/index";
import {
  Button,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button/index";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control/index";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "@/components/ui/icon/index";
import { Image } from "@/components/ui/image/index";
import {
  Input,
  InputField,
  InputIcon,
  InputSlot,
} from "@/components/ui/input/index";
import { Text } from "@/components/ui/text/index";
import { VStack } from "@/components/ui/vstack/index";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import urlData from "../config.js";

export default function SignInScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(50);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withTiming(0, { duration: 600 });

    formOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));

    footerOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    footerTranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));
  }, [
    footerOpacity,
    footerTranslateY,
    formOpacity,
    formTranslateY,
    headerOpacity,
    headerTranslateY,
  ]);

  const handleChange = (name: string, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

  const normalizeErrorMessage = (errorValue: unknown) => {
    if (typeof errorValue !== "string")
      return "Invalid credentials or network error.";

    const compactMessage = errorValue.replace(/\s+/g, " ").trim();
    if (!compactMessage) return "Invalid credentials or network error.";

    return compactMessage;
  };

  const handleSignIn = async () => {
    if (isLoading) return;
    setError("");
    const email = credentials.email.trim();
    const password = credentials.password.trim();

    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      if (urlData.apiConfigurationError || !urlData.apiUrl) {
        throw new Error(
          urlData.apiConfigurationError ||
            "Service is down, please try again later.",
        );
      }
      const response = await axios.post(`${urlData.apiUrl}users/login`, {
        email: credentials.email.trim(),
        password: credentials.password.trim(),
      });

      const { access_token, refresh_token } = response.data;
      await AsyncStorage.setItem("access_token", access_token);

      await AsyncStorage.setItem("refresh_token", refresh_token);

      router.push("/(tabs)/profile");
    } catch (e: any) {
      const apiErrorRaw =
        e &&
        e.response &&
        e.response.data &&
        (e.response.data.message ||
          e.response.data.error ||
          e.response.data.detail);
      const errorMessage = apiErrorRaw
        ? normalizeErrorMessage(apiErrorRaw)
        : e.message || "Invalid credentials or network error.";
      setError(errorMessage);
      console.warn("Sign in failed:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#000000"]} className="flex-1">
      <SafeAreaView
        className="flex-1 "
        style={{ backgroundColor: colors.background }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <VStack className="items-center flex-1 mx-5">
              <Animated.View
                className="items-center"
                style={headerAnimatedStyle}
              >
                <Box className="w-[85px] h-[71px] mt-[60px]">
                  <Image
                    source={require("../assets/images/HC.png")}
                    alt="HomeCare"
                    resizeMode="contain"
                    className="w-full h-full"
                  />
                </Box>
                <Box>
                  <Text
                    style={{ fontFamily: "Sen", color: colors.text }}
                    className="text-[18px] font-Sen mt-[20px] mb-[20px] w-full text-center"
                  >
                    Sign in to manage your bookings
                  </Text>
                </Box>
              </Animated.View>
              <Animated.View
                className="w-full mb-[16px] items-center"
                style={formAnimatedStyle}
              >
                <VStack
                  space="lg"
                  style={{ backgroundColor: colors.secondaryBackground }}
                  className=" w-full mt-5 px-8 py-10 rounded-3xl items-center"
                >
                  <FormControl size="lg" className="w-full text-red-500">
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{ fontFamily: "Sen", color: colors.text }}
                        className=" uppercase leading-10 font-Sen"
                      >
                        email
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      className="my-1 rounded-xl h-14 pl-4 border-0"
                      size="md"
                      style={{ backgroundColor: colors.background }}
                    >
                      <InputSlot>
                        <InputIcon
                          style={{ color: colors.text }}
                          as={MailIcon}
                        />
                      </InputSlot>
                      <InputField
                        style={{ fontFamily: "Sen", color: colors.text }}
                        placeholder="example@gmail.com"
                        value={credentials.email}
                        onChangeText={(text) => handleChange("email", text)}
                        cursorColor={colors.text}
                        placeholderTextColor={colors.text}
                      />
                    </Input>
                  </FormControl>
                  <FormControl size="lg" className="w-full" isRequired={false}>
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{ fontFamily: "Sen", color: colors.text }}
                        className=" uppercase leading-10 font-Sen"
                      >
                        PASSWORD
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      className="my-1 rounded-xl h-14 pl-4 border-0"
                      size="md"
                      style={{ backgroundColor: colors.background }}
                    >
                      <InputSlot>
                        <InputIcon
                          style={{ color: colors.text }}
                          as={LockIcon}
                        />
                      </InputSlot>
                      <InputField
                        style={{ fontFamily: "Sen", color: colors.text }}
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="********"
                        value={credentials.password}
                        onChangeText={(text) => handleChange("password", text)}
                        cursorColor={colors.text}
                        placeholderTextColor={colors.text}
                      />
                      <InputSlot
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      >
                        <InputIcon
                          className="mr-2"
                          style={{ color: colors.text }}
                          as={isPasswordVisible ? EyeIcon : EyeOffIcon}
                        />
                      </InputSlot>
                    </Input>
                  </FormControl>
                  {!!error && (
                    <Box className="w-full min-h-[44px] rounded-xl bg-red-50 px-3 py-2 justify-center">
                      <Text
                        style={{ fontFamily: "Sen" }}
                        className="text-red-600 font-Sen text-[13px] leading-5"
                      >
                        {error}
                      </Text>
                    </Box>
                  )}
                  <Link href="https://gluestack.io/" className="ml-auto">
                    <Text style={{ fontFamily: "Sen", color: colors.text }}>
                      Forgot Password?
                    </Text>
                  </Link>

                  <Button
                    className="w-full rounded-xl h-14 mt-2 active:opacity-70"
                    style={{
                      backgroundColor: colors.secondaryBackgroundGradient,
                    }}
                    onPress={() => {
                      handleSignIn();
                    }}
                    isDisabled={isLoading}
                  >
                    {isLoading && <ButtonSpinner />}
                    <ButtonText
                      style={{ fontFamily: "Sen_Bold", color: colors.text }}
                    >
                      SIGN IN
                    </ButtonText>
                  </Button>
                  <Animated.View style={footerAnimatedStyle}>
                    <Box className="flex-row mt-4">
                      <Text style={{ fontFamily: "Sen", color: colors.text }}>
                        Don&apos;t have an account?
                      </Text>
                      <Link href="./sign-up" asChild className="ml-2">
                        <Text
                          style={{ fontFamily: "Sen_Bold", color: colors.text }}
                        >
                          SIGN UP
                        </Text>
                      </Link>
                    </Box>
                  </Animated.View>
                </VStack>
              </Animated.View>
            </VStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
