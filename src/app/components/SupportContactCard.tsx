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
} from "react-native";
import { ScaledSheet, moderateScale } from "react-native-size-matters";
import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { theme } from "@/constants/theme";
import { useEffect, useRef } from "react";

const { width } = Dimensions.get("window");

const SupportContactCard = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleCall = () => {
    Linking.openURL(`tel:${+919061803999}`).catch((err) =>
      Alert.alert("Error", "Could not open dialer")
    );
  };

  const handleEmail = () => {
    Linking.openURL("mailto:dcjewellerstcr@gmail.com").catch((err) =>
      Alert.alert("Error", "Could not open email client")
    );
  };

  return (
    <Animated.View 
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={['#850111', '#2e0406']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <MaterialIcons name="headset-mic" size={24} color="#FFF" />
          </Animated.View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>We're Here To Help</Text>
            <Text style={styles.subtitle}>24/7 Customer Support</Text>
          </View>
        </View>

        <View style={styles.dividerHorizontal} />

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleCall}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <MaterialIcons name="call" size={20} color="#fff" />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactValue}>+91 9061803999</Text>
              <Text style={styles.contactLabel}>Call Us Now</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color="rgba(255,255,255,0.7)"
            />
          </TouchableOpacity>

          <View style={styles.dividerHorizontal} />

          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleEmail}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <MaterialIcons name="email" size={20} color="#fff" />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactValue}>dcjewellerstcr@gmail.com</Text>
              <Text style={styles.contactLabel}>Email Support</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color="rgba(255,255,255,0.7)"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = ScaledSheet.create({
  cardWrapper: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    width: "100%",
  },
  gradient: {
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(6),
  },
  iconContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(8),
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: moderateScale(14),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: moderateScale(10),
    marginTop: moderateScale(1),
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: moderateScale(8),
    width: "100%",
  },
  content: {
    width: "100%",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(4),
    borderRadius: moderateScale(10),
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: moderateScale(2),
  },
  iconWrapper: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(8),
  },
  contactTextContainer: {
    flex: 1,
  },
  contactValue: {
    color: "#fff",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  contactLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: moderateScale(10),
    marginTop: moderateScale(1),
  },
});

export default SupportContactCard;
