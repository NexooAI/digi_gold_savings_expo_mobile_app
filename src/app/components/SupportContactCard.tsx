import { LinearGradient } from "expo-linear-gradient";
import {
  TouchableOpacity,
  Linking,
  Alert,
  Text,
  View,
  Platform,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { theme } from "@/constants/theme";
import { useEffect, useRef, useState } from "react";

const { width } = Dimensions.get("window");

interface FloatingElementProps {
  delay?: number;
  size?: number;
  color?: string;
}

interface ContactOptionProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  gradient: readonly [string, string, ...string[]];
  delay?: number;
}

const FloatingElement: React.FC<FloatingElementProps> = ({ 
  delay = 0, 
  size = 20, 
  color = "rgba(255,215,0,0.3)" 
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000 + delay,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000 + delay,
          useNativeDriver: true,
        }),
      ])
    );

    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000 + delay,
        useNativeDriver: true,
      })
    );

    setTimeout(() => {
      floating.start();
      rotation.start();
    }, delay);

    return () => {
      floating.stop();
      rotation.stop();
    };
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          borderRadius: moderateScale(10),
          top: Math.random() * 60 + 10,
          left: `${Math.random() * 60 + 10}%`,
          width: size,
          height: size,
          backgroundColor: color,
        },
        {
          transform: [{ translateY }, { rotate }],
        },
      ]}
    />
  );
};

const ContactOption: React.FC<ContactOptionProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  gradient, 
  delay = 0 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glow = Animated.loop(
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
    );

    setTimeout(() => glow.start(), delay);

    return () => glow.stop();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      style={styles.contactOptionWrapper}
    >
      <Animated.View
        style={[
          styles.contactOption,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={gradient}
          style={styles.contactOptionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              styles.iconGlowContainer,
              {
                opacity: glowOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={['#FFD700', 'transparent']}
              style={styles.iconGlow}
            />
          </Animated.View>
          
          <View style={styles.contactIconContainer}>
            <Ionicons name={icon as any} size={20} color="#fff" />
          </View>
          
          <View style={styles.contactTextArea}>
            <Text style={styles.contactTitle}>{title}</Text>
            <Text style={styles.contactSubtitle}>{subtitle}</Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SupportContactCard = () => {
  const cardScaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerGlowAnim = useRef(new Animated.Value(0)).current;
  const [showSocialOptions, setShowSocialOptions] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(cardScaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const headerGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(headerGlowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(headerGlowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    headerGlow.start();

    return () => headerGlow.stop();
  }, []);

  const handleCall = () => {
    Linking.openURL(`tel:+919061803999`).catch((err) =>
      Alert.alert("Error", "Could not open dialer")
    );
  };

  const handleEmail = () => {
    Linking.openURL("mailto:dcjewellerstcr@gmail.com").catch((err) =>
      Alert.alert("Error", "Could not open email client")
    );
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/919061803999").catch((err) =>
      Alert.alert("Error", "Could not open WhatsApp")
    );
  };

  const handleLiveChat = () => {
    Alert.alert("Live Chat", "Live chat feature coming soon!");
  };

  const headerGlowOpacity = headerGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.9],
  });

  return (
    <Animated.View 
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: cardScaleAnim }]
        }
      ]}
    >
      {/* Floating Background Elements */}
      <View style={styles.floatingElementsContainer}>
        <FloatingElement delay={0} size={15} color="rgba(255,215,0,0.2)" />
        <FloatingElement delay={1000} size={12} color="rgba(255,107,107,0.2)" />
        <FloatingElement delay={2000} size={18} color="rgba(133,1,17,0.3)" />
        <FloatingElement delay={3000} size={10} color="rgba(255,255,255,0.2)" />
      </View>

      <LinearGradient
        colors={['#850111', '#5a000b', '#2e0406']}
        style={styles.mainGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated Header */}
        <View style={styles.headerContainer}>
          <Animated.View
            style={[
              styles.headerGlow,
              {
                opacity: headerGlowOpacity,
              },
            ]}
          />
          
          <View style={styles.headerContent}>
            <LinearGradient
              colors={['#FFD700', '#FFC90C']}
              style={styles.mainIconContainer}
            >
              <MaterialIcons name="support-agent" size={28} color="#850111" />
            </LinearGradient>
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.mainTitle}>24/7 Gold Support</Text>
              <Text style={styles.mainSubtitle}>We're always here to help you</Text>
            </View>
            
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setShowSocialOptions(!showSocialOptions)}
            >
              <Ionicons 
                name={showSocialOptions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#FFD700" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Decorative Separator */}
        <View style={styles.decorativeSeparator}>
          <LinearGradient
            colors={['transparent', '#FFD700', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separatorLine}
          />
          <View style={styles.separatorDots}>
            {[0, 1, 2].map((_, index) => (
              <View key={index} style={styles.separatorDot} />
            ))}
          </View>
        </View>

        {/* Primary Contact Options */}
        <View style={styles.contactOptionsContainer}>
          <ContactOption
            icon="call"
            title="+91 9061803999"
            subtitle="Instant Phone Support"
            onPress={handleCall}
            gradient={['#4CAF50', '#45A049']}
            delay={200}
          />
          
          <ContactOption
            icon="mail"
            title="dcjewellerstcr@gmail.com"
            subtitle="Email Us Anytime"
            onPress={handleEmail}
            gradient={['#2196F3', '#1976D2']}
            delay={400}
          />
        </View>

        {/* Extended Options */}
        {showSocialOptions && (
          <Animated.View style={styles.extendedOptions}>
            <ContactOption
              icon="logo-whatsapp"
              title="WhatsApp Support"
              subtitle="Chat with us instantly"
              onPress={handleWhatsApp}
              gradient={['#25D366', '#20BA5A']}
              delay={100}
            />
            
            <ContactOption
              icon="chatbubble-ellipses"
              title="Live Chat"
              subtitle="Real-time assistance"
              onPress={handleLiveChat}
              gradient={['#FF6B6B', '#FF5252']}
              delay={200}
            />
          </Animated.View>
        )}

        {/* Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.availabilityBadge}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.availabilityText}>Online Now</Text>
          </View>
          <Text style={styles.responseTime}>Average response: 2 minutes</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    width: "100%",
  },
  floatingElementsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  mainGradient: {
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
  },
  headerContainer: {
    position: 'relative',
    marginBottom: moderateScale(16),
  },
  headerGlow: {
    position: 'absolute',
    top: -moderateScale(10),
    left: -moderateScale(10),
    right: -moderateScale(10),
    bottom: -moderateScale(10),
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: moderateScale(25),
    zIndex: -1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  mainTitle: {
    color: "#fff",
    fontSize: moderateScale(18),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  mainSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: moderateScale(12),
    marginTop: moderateScale(2),
  },
  expandButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "rgba(255,215,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeSeparator: {
    alignItems: 'center',
    marginVertical: moderateScale(12),
  },
  separatorLine: {
    height: 2,
    width: '60%',
    marginBottom: moderateScale(8),
  },
  separatorDots: {
    flexDirection: 'row',
    gap: moderateScale(4),
  },
  separatorDot: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#FFD700',
  },
  contactOptionsContainer: {
    gap: moderateScale(8),
  },
  extendedOptions: {
    gap: moderateScale(8),
    marginTop: moderateScale(8),
  },
  contactOptionWrapper: {
    // Wrapper for touch handling
  },
  contactOption: {
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  contactOptionGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    position: 'relative',
  },
  iconGlowContainer: {
    position: 'absolute',
    left: moderateScale(8),
    top: moderateScale(8),
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
  },
  iconGlow: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(14),
  },
  contactIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
    zIndex: 2,
  },
  contactTextArea: {
    flex: 1,
  },
  contactTitle: {
    color: "#fff",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  contactSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: moderateScale(11),
    marginTop: moderateScale(2),
  },
  arrowContainer: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: "center",
    alignItems: "center",
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(16),
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.2)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  onlineIndicator: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#4CAF50',
    marginRight: moderateScale(6),
  },
  availabilityText: {
    color: '#4CAF50',
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  responseTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: moderateScale(10),
  },
});

export default SupportContactCard;
