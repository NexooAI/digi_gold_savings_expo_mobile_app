import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  StyleSheet,
  Share,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import AppHeader from "@/app/components/AppHeader";
import useGlobalStore from "@/store/global.store";
import { t, AppLocale } from "@/i18n";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const ProfileScreen = () => {
  const { isLoggedIn, user, language, logout, setLanguage, updateUser } =
    useGlobalStore();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile?.toString() || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
  });
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomPadding = height * 0.1;
  const profileImageScale = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Wave animation effect
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      t("logout_confirmation_title") || "Confirm Logout",
      t("logout_confirmation_message") || "Are you sure you want to logout?",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: async () => {
            try {
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
      Alert.alert(
        "Permission Required",
        "Please allow access to photo library"
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      updateUser({ ...user, profileImage: result.assets[0].uri });
    }
  };

  const handleSave = () => {
    updateUser({
      ...user,
      name: editData.name,
      email: editData.email,
      mobile: editData.mobile,
    });
    setEditing(false);
    Alert.alert(t("successTitle") || "Success", "Profile updated successfully");
    
  };

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing - reset to original values
      setEditData({
        name: user?.name || "",
        email: user?.email || "",
        mobile: user?.mobile?.toString() || "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        username: user?.username || "",
      });
    }
    setEditing(!editing);
  };

  const updateEditField = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  const toggleLanguage = async () => {
    let newLang: AppLocale;
    switch (language) {
      case 'en':
        newLang = 'ta';
        break;
      case 'ta':
        newLang = 'en';
        break;
      default:
        newLang = 'en';
    }
    await setLanguage(newLang);
  };

  const handleCopyReferralCode = () => {
    Clipboard.setString(user?.referralCode || "");
    Alert.alert(t("copied"), t("referral_code_copied"));
  };

  const handleShareApp = async () => {
    try {
      const playStoreLink =
        "https://play.google.com/store/apps/details?id=com.nexooai.dcjewellery&hl=en-US";
      const message = `Join me on Akila Jewellers Gold and Diamonds! Download the app from: ${playStoreLink}`;

      const result = await Share.share({
        message: message,
        url: playStoreLink, // iOS
        title: "Akila Jewellers Gold and Diamonds", // Android
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          //console.log('Shared with activity type:', result.activityType);
        } else {
          // shared
          //console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        //console.log('Share dismissed');
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share the app link");
    }
  };

  const handleChangeKYC = () => {
    router.push("/home/kyc");
  };

  const handleChangeMPIN = () => {
    router.push({
      pathname: "/reset_mpin",
      params: { mode: "reset", from: "profile" },
    });
  };

  // Interpolated wave animation
  const waveInterpolation = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "5deg"],
  });

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: 0 }}>
      <View style={styles.backgroundImage}>
        <LinearGradient
          colors={[
            theme.colors.primary,
            theme.colors.primary,
            theme.colors.primary,
          ]}
          style={StyleSheet.absoluteFill}
        />

        <View className="absolute top-0 left-0 right-0 z-10 px-4">
          <AppHeader showBackButton={false} backRoute="index" />
        </View>

        <Animated.View
          style={[
            styles.waveEffect,
            { transform: [{ rotate: waveInterpolation }] },
          ]}
        />

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 80,
            paddingBottom: bottomPadding,
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Floating Profile Section */}
          {editing ? (
            // Edit Profile Form
            <View style={styles.editFormContainer}>
              <View style={styles.editFormHeader}>
                <Text style={styles.editFormTitle}>{t('editProfile')}</Text>
                <View style={styles.editFormActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleEditToggle}
                  >
                    <Icon name="close" size={20} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveFormButton}
                    onPress={handleSave}
                  >
                    <Icon name="check" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Profile Image Edit */}
              <View style={styles.editImageSection}>
                <TouchableOpacity
                  onPress={handleImageUpload}
                  style={styles.editImageContainer}
                >
                  {user?.profileImage ? (
                    <Image
                      source={{ uri: user.profileImage }}
                      style={styles.editProfileImage}
                    />
                  ) : (
                    <View style={styles.editImagePlaceholder}>
                      <Icon name="person" size={40} color="#666" />
                    </View>
                  )}
                  <View style={styles.editImageOverlay}>
                    <Icon name="camera-alt" size={20} color="white" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.editImageText}>{t('tapToChangePhoto')}</Text>
              </View>

              {/* Edit Form Fields */}
              <View style={styles.editFormFields}>
                {/* <View style={styles.formRow}>
                  <View style={[styles.formFieldHalf, { marginRight: 10 }]}>
                    <Text style={styles.formLabel}>First Name</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editData.firstName}
                      onChangeText={(value) => updateEditField('firstName', value)}
                      placeholder="Enter first name"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.formFieldHalf}>
                    <Text style={styles.formLabel}>Last Name</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editData.lastName}
                      onChangeText={(value) => updateEditField('lastName', value)}
                      placeholder="Enter last name"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View> */}

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('fullName')}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editData.name}
                    onChangeText={(value) => updateEditField("name", value)}
                    placeholder={t('enterFullName')}
                    placeholderTextColor="#999"
                  />
                </View>

                {/* <View style={styles.formField}>
                  <Text style={styles.formLabel}>Username</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editData.username}
                    onChangeText={(value) => updateEditField('username', value)}
                    placeholder="Enter username"
                    placeholderTextColor="#999"
                  />
                </View> */}

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('emailAddress')}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editData.email}
                    onChangeText={(value) => updateEditField("email", value)}
                    placeholder={t('enterEmailAddress')}
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('mobileNumber')}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editData.mobile}
                    onChangeText={(value) => updateEditField("mobile", value)}
                    placeholder={t('enterMobileNumber')}
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    editable={false}
                  />
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelFormButton}
                    onPress={handleEditToggle}
                  >
                    <Text style={styles.cancelFormButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveMainButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveMainButtonText}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            // Normal Profile View
            <Animated.View
              style={[
                styles.profileHeader,
                { transform: [{ scale: profileImageScale }] },
              ]}
            >
              <TouchableOpacity onPress={handleImageUpload} activeOpacity={0.8}>
                <View style={styles.profileImageContainer}>
                  {user?.profileImage ? (
                    <Image
                      source={{ uri: user.profileImage }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Icon name="person" size={60} color="#ffffff" />
                    </View>
                  )}
                  <View style={styles.editBadge}>
                    <Icon name="edit" size={18} color={theme.colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>

              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>

              {/* Edit Button */}
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={handleEditToggle}
              >
                <Icon
                  name="edit"
                  size={18}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.editProfileButtonText}>{t('editProfile')}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Personal Info Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon
                  name="person-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.cardTitle}>{t("personal_info")}</Text>
                <View style={styles.userIdBadge}>
                  <Text style={styles.userIdText}>{t('user_id') + ": "}{user?.id}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Icon name="phone" size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.infoLabel}>{t("mobile_number")}</Text>
                <Text style={styles.infoValue}>
                  {user?.mobile || t('notProvided')}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Icon name="supervised-user-circle" size={20} color={theme.colors.primary}/>
                </View>
                <Text style={styles.infoLabel}>{t('user_id')}</Text>
                <Text style={styles.infoValue}>{user?.id}</Text>
              </View>
            </View>

            {/* Referral Card */}
            <View style={[styles.card, styles.referralCard]}>
              <LinearGradient
                colors={[
                  "rgba(255, 201, 12, 0.1)",
                  "rgba(255, 201, 12, 0.05)",
                  "rgba(255, 255, 255, 0.9)",
                ]}
                style={styles.referralCardGradient}
              >
                <View style={styles.cardHeader}>
                  <Icon
                    name="card-giftcard"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>{t("referral_rewards")}</Text>
                </View>

                <View style={styles.referralContent}>
                  <Text style={styles.referralText}>
                    {t("your_referral_code")}
                  </Text>
                  <TouchableOpacity
                    style={styles.referralCodeContainer}
                    onPress={handleCopyReferralCode}
                    activeOpacity={0.7}
                  >
                    <View style={styles.referralCodeLeft}>
                      <Text style={styles.referralCodeLabel}>{t('yourCode')}</Text>
                      <Text style={styles.referralCode}>
                        {user?.referralCode || "GOLD123"}
                      </Text>
                    </View>
                    <View style={styles.copyIconContainer}>
                      <Icon
                        name="content-copy"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.rewardsContainer}>
                    <View style={styles.rewardsLeft}>
                      <Icon
                        name="stars"
                        size={28}
                        color={theme.colors.secondary}
                      />
                      <View style={styles.rewardsTextContainer}>
                        <Text style={styles.rewardsLabel}>
                          {t("total_rewards")}
                        </Text>
                        <Text style={styles.rewardsValue}>
                          {user?.rewards || 0} {t('points')}
                        </Text>
                      </View>
                    </View>
                    {/* <TouchableOpacity style={styles.rewardsButton}>
                      <Text style={styles.rewardsButtonText}>View</Text>
                    </TouchableOpacity> */}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.inviteButton}
                  activeOpacity={0.8}
                  onPress={handleShareApp}
                >
                  <Icon
                    name="person-add"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.inviteButtonText}>
                    {t('inviteFriendsEarn')}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Settings Card */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleChangeKYC}
              >
                <View
                  style={[styles.settingIcon, { backgroundColor: "#E3F2FD" }]}
                >
                  <Icon
                    name="verified-user"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.settingText}>{t('changeKYC')}</Text>
                <Icon name="chevron-right" size={24} color="#9E9E9E" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleChangeMPIN}
              >
                <View
                  style={[styles.settingIcon, { backgroundColor: "#E8F5E9" }]}
                >
                  <Icon name="lock" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.settingText}>{t('changeMPIN')}</Text>
                <Icon name="chevron-right" size={24} color="#9E9E9E" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.settingItem}
                onPress={toggleLanguage}
              >
                <View
                  style={[styles.settingIcon, { backgroundColor: "#FFF3E0" }]}
                >
                  <Icon
                    name="language"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.settingText}>{t("language")}</Text>
                <Text style={styles.settingValue}>
                  {language === "en" ? t('english') : t('tamil')}
                </Text>
                <Icon name="chevron-right" size={24} color="#9E9E9E" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleLogout}
              >
                <View
                  style={[styles.settingIcon, { backgroundColor: "#FFEBEE" }]}
                >
                  <Icon name="logout" size={24} color="#F44336" />
                </View>
                <Text style={[styles.settingText, { color: "#F44336" }]}>
                  {t("logout")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  waveEffect: {
    position: "absolute",
    top: -100,
    left: -50,
    right: -50,
    height: 200,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 100,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 15,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 20,
  },
  userStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  referralCard: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.88)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#333",
  },
  userIdBadge: {
    marginLeft: "auto",
    backgroundColor: "rgba(133, 1, 17, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userIdText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(133, 1, 17, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginRight: 8,
  },
  editContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  editInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    paddingVertical: 4,
    marginRight: 10,
    color: "#333",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  saveButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 5,
  },
  referralContent: {
    marginVertical: 10,
  },
  referralText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  referralCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 201, 12, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  referralCodeLeft: {
    flex: 1,
  },
  referralCodeLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  copyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(133, 1, 17, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  rewardsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
  },
  rewardsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rewardsTextContainer: {
    marginLeft: 10,
  },
  rewardsLabel: {
    fontSize: 16,
    color: "#666",
  },
  rewardsValue: {
    fontWeight: "bold",
    color: theme.colors.secondary,
  },
  rewardsButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 12,
    marginLeft: 10,
  },
  rewardsButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  inviteButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  inviteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(133, 1, 17, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  settingValue: {
    fontSize: 14,
    color: "#9E9E9E",
    marginRight: 8,
  },
  referralCardGradient: {
    borderRadius: 20,
    padding: 1,
  },
  editFormContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  editFormHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  editFormTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  editFormActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelButton: {
    padding: 10,
  },
  saveFormButton: {
    padding: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
  },
  editImageSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  editImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: "relative",
  },
  editImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  editImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  editProfileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  editImageText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  editFormFields: {
    flex: 1,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  formFieldHalf: {
    flex: 1,
  },
  formField: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#F9F9F9",
    color: "#333",
    fontSize: 16,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  cancelFormButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelFormButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "bold",
  },
  saveMainButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  saveMainButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 15,
  },
  editProfileButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
