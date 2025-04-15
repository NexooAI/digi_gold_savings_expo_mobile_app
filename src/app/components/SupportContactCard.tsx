import { LinearGradient } from "expo-linear-gradient";
import {
  TouchableOpacity,
  Linking,
  Alert,
  Text,
  View,
  Platform,
} from "react-native";
import { ScaledSheet, moderateScale } from "react-native-size-matters";
import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { theme } from "@/constants/theme";

const SupportContactCard = () => {
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
    <View style={styles.cardWrapper}>
      {/* <TouchableOpacity activeOpacity={0.9} style={styles.cardContainer}> */}
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={
            theme.colors.support_container as [string, string, ...string[]]
          }
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <MaterialIcons name="headset-mic" size={22} color="#FFF" />
            <Text style={styles.title}>We're Here To Help</Text>
          </View>

          <View style={styles.dividerHorizontal} />

          <View style={styles.content}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <MaterialIcons name="call" size={18} color="#fff" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactValue}>+91 9061803999</Text>
                <Text style={styles.contactLabel}>24/7 Customer Support</Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>

            <View style={styles.dividerHorizontal} />

            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <MaterialIcons name="email" size={18} color="#fff" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactValue}>
                  dcjewellerstcr@gmail.com
                </Text>
                <Text style={styles.contactLabel}>Email Support Team</Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
      {/* </TouchableOpacity> */}
    </View>
  );
};

const styles = ScaledSheet.create({
  cardWrapper: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    width: "100%",
  },
  cardContainer: {
    borderRadius: moderateScale(16),
    elevation: 8,
    shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 8,
    // overflow: "hidden",
    width: "100%",
  },
  gradient: {
    padding: moderateScale(16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(5),
  },
  title: {
    color: "#fff",
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginLeft: moderateScale(12),
    letterSpacing: 0.5,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: moderateScale(6),
    width: "100%",
  },
  content: {
    width: "100%",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(2),
  },
  contactTextContainer: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  contactValue: {
    color: "#fff",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  contactLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: moderateScale(12),
  },
});

export default SupportContactCard;
