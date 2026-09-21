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
import { Fonts } from "@/constants/Typography";
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

      const normalizedApiUrl = urlData.apiUrl.replace(/\/+$/, "");
      const loginUrl = `${normalizedApiUrl}/users/login`;
      const response = await axios.post(loginUrl, {
        email: credentials.email.trim(),
        password: credentials.password.trim(),
      });

      const { access_token, refresh_token } = response.data;
      await AsyncStorage.setItem("access_token", access_token);

      await AsyncStorage.setItem("refresh_token", refresh_token);

      router.replace("/(tabs)/bookings");
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
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <LinearGradient
        colors={[colors.primaryTint, colors.background]}
        className="flex-1"
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
                <Box
                  className="w-[88px] h-[88px] mt-[48px] rounded-3xl items-center justify-center"
                  style={{ backgroundColor: colors.surface }}
                >
                  <Image
                    source={require("../assets/images/HC.png")}
                    alt="HomeCare"
                    resizeMode="contain"
                    className="w-[56px] h-[48px]"
                  />
                </Box>
                <Box className="items-center">
                  <Text
                    style={{ fontFamily: Fonts.bold, color: colors.text }}
                    className="text-[26px] mt-[24px] text-center"
                  >
                    Welcome back
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.regular,
                      color: colors.textSecondary,
                    }}
                    className="text-[15px] mt-[6px] mb-[8px] text-center"
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
                  space="md"
                  style={{
                    backgroundColor: colors.secondaryBackground,
                    borderColor: colors.border,
                    shadowColor: colors.shadowColor,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.06,
                    shadowRadius: 20,
                    elevation: 3,
                  }}
                  className="w-full mt-6 px-6 py-7 rounded-3xl items-center border"
                >
                  <FormControl size="lg" className="w-full">
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{
                          fontFamily: Fonts.semibold,
                          color: colors.textSecondary,
                          letterSpacing: 0.8,
                        }}
                        className="uppercase text-[12px]"
                      >
                        email
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      className="mt-2 rounded-xl h-14 pl-3 border"
                      size="md"
                      style={{
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                      }}
                    >
                      <InputSlot>
                        <InputIcon
                          style={{ color: colors.icon }}
                          as={MailIcon}
                        />
                      </InputSlot>
                      <InputField
                        style={{
                          fontFamily: Fonts.regular,
                          color: colors.text,
                        }}
                        placeholder="example@gmail.com"
                        value={credentials.email}
                        onChangeText={(text) => handleChange("email", text)}
                        cursorColor={colors.cursorColor}
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </Input>
                  </FormControl>
                  <FormControl size="lg" className="w-full" isRequired={false}>
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{
                          fontFamily: Fonts.semibold,
                          color: colors.textSecondary,
                          letterSpacing: 0.8,
                        }}
                        className="uppercase text-[12px]"
                      >
                        PASSWORD
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      className="mt-2 rounded-xl h-14 pl-3 border"
                      size="md"
                      style={{
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                      }}
                    >
                      <InputSlot>
                        <InputIcon
                          style={{ color: colors.icon }}
                          as={LockIcon}
                        />
                      </InputSlot>
                      <InputField
                        style={{
                          fontFamily: Fonts.regular,
                          color: colors.text,
                        }}
                        secureTextEntry={!isPasswordVisible}
                        placeholder="••••••••"
                        value={credentials.password}
                        onChangeText={(text) => handleChange("password", text)}
                        cursorColor={colors.cursorColor}
                        placeholderTextColor={colors.textMuted}
                      />
                      <InputSlot
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      >
                        <InputIcon
                          className="mr-2"
                          style={{ color: colors.icon }}
                          as={isPasswordVisible ? EyeIcon : EyeOffIcon}
                        />
                      </InputSlot>
                    </Input>
                  </FormControl>
                  {!!error && (
                    <Box
                      className="w-full min-h-[44px] rounded-xl px-3 py-2 justify-center border"
                      style={{
                        backgroundColor: colors.errorSoft,
                        borderColor: colors.error,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: Fonts.regular,
                          color: colors.error,
                        }}
                        className="text-[13px] leading-5"
                      >
                        {error}
                      </Text>
                    </Box>
                  )}
                  <Link href="https://gluestack.io/" className="ml-auto">
                    <Text
                      style={{
                        fontFamily: Fonts.semibold,
                        color: colors.primary,
                      }}
                      className="text-[13px]"
                    >
                      Forgot Password?
                    </Text>
                  </Link>

                  <Button
                    className="w-full rounded-xl h-14 mt-1 active:opacity-90"
                    style={{
                      backgroundColor: colors.secondaryBackgroundGradient,
                      shadowColor: colors.primaryDeep,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.25,
                      shadowRadius: 12,
                      elevation: 4,
                    }}
                    onPress={() => {
                      handleSignIn();
                    }}
                    isDisabled={isLoading}
                  >
                    {isLoading && <ButtonSpinner color={colors.textInverted} />}
                    <ButtonText
                      style={{
                        fontFamily: Fonts.semibold,
                        color: colors.textInverted,
                        letterSpacing: 0.6,
                      }}
                    >
                      SIGN IN
                    </ButtonText>
                  </Button>
                  <Animated.View style={footerAnimatedStyle}>
                    <Box className="flex-row mt-3 items-center">
                      <Text
                        style={{
                          fontFamily: Fonts.regular,
                          color: colors.textSecondary,
                        }}
                        className="text-[14px]"
                      >
                        Don&apos;t have an account?
                      </Text>
                      <Link href="./sign-up" asChild className="ml-2">
                        <Text
                          style={{
                            fontFamily: Fonts.semibold,
                            color: colors.primary,
                          }}
                          className="text-[14px]"
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
      </LinearGradient>
    </SafeAreaView>
  );
}
