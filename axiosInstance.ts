import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import urlData from "./config.js";

const apiBaseUrl = urlData?.apiUrl;
const apiConfigurationError = urlData?.apiConfigurationError;

const ensureApiConfiguration = () => {
  if (apiConfigurationError || !apiBaseUrl) {
    throw new Error(
      apiConfigurationError || "Service is down, please try again later.",
    );
  }
};

const getNormalizedApiBaseUrl = () => {
  ensureApiConfiguration();
  return apiBaseUrl!.replace(/\/+$/, "");
};

// validating tokens type
const getNormalizedTokenFromStorage = async (
  storageKey: "access_token" | "refresh_token",
) => {
  const storedValue = await AsyncStorage.getItem(storageKey);
  if (!storedValue) return null;

  const trimmedValue = storedValue.trim();
  if (!trimmedValue) return null;

  let normalizedToken: string | null = trimmedValue;
  const looksLikeJson =
    trimmedValue.startsWith("{") ||
    trimmedValue.startsWith("[") ||
    trimmedValue.startsWith('"');

  if (looksLikeJson) {
    try {
      const parsedValue = JSON.parse(trimmedValue);

      if (typeof parsedValue === "string") {
        normalizedToken = parsedValue;
      } else if (parsedValue && typeof parsedValue === "object") {
        const legacyToken = parsedValue[storageKey];
        normalizedToken = typeof legacyToken === "string" ? legacyToken : null;
      }
    } catch {
      normalizedToken = trimmedValue;
    }
  }

  if (!normalizedToken) return null;

  if (normalizedToken !== storedValue) {
    await AsyncStorage.setItem(storageKey, normalizedToken);
  }

  return normalizedToken;
};

// Create a dedicated Axios instance
const axiosInstance = axios.create({
  baseURL: apiBaseUrl ?? undefined,
});

// --- Request Interceptor ---
// This runs before every request is sent
axiosInstance.interceptors.request.use(
  async (config) => {
    ensureApiConfiguration();

    const tokenString = await getNormalizedTokenFromStorage("access_token");
    if (tokenString) {
      config.headers.Authorization = `Bearer ${tokenString}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- Response Interceptor ---
// This runs for every response that comes back from the API
axiosInstance.interceptors.response.use(
  (response) => response, // Directly return successful responses
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 (Unauthorized) and it's not a retry request
    // Skip token refresh for login requests
    const isAuthRequest = originalRequest.url?.includes("users/login");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true; // Mark it as a retry to prevent infinite loops

      try {
        ensureApiConfiguration();

        const refreshTokenString =
          await getNormalizedTokenFromStorage("refresh_token");
        if (!refreshTokenString) throw new Error("No refresh token found");

        // Call the refresh token endpoint
        const refreshUrl = `${getNormalizedApiBaseUrl()}/users/refresh`;
        const { data } = await axios.post(refreshUrl, {
          refresh_token: refreshTokenString,
        });

        // Store the new tokens
        await AsyncStorage.setItem("access_token", data.access_token);
        await AsyncStorage.setItem("refresh_token", data.refresh_token);

        // Update the header of the original request with the new token
        originalRequest.headers["Authorization"] =
          `Bearer ${data.access_token}`;

        // Retry the original request with the new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout the user
        console.error("Token refresh failed:", refreshError);
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");
        router.replace("/sign-in");
        return Promise.reject(refreshError);
      }
    }

    // For all other errors, just reject the promise
    return Promise.reject(error);
  },
);

export default axiosInstance;
