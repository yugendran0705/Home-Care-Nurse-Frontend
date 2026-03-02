import Constants from "expo-constants";

const apiUrl = Constants.expoConfig?.extra?.apiUrl;

if (!apiUrl || typeof apiUrl !== "string") {
  throw new Error(
    "Missing API configuration: Constants.expoConfig.extra.apiUrl is not set. Configure `extra.apiUrl` in app config/environment before starting the app.",
  );
}

const data = {
  apiUrl,
};
export default data;
