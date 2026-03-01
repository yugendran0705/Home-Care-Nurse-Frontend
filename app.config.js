import "dotenv/config";

export default {
  expo: {
    name: "YourApp",
    slug: "your-app",
    scheme: "homecarenursefrontend",
    extra: {
      apiUrl: process.env.EXPO_API_URL,
    },
  },
};
