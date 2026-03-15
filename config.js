import Constants from "expo-constants";

const API_CONFIGURATION_ERROR = "Service is down, please try again later.";

const rawApiUrl = Constants.expoConfig?.extra?.apiUrl;
const trimmedApiUrl = typeof rawApiUrl === "string" ? rawApiUrl.trim() : "";

function isValidUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

const apiConfigurationError = isValidUrl(trimmedApiUrl)
  ? null
  : API_CONFIGURATION_ERROR;

const data = {
  apiUrl: apiConfigurationError ? null : trimmedApiUrl,
  apiConfigurationError,
};
export default data;
