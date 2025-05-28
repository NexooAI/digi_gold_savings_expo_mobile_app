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
  Easing,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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

const ProfileCard = ({ children, style, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg'],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }, { rotate }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <View style={styles.cardContainer}>
          <Animated.View
            style={[
              styles.cardGlow,
              {
                opacity: glowOpacity,
              },
            ]}
          />
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.cardGradient}
          >
            {children}
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedIcon = ({ name, color, size, style, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    onPress?.();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity onPress={handlePress}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { rotate }],
        }}
      >
        <Icon name={name} size={size} color={color} style={style} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const RewardBadge = ({ value }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.rewardBadgeContainer}>
      <Animated.View
        style={[
          styles.rewardBadgeGlow,
          {
            opacity: glowOpacity,
          },
        ]}
      />
      <View style={styles.rewardBadge}>
        <AnimatedIcon name="stars" size={24} color="#f59e0b" />
        <Text style={styles.rewardText}>{value}</Text>
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const { isLoggedIn, user, language, logout, setLanguage, updateUser } =
    useGlobalStore();
  const [editingMobile, setEditingMobile] = useState(false);
  const [newMobile, setNewMobile] = useState(user?.mobile?.toString() || "");
  const [verificationCode, setVerificationCode] = useState("");
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomPadding = height * 0.1;
  const profileImageScale = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user, router]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

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
    const newLang = language === "en" ? "mal" : "en";
    await setLanguage(newLang);
  };

  const handleCopyReferralCode = () => {
    Clipboard.setString(user?.referralCode || "");
    Alert.alert(t("copied"), t("referral_code_copied"));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ImageBackground
          source={theme.image.menu_bg}
          resizeMode="stretch"
          style={styles.backgroundImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.75)']}
            style={styles.backgroundGradient}
          >
            <View style={styles.headerContainer}>
              <AppHeader showBackButton={false} backRoute="index" />
            </View>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.contentContainer}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                  <TouchableOpacity onPress={handleImageUpload}>
                    <Animated.View
                      style={[
                        styles.profileImageContainer,
                        {
                          transform: [
                            { scale: profileImageScale },
                            { translateY },
                          ],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                        style={styles.profileImageGradient}
                      >
                        {user?.profileImage ? (
                          <Image
                            source={{ uri: user.profileImage }}
                            style={styles.profileImage}
                          />
                        ) : (
                          <Icon name="person" size={60} color="#ffffff" />
                        )}
                        <View style={styles.editIconContainer}>
                          <AnimatedIcon name="edit" size={20} color="white" />
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  </TouchableOpacity>
                  <Text style={styles.profileName}>{user?.name}</Text>
                  <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>

                {/* User Information Section */}
                <ProfileCard style={styles.cardContainer}>
                  <View style={styles.cardContent}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>{t("personal_info")}</Text>
                      <AnimatedIcon name="person" size={24} color={theme.colors.primary} />
                    </View>
                    <InfoRow label={t("user_id")} value={user?.id || "N/A"} />
                    <View style={styles.divider} />
                    <View style={styles.mobileContainer}>
                      <Text style={styles.labelText}>
                        {t("mobile_number")}
                      </Text>
                      {editingMobile ? (
                        <View style={styles.mobileInputContainer}>
                          <TextInput
                            value={newMobile}
                            onChangeText={setNewMobile}
                            keyboardType={
                              Platform.OS === "ios" ? "number-pad" : "phone-pad"
                            }
                            style={styles.input}
                            placeholder={t("enter_mobile")}
                            placeholderTextColor="#666"
                          />
                          <TouchableOpacity
                            style={styles.updateButton}
                            onPress={handleMobileUpdate}
                          >
                            <Text style={styles.updateButtonText}>
                              {t("verify_update")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.mobileDisplayContainer}>
                          <Text style={styles.valueText}>{user?.mobile}</Text>
                          <AnimatedIcon
                            name="edit"
                            size={20}
                            color={theme.colors.primary}
                            onPress={() => setEditingMobile(true)}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </ProfileCard>

                {/* Referral & Rewards Section */}
                <ProfileCard style={styles.cardContainer}>
                  <View style={styles.cardContent}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        {t("referral_rewards")}
                      </Text>
                      <AnimatedIcon name="card-giftcard" size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.referralContainer}>
                      <Text style={styles.labelText}>{t("your_referral_code")}</Text>
                      <TouchableOpacity
                        onPress={handleCopyReferralCode}
                        style={styles.referralCodeContainer}
                      >
                        <Text style={styles.referralCode}>
                          {user?.referralCode}
                        </Text>
                        <AnimatedIcon name="content-copy" size={20} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.rewardsContainer}>
                      <Text style={styles.labelText}>{t("total_rewards")}</Text>
                      <RewardBadge value={user?.rewards || 0} />
                    </View>
                  </View>
                </ProfileCard>

                {/* Language & Logout Section */}
                <ProfileCard style={styles.cardContainer}>
                  <View style={styles.cardContent}>
                    <TouchableOpacity
                      style={styles.languageContainer}
                      onPress={toggleLanguage}
                    >
                      <View style={styles.languageContent}>
                        <AnimatedIcon name="language" size={24} color={theme.colors.primary} />
                        <Text style={styles.labelText}>{t("language")}</Text>
                      </View>
                      <Text style={styles.valueText}>
                        {language === "en" ? "English" : "മലയാളം"}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                      style={styles.logoutContainer}
                      onPress={handleLogout}
                    >
                      <View style={styles.logoutContent}>
                        <AnimatedIcon name="logout" size={24} color="#ef4444" />
                        <Text style={styles.logoutText}>{t("logout")}</Text>
                      </View>
                      <Icon name="chevron-right" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </ProfileCard>
              </View>
            </ScrollView>
          </LinearGradient>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-center justify-between my-2">
    <Text style={styles.labelText}>{label}</Text>
    <Text style={styles.valueText}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 80,
    paddingBottom: 100,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profileImageGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileEmail: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#ffffff',
    marginBottom: 16,
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: theme.colors.primary,
    borderRadius: 40,
    zIndex: -1,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 20,
  },
  cardContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  labelText: {
    fontSize: 16,
    color: '#4a4a4a',
    fontWeight: '500',
  },
  valueText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 12,
  },
  mobileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileInputContainer: {
    flex: 2,
  },
  mobileDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    paddingVertical: 8,
    color: '#1a1a1a',
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  referralContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  referralCode: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  rewardBadgeContainer: {
    position: 'relative',
    padding: 8,
  },
  rewardBadgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f59e0b',
    borderRadius: 20,
    transform: [{ scale: 1.2 }],
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  rewardText: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
