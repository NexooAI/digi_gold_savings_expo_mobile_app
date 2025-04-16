import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  ImageBackground,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import useGlobalStore from "@/store/global.store";
import AppHeader from "@/app/components/AppHeader";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";

export default function ReferCodeScreen() {
  // Retrieve referral code from your global store; fallback to a default value
  const { user } = useGlobalStore();
  const code = user.referralCode || "DEFAULT123";

  const router = useRouter();

  // Copy code to clipboard and notify user
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied", "Referral code copied to clipboard!");
  };

  // Share referral code using native share dialog
  const onShare = async () => {
    try {
      const result = await Share.share({
        title: "Refer & Earn",
        message: `Use my referral code ${code} to sign up and earn rewards! Download the app here: https://play.google.com/store/search?q=dcjewellers&c=apps`,
      });
      if (result.action === Share.sharedAction) {
        console.log("Shared successfully");
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ImageBackground
      source={theme.image.gold_pattern}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.headerContainer}>
        <AppHeader showBackButton={true} backRoute="index" />
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-6 left-4 p-2 bg-white rounded-full z-10"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.overlay}>
        <Text style={styles.title}>Refer & Earn</Text>
        <Text style={styles.description}>
          Share your referral code with your friends and earn rewards when they
          join!
        </Text>

        {/* Referral Code & Copy Button */}
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{code}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
            <Ionicons name="copy-outline" size={20} color="#fff" />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>Share Code</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 25,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f6f6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  codeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e0406",
    marginRight: 12,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  copyButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "bold",
  },
  shareButton: {
    backgroundColor: "#ffc90c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  shareButtonText: {
    fontSize: 18,
    color: "#2e0406",
    fontWeight: "bold",
  },
});
