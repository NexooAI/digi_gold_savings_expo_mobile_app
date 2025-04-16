import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Clipboard,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import AppHeader from "@/app/components/AppHeader";
import useGlobalStore from "@/store/global.store";
import { t } from "@/i18n";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/constants/theme";

export default function ProfileScreen() {
  const { isLoggedIn, user, language, logout, setLanguage, updateUser } =
    useGlobalStore();
  const [editingMobile, setEditingMobile] = useState(false);
  const [newMobile, setNewMobile] = useState(user?.mobile?.toString() || "");
  const [verificationCode, setVerificationCode] = useState("");
  const { height } = useWindowDimensions();
  const bottomPadding = height * 0.1; // Adjust based on screen size
  // Always call hooks at the top level.
  useEffect(() => {
    // If the user is not available, redirect after render.
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user, router]);

  // Instead of returning null, render a loading indicator until user is available.
  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // await AsyncStorage.multiRemove(["userMpin"]);
              // useGlobalStore.getState().logout();
              logout();
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("Logout error:", error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleImageUpload = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t("permission_required"), t("gallery_permission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      updateUser({ ...user, profileImage: result.assets[0].uri });
    }
  };

  const handleMobileUpdate = async () => {
    updateUser({ ...user, mobile: newMobile });
    setEditingMobile(false);
    Alert.alert(t("success"), t("mobile_updated"));
  };

  const toggleLanguage = async () => {
    const newLang = language === "en" ? "ta" : "en";
    await setLanguage(newLang);
  };

  const handleCopyReferralCode = () => {
    Clipboard.setString(user?.referralCode || "");
    Alert.alert(t("copied"), t("referral_code_copied"));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ImageBackground
        source={theme.image.menu_bg}
        resizeMode="repeat"
        className="flex-1"
        imageStyle={{ opacity: 0.95 }}
      >
        <View className="absolute top-0 left-0 right-0 z-10 px-4">
          <AppHeader showBackButton={false} backRoute="index" />
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 120,
            paddingBottom: bottomPadding,
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View>
            {/* Profile Header */}
            <View className="items-center mb-10">
              <TouchableOpacity onPress={handleImageUpload}>
                <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center border-4 border-white shadow-md">
                  {user?.profileImage ? (
                    <Image
                      source={{ uri: user.profileImage }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <Icon name="person" size={60} color="#6b7280" />
                  )}
                  <View className="absolute bottom-0 right-0 bg-primary rounded-full p-2 shadow-sm">
                    <Icon name="edit" size={20} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
              <Text className="text-white text-2xl font-bold mt-4">
                {user?.name}
              </Text>
              <Text className="text-gray-200 text-sm">{user?.email}</Text>
            </View>

            {/* User Information Section */}
            <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold">{t("personal_info")}</Text>
                {/* <TouchableOpacity>
                  <Icon name="edit" size={24} color="#3b82f6" />
                </TouchableOpacity> */}
              </View>
              <InfoRow label={t("user_id")} value={user?.idProof || "N/A"} />
              <View className="border-b border-gray-200 my-3" />
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600 flex-1">
                  {t("mobile_number")}
                </Text>
                {editingMobile ? (
                  <View className="flex-2">
                    <TextInput
                      value={newMobile}
                      onChangeText={setNewMobile}
                      keyboardType={
                        Platform.OS === "ios" ? "number-pad" : "phone-pad"
                      }
                      className="border-b border-primary py-1 text-gray-800"
                      placeholder={t("enter_mobile")}
                      placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity
                      className="mt-2 bg-primary py-2 px-4 rounded-full"
                      onPress={handleMobileUpdate}
                    >
                      <Text className="text-white text-center">
                        {t("verify_update")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-row items-center flex-2">
                    <Text className="text-gray-800">{user?.mobile}</Text>
                    {/* <TouchableOpacity
                      className="ml-2"
                      onPress={() => setEditingMobile(true)}
                    >
                      <Icon name="edit" size={20} color="#3b82f6" />
                    </TouchableOpacity> */}
                  </View>
                )}
              </View>
            </View>

            {/* Referral & Rewards Section */}
            <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
              <Text className="text-lg font-bold mb-4">
                {t("referral_rewards")}
              </Text>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-600">{t("your_referral_code")}</Text>
                <TouchableOpacity
                  onPress={handleCopyReferralCode}
                  className="flex-row items-center bg-blue-50 px-4 py-2 rounded-full"
                >
                  <Text className="text-primary font-bold mr-2">
                    {user?.referralCode}
                  </Text>
                  {/* <Icon name="content-copy" size={18} color="#3b82f6" /> */}
                </TouchableOpacity>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">{t("total_rewards")}</Text>
                <View className="flex-row items-center">
                  <Icon name="stars" size={24} color="#f59e0b" />
                  <Text className="text-amber-600 font-bold ml-2 text-lg">
                    {user?.rewards || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Language & Logout Section */}
            <View className="bg-white rounded-2xl p-6 shadow-lg">
              <TouchableOpacity
                className="flex-row items-center justify-between py-3"
                onPress={toggleLanguage}
              >
                <Text className="text-gray-600">{t("language")}</Text>
                <Text className="text-primary">
                  {language === "en" ? "English" : "தமிழ்"}
                </Text>
              </TouchableOpacity>
              <View className="border-b border-gray-200 my-3" />
              <TouchableOpacity
                className="flex-row items-center justify-between py-3"
                onPress={handleLogout}
              >
                <Text className="text-red-600">{t("logout")}</Text>
                <Icon name="logout" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-center justify-between my-2">
    <Text className="text-gray-600 flex-1">{label}</Text>
    <Text className="text-gray-800 flex-2">{value}</Text>
  </View>
);
