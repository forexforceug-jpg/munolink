// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: "Munolink",
    slug: "munolink",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.forexforceug.munolink",
      buildNumber: "1"
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#006B3F"
      },
      package: "com.forexforceug.munolink",
      versionCode: 1,
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.INTERNET",
        "android.permission.READ_PHONE_STATE",
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.VIBRATE",
        "android.permission.POST_NOTIFICATIONS"
      ]
    },
    
    plugins: [
      "expo-location",
      "expo-notifications",
      "expo-font",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 24,
            "targetSdkVersion": 36,        // ← CHANGED FROM 34 TO 36
            "compileSdkVersion": 36        // ← CHANGED FROM 34 TO 36
          }
        }
      ]
    ],
    
    extra: {
      eas: {
        projectId: "bfaef68b-9092-42d7-86ae-1f4e3dcd05b6"
      },
      yoolaApiKey: process.env.YOOLA_API_KEY,
      yoolaApiUrl: process.env.YOOLA_API_URL
    },
    
    assetBundlePatterns: [
      "**/*"
    ]
  }
};