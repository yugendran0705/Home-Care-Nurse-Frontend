import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withTiming(0, { duration: 600 });

    formOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));

    footerOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
  }, []);

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
  }));

  const handleSignIn = async () => {
    if (isLoading) return;
    setError("");

    if (!credentials.email || !credentials.password) {
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
      await AsyncStorage.setItem(
        "access_token",
        JSON.stringify({ access_token }),
      );
      await AsyncStorage.setItem(
        "refresh_token",
        JSON.stringify({ refresh_token }),
      );

      router.push("/(tabs)");
    } catch (e: any) {
      const errorMessage =
        e.response?.data?.message || "Invalid credentials or network error.";
      setError(errorMessage);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = getStyles(colorScheme);

  return (
    <LinearGradient
      colors={["#1a1a1a", "#000000"]}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.innerContainer}>
            <View style={styles.contentWrapper}>
              <Animated.View
                style={[styles.headerContainer, headerAnimatedStyle]}
              >
                <Feather
                  name="activity"
                  size={48}
                  color={Colors[colorScheme].primary}
                />
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Sign in to manage your bookings.
                </Text>
              </Animated.View>

              <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
                <View style={styles.inputContainer}>
                  <Feather
                    name="mail"
                    size={20}
                    color={Colors[colorScheme].inputBorder}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={Colors[colorScheme].inputBorder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={credentials.email}
                    onChangeText={(text) => handleChange("email", text)}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Feather
                    name="lock"
                    size={20}
                    color={Colors[colorScheme].inputBorder}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={Colors[colorScheme].inputBorder}
                    secureTextEntry={!isPasswordVisible}
                    value={credentials.password}
                    onChangeText={(text) => handleChange("password", text)}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={isPasswordVisible ? "eye-off" : "eye"}
                      size={20}
                      color={Colors[colorScheme].inputBorder}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotPasswordButton}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[
                    styles.signInButton,
                    isLoading && styles.signInButtonDisabled,
                  ]}
                  onPress={handleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signInButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={[styles.footerContainer, footerAnimatedStyle]}
              >
                <TouchableOpacity onPress={() => router.push("./sign-up")}>
                  <Text style={styles.footerText}>
                    Don&apos;t have an account?{" "}
                    <Text style={styles.signUpLink}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    gradientBackground: { flex: 1 },

    safeArea: {
      flex: 1,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },

    keyboardAvoidingView: { flex: 1 },

    innerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },

    contentWrapper: {
      width: "100%",
      maxWidth: 400,
      justifyContent: "center",
      alignItems: "center",
    },

    headerContainer: {
      alignItems: "center",
      marginBottom: 16,
    },

    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#FFFFFF", // white for readability
      marginTop: 16,
      textAlign: "center",
    },

    subtitle: {
      fontSize: 16,
      color: "#B0B0B0", // light gray
      marginTop: 8,
      textAlign: "center",
    },

    formContainer: {
      width: "100%",
      alignItems: "center",
      marginBottom: 16,
    },

    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#2A2A2A", // dark input bg
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#444444", // subtle border
      paddingHorizontal: 16,
      marginBottom: 16,
      width: "100%",
    },

    inputIcon: { marginRight: 12 },

    input: {
      flex: 1,
      height: 50,
      color: "#FFFFFF",
      fontSize: 16,
    },

    eyeIcon: { padding: 4 },

    forgotPasswordButton: {
      alignSelf: "flex-end",
      marginBottom: 16,
      width: "100%",
    },

    forgotPasswordText: {
      color: "#4c8bf5", // primary accent (blue)
      fontSize: 14,
    },

    errorText: {
      color: "#FF4D4D", // error red
      textAlign: "center",
      marginBottom: 16,
      fontSize: 14,
    },

    signInButton: {
      backgroundColor: "#4c8bf5", // accent blue
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      height: 62,
      width: "100%",
      marginTop: 8,
    },

    signInButtonDisabled: {
      backgroundColor: "#555555", // muted gray
    },

    signInButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "bold",
    },

    footerContainer: {
      alignItems: "center",
      marginTop: 8,
    },

    footerText: {
      color: "#B0B0B0", // secondary text
      fontSize: 14,
      textAlign: "center",
    },

    signUpLink: {
      color: "#4c8bf5", // accent
      fontWeight: "bold",
    },
  });
