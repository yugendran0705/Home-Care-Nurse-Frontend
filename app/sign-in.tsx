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
import { useColorScheme } from "@/hooks/useColorScheme";
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
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import data from "../config.js";

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
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
      const response = await axios.post(`${data.apiUrl}/users/login`, {
        email: credentials.email.trim(),
        password: credentials.password.trim(),
      });

      const { access_token, refresh_token } = response.data;
      await AsyncStorage.setItem("access_token", access_token);

      await AsyncStorage.setItem("refresh_token", refresh_token);

      router.push("/(tabs)/profile");
    } catch (e: any) {
      const errorMessage =
        (e.response &&
          e.response.data &&
          (e.response.data.message || e.response.data.error)) ||
        "Invalid credentials or network error.";
      setError(errorMessage);
      console.warn("Sign in failed:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#000000"]} className="flex-1">
      <SafeAreaView className="flex-1 bg-[#369BFF]/80">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <VStack className="items-center flex-1 mx-5">
              <Animated.View
                className="items-center mb-[16px]"
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
                    style={{ fontFamily: "Sen" }}
                    className="text-[18px] text-white/70 font-Sen mt-[20px] mb-[20px] w-full text-center"
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
                  className="bg-white w-full mt-5 px-8 py-10 rounded-3xl items-center"
                >
                  <FormControl size="lg" className="w-full text-red-500">
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{ fontFamily: "Sen" }}
                        className="text-gray-800 uppercase leading-10 font-Sen"
                      >
                        email
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      className="my-1 rounded-xl h-14 bg-[#F0F5FA] pl-4 border-0"
                      size="md"
                    >
                      <InputSlot>
                        <InputIcon as={MailIcon} />
                      </InputSlot>
                      <InputField
                        style={{ fontFamily: "Sen" }}
                        className="text-black"
                        placeholder="example@gmail.com"
                        value={credentials.email}
                        onChangeText={(text) => handleChange("email", text)}
                        cursorColor="black"
                      />
                    </Input>
                  </FormControl>
                  <FormControl size="lg" className="w-full" isRequired={false}>
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{ fontFamily: "Sen" }}
                        className="text-gray-800 uppercase leading-10 font-Sen"
                      >
                        PASSWORD
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      className="my-1 rounded-xl h-14 bg-[#F0F5FA] pl-4 pr-4 border-0"
                      size="md"
                    >
                      <InputSlot>
                        <InputIcon as={LockIcon} />
                      </InputSlot>
                      <InputField
                        style={{ fontFamily: "Sen" }}
                        className="text-black"
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="********"
                        value={credentials.password}
                        onChangeText={(text) => handleChange("password", text)}
                        cursorColor="black"
                      />
                      <InputSlot
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      >
                        <InputIcon
                          as={isPasswordVisible ? EyeIcon : EyeOffIcon}
                        />
                      </InputSlot>
                    </Input>
                  </FormControl>
                  {!!error && (
                    <Text
                      style={{ fontFamily: "Sen" }}
                      className="text-red-500 font-Sen"
                    >
                      {error}
                    </Text>
                  )}
                  <Link href="https://gluestack.io/" className="ml-auto">
                    <Text
                      style={{ fontFamily: "Sen" }}
                      className="text-[#369BFF]"
                    >
                      Forgot Password?
                    </Text>
                  </Link>

                  <Button
                    className="w-full bg-[#369BFF] rounded-xl h-14 mt-2"
                    onPress={() => {
                      handleSignIn();
                    }}
                    isDisabled={isLoading}
                  >
                    {isLoading && <ButtonSpinner />}
                    <ButtonText
                      style={{ fontFamily: "Sen_Bold" }}
                      className="text-white"
                    >
                      SIGN IN
                    </ButtonText>
                  </Button>
                  <Animated.View style={footerAnimatedStyle}>
                    <Box className="flex-row mt-4">
                      <Text
                        style={{ fontFamily: "Sen" }}
                        className="text-[#646982]"
                      >
                        Don&apos;t have an account?
                      </Text>
                      <Link href="./sign-up" asChild className="ml-2">
                        <Text
                          style={{ fontFamily: "Sen_Bold" }}
                          className="text-[#369BFF]"
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
