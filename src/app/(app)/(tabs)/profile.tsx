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
  Modal,
  KeyboardAvoidingView,
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
import { t } from "@/i18n";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import AuthGuard from "@/components/AuthGuard";
import { userAPI } from "@/services/api";
import apiWithLoader from "@/services/apiWithLoader";
import { getFullImageUrl } from "@/utils/imageUtils";

const ProfileScreen = () => {
  const { isLoggedIn, user, language, logout, setLanguage, updateUser } =
    useGlobalStore();
  const [editing, setEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [localProfilePhoto, setLocalProfilePhoto] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile?.toString() || "",
  });
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomPadding = 100; // Fixed padding to account for bottom bar
  const profileImageScale = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Get profile photo from local storage
  const getLocalProfilePhoto = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.profile_photo) {
          setLocalProfilePhoto(parsedUser.profile_photo);
        }
      }
    } catch (error) {
      console.error("Error getting local profile photo:", error);
    }
  };

  // Load local profile photo on component mount and when user changes
  useEffect(() => {
    getLocalProfilePhoto();
  }, [user]);

  // Function to get the best available profile image
  const getProfileImageSource = () => {
    // Priority: 1. Server profileImage, 2. Local profile_photo, 3. undefined
    if (user?.profileImage) {
      return { uri: getFullImageUrl(user.profileImage) };
    } else if (localProfilePhoto) {
      return { uri: getFullImageUrl(localProfilePhoto) };
    }
    return undefined;
  };

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



  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      logout();
      router.replace("/(auth)/login");
      setShowLogoutModal(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleImageUpload = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("permissionResult", permissionResult);
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
    console.log("result", result , !result.canceled);
    if (!result.canceled) {
      try {
        console.log("user", user);
        // Check if user ID exists
        if (!user?.id) {
          Alert.alert(
            "Error", 
            "User ID not found. Please login again."
          );
          return;
        }
        
        // Set local loading state
        setIsUploading(true);
        console.log("result.assets[0].uri", result.assets[0].uri);
        const uploadResponse = await userAPI.uploadProfileImage(user.id, result.assets[0].uri);
        console.log("uploadResponse", uploadResponse);
        const responseData = uploadResponse.data;
        if (responseData.success && responseData.url) {
          // Construct the full URL with base URL prefix
          const fullImageUrl = `${theme.baseUrl}${responseData.url}`;
          console.log("fullImageUrl", fullImageUrl);
          
          // Update local storage with the new profile photo
          try {
            const userData = await AsyncStorage.getItem("userData");
            if (userData) {
              const parsedUser = JSON.parse(userData);
              parsedUser.profile_photo = responseData.url;
              await AsyncStorage.setItem("userData", JSON.stringify(parsedUser));
            }
          } catch (error) {
            console.error("Error updating local storage:", error);
          }
          
          // Update user profile with the uploaded image URL
          updateUser({ ...user, profile_photo: responseData.url });
          
          Alert.alert(
            "Success", 
            "Profile image updated successfully!"
          );
        } else {
          Alert.alert(
            "Upload Failed", 
            responseData.message || "Failed to upload profile image. Please try again."
          );
        }
      } catch (error) {
        console.error('Profile image upload error:', error);
        Alert.alert(
          "Upload Error", 
          "Failed to upload profile image. Please check your internet connection and try again."
        );
      } finally {
        // Reset loading state
        setIsUploading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      // Check if user ID exists
      console.log("user", user);
      if (!user?.id) {
        Alert.alert(
          t("errorTitle") || "Error", 
          "User ID not found. Please login again."
        );
        return;
      }

      // Prepare the data to send to API
      const profileData = {
        name: editData.name,
        email: editData.email,
        mobile_number: editData.mobile,
      };

      // Call the API to update profile
      const response = await apiWithLoader.user.updateProfile(Number(user.id), profileData);

      if (response && response.data) {
        // Update local storage with the new profile data
        try {
          const userData = await AsyncStorage.getItem("userData");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            const updatedUserData = {
              ...parsedUser,
              ...profileData,
            };
            await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
          }
        } catch (error) {
          console.error("Error updating local storage:", error);
        }

        // Update global user state with the response data
        updateUser({
          ...user,
          ...profileData, // Use the data returned from API
        });
        setEditing(false);
        Alert.alert(t("successTitle") || "Success", "Profile updated successfully");
      } else {
        // Handle API error response
        Alert.alert(
          t("errorTitle") || "Error", 
          "Failed to update profile. Please try again."
        );
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(
        t("errorTitle") || "Error", 
        "Failed to update profile. Please check your internet connection and try again."
      );
    }
  };

  const handleEditToggle = async () => {
    if (editing) {
      // Cancel editing - reset to original values
      setEditData({
        name: user?.name || "",
        email: user?.email || "",
        mobile: user?.mobile?.toString() || "",
      });
    } else {
      // Load data from local storage when entering edit mode
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setEditData({
            name: parsedUser.name || user?.name || "",
            email: parsedUser.email || user?.email || "",
            mobile: parsedUser.mobile?.toString() || user?.mobile?.toString() || "",
          });
        } else {
          // Fallback to global state if local storage is empty
          setEditData({
            name: user?.name || "",
            email: user?.email || "",
            mobile: user?.mobile?.toString() || "",
          });
        }
      } catch (error) {
        console.error("Error loading local user data:", error);
        // Fallback to global state
        setEditData({
          name: user?.name || "",
          email: user?.email || "",
          mobile: user?.mobile?.toString() || "",
        });
      }
    }
    setEditing(!editing);
  };

  const updateEditField = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  const toggleLanguage = async () => {
    const newLang = language === "en" ? "mal" : "en";
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
      const message = `Join me on DC Jewellers Gold and Diamonds! Download the app from: ${playStoreLink}`;

      const result = await Share.share({
        message: message,
        url: playStoreLink, // iOS
        title: "DC Jewellers Gold and Diamonds", // Android
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
    <AuthGuard>
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.backgroundImage}>
            <LinearGradient
              colors={[
                theme.colors.primary + "E6",
                theme.colors.support_container[1] + "E6",
                theme.colors.support_container[2] + "E6",
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
                {/* <View style={styles.editFormActions}>
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
                </View> */}
              </View>

              {/* Profile Image Edit */}
              {/* <View style={styles.editImageSection}>
                <TouchableOpacity
                  onPress={handleImageUpload}
                  style={styles.editImageContainer}
                  disabled={isUploading}
                >
                  {getProfileImageSource() ? (
                    <Image
                      source={getProfileImageSource()}
                      style={styles.editProfileImage}
                    />
                  ) : (
                    <View style={styles.editImagePlaceholder}>
                      <Icon name="person" size={40} color="#666" />
                    </View>
                  )}
                  <View style={styles.editImageOverlay}>
                    {isUploading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Icon name="camera-alt" size={20} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.editImageText}>
                  {isUploading ? "Uploading..." : t('tapToChangePhoto')}
                </Text>
              </View> */}

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
                    onPress={() => setEditing(!editing)}
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
            // ID Card Style Profile View
            <View style={styles.idCardContainer}>
              <LinearGradient
                colors={[
                  theme.colors.primary,
                  theme.colors.support_container[1],
                  theme.colors.support_container[2],
                ]}
                style={styles.idCardGradient}
              >
                {/* ID Card Header */}
                <View style={styles.idCardHeader}>
                  <View style={styles.idCardLogo}>
                    <Icon name="verified" size={24} color="white" />
                  </View>
                  <Text style={styles.idCardTitle}>DC JEWELLERS</Text>
                  <Text style={styles.idCardSubtitle}>DIGITAL ID CARD</Text>
                </View>

                {/* ID Card Content */}
                <View style={styles.idCardContent}>
                  <View style={styles.idCardLeft}>
                    <TouchableOpacity 
                      onPress={handleImageUpload} 
                      activeOpacity={0.8} 
                      disabled={isUploading}
                      style={styles.idCardImageContainer}
                    >
                      {getProfileImageSource() ? (
                        <Image
                          source={getProfileImageSource()}
                          style={styles.idCardImage}
                        />
                      ) : (
                        <View style={styles.idCardImagePlaceholder}>
                          <Icon name="person" size={40} color="white" />
                        </View>
                      )}
                      {!isUploading && (
                        <View style={styles.idCardImageOverlay}>
                          <Icon name="edit" size={16} color="white" />
                        </View>
                      )}
                      {isUploading && (
                        <View style={styles.idCardImageOverlay}>
                          <ActivityIndicator size="small" color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.idCardRight}>
                    <View style={styles.idCardInfoRow}>
                      <Text style={styles.idCardLabel}>NAME : </Text>
                      <Text style={styles.idCardValue}>{user?.name || 'Not Provided'}</Text>
                    </View>
                    
                    <View style={styles.idCardInfoRow}>
                      <Text style={styles.idCardLabel}>EMAIL : </Text>
                      <Text style={styles.idCardValue}>{user?.email || 'Not Provided'}</Text>
                    </View>
                    
                    <View style={styles.idCardInfoRow}>
                      <Text style={styles.idCardLabel}>MOBILE : </Text>
                      <Text style={styles.idCardValue}> {user?.mobile || t('notProvided')}</Text>
                    </View>
                    
                    <View style={styles.idCardInfoRow}>
                      <Text style={styles.idCardLabel}>USER ID : </Text>
                      <Text style={styles.idCardValue}>{user?.id || 'N/A'}</Text>
                    </View>
                  </View>
                </View>

                {/* ID Card Footer */}
                <View style={styles.idCardFooter}>
                  <View style={styles.idCardFooterLeft}>
                    <Text style={styles.idCardFooterText}>Valid Until: Lifetime</Text>
                  </View>
                  <View style={styles.idCardFooterRight}>
                    <TouchableOpacity
                      style={styles.editIdCardButton}
                      onPress={handleEditToggle}
                    >
                      <Icon name="edit" size={16} color="white" />
                      <Text style={styles.editIdCardButtonText}>EDIT</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Personal Info Card */}
            {/* <View style={styles.card}>
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
            </View> */}

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
                        {user?.referralCode|| 'N/A'}
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
                  {language === "en" ? t('english') : t('malayalam')}
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
      </KeyboardAvoidingView>

      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("logout_confirmation_title")}</Text>
            <Text style={styles.modalMessage}>
              {t("logout_confirmation_message")}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={cancelLogout}
              >
                <Text style={styles.modalCancelButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmLogout}
              >
                <Text style={styles.modalConfirmButtonText}>{t("logout")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </AuthGuard>
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
  idCardContainer: {
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  idCardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  idCardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  idCardLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  idCardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  idCardSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  idCardContent: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
  },
  idCardLeft: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  },
  idCardImageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    position: "relative",
  },
  idCardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  idCardImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  idCardImageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 15,
    padding: 5,
    
  },
  idCardRight: {
    width: "100%",
    paddingTop: 20,
  },
  idCardInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  idCardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  idCardValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    flex: 1,
    flexWrap: "wrap",
    textAlign: "right",
  },
  idCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  idCardFooterLeft: {
    flex: 1,
  },
  idCardFooterText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  idCardFooterRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  editIdCardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  editIdCardButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
