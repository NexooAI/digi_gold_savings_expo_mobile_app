import React from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "@/app/components/AppHeader";
import { Ionicons, MaterialIcons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { BlurView } from 'expo-blur';

export default function ContactUs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = new Animated.Value(0);
  const { width } = useWindowDimensions();
  const cardScale = React.useRef(new Animated.Value(0.9)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  React.useEffect(() => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const openGoogleMaps = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${theme.constants.latitude},${theme.constants.longitude}`;
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Can't open the map link");
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${theme.constants.mobile}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${theme.constants.email}?subject=Inquiry%20About%20Akila%20Jewellers&body=Hello%20Akila%20Jewellers,%0D%0A%0D%0AI%20would%20like%20to%20know%20more%20about...`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <SafeAreaView style={{ flex: 1, marginBottom: 40 }}>
        {/* Animated Header */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            opacity: headerOpacity,
            backgroundColor: "transparent",
            paddingHorizontal: 16,
          }}
        >
          <AppHeader showBackButton={true} backRoute="index" hideMenuIcon={true} />
        </Animated.View>

        {/* Main Content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 280 + insets.top, paddingBottom: 100 + insets.bottom, paddingHorizontal: 16 }}>
          <Animated.View
            style={{
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderRadius: 24,
              padding: 0,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 5,
              marginBottom: 24,
              overflow: 'hidden',
              transform: [{ scale: cardScale }],
              width: '100%',
              maxWidth: 500,
            }}
          >
            <BlurView intensity={30} tint="light" style={{ borderRadius: 24, padding: 0 }}>
              <View style={{ padding: 24 }}>
                {/* Decorative Brand Element */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={styles.diamondIcon}>
                    <Ionicons name="diamond" size={32} color="#fff" />
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.colors.primary, letterSpacing: 1, marginTop: 8 }}>Akila Jewellers</Text>
                </View>
                
                <Text style={styles.title}>Connect With Us</Text>
                
                <Text style={styles.subtitle}>
                  We're here to assist you with all your jewelry needs. Reach out through any of these channels.
                </Text>
                
                {/* Contact Cards */}
                <View style={styles.contactCardsContainer}>
                  {/* Email Card */}
                  <TouchableOpacity 
                    style={[styles.contactCard, styles.emailCard]}
                    onPress={handleEmail}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardIcon}>
                      <MaterialIcons name="email" size={24} color="#fff" />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>Email Us</Text>
                      <Text style={styles.cardValue}>{theme.constants.email}</Text>
                    </View>
                    <Entypo name="chevron-right" size={20} color="#fff" style={styles.cardArrow} />
                  </TouchableOpacity>
                  
                  {/* Call Card */}
                  <TouchableOpacity 
                    style={[styles.contactCard, styles.callCard]}
                    onPress={handleCall}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardIcon}>
                      <Ionicons name="call" size={24} color="#fff" />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>Call Us</Text>
                      <Text style={styles.cardValue}>{theme.constants.mobile}</Text>
                    </View>
                    <Entypo name="chevron-right" size={20} color="#fff" style={styles.cardArrow} />
                  </TouchableOpacity>
                  
                  {/* Visit Card */}
                  <TouchableOpacity 
                    style={[styles.contactCard, styles.visitCard]}
                    onPress={openGoogleMaps}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardIcon}>
                      <FontAwesome5 name="map-marker-alt" size={20} color="#fff" />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>Visit Us</Text>
                      <Text style={styles.cardValue}>{theme.constants.address}</Text>
                    </View>
                    <Entypo name="chevron-right" size={20} color="#fff" style={styles.cardArrow} />
                  </TouchableOpacity>
                </View>
                
                {/* Social Media */}
                <View style={styles.socialContainer}>
                  <Text style={styles.socialTitle}>Follow Us</Text>
                  <View style={styles.socialIcons}>
                    <TouchableOpacity style={styles.socialIcon}>
                      <FontAwesome5 name="facebook-f" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialIcon}>
                      <FontAwesome5 name="instagram" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialIcon}>
                      <FontAwesome5 name="whatsapp" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        </View>
        
        {/* Parallax Header */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            opacity: headerOpacity,
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 200],
                  outputRange: [0, -100],
                  extrapolate: "clamp",
                }),
              },
            ],
          }}
        >
          <ImageBackground
            source={theme.image.shop_icon}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            <View style={styles.headerOverlay}>
              <Text style={styles.headerTitle}>Akila Jewellers</Text>
              <Text style={styles.headerSubtitle}>Your Trusted Jewelry Destination</Text>
              <View style={styles.headerDivider} />
              <Text style={styles.headerContact}>Contact Us</Text>
            </View>
          </ImageBackground>
        </Animated.View>
        
        <View style={styles.spacer} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: moderateScale(80),
  },
  diamondIcon: {
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "serif",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 24,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  contactCardsContainer: {
    marginBottom: 32,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailCard: {
    backgroundColor: '#4a6da7',
  },
  callCard: {
    backgroundColor: '#5a9e56',
  },
  visitCard: {
    backgroundColor: '#b85c40',
  },
  cardIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  cardArrow: {
    marginLeft: 8,
  },
  socialContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123,0,6,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: "rgba(123,0,6,0.15)",
    justifyContent: "flex-end",
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    fontFamily: "serif",
  },
  headerSubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    fontStyle: 'italic',
  },
  headerDivider: {
    height: 2,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginVertical: 12,
  },
  headerContact: {
    fontSize: 20,
    color: "rgba(255,255,255,0.9)",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    fontWeight: '600',
  },
});