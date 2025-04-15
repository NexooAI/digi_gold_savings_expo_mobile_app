import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import theme from "src/constants/theme";

const { width } = Dimensions.get("window");

const AppHeader = ({ showBackButton = false, backRoute }) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (backRoute) {
      // Navigate to the specified back route
      navigation.navigate(backRoute);
    } else {
      // Default behavior: go back to the previous screen
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons
              name="arrow-back-outline"
              size={20}
              color={theme.theme.colors.white}
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.logoContainer}>
          <Image
            source={theme.theme.image.transparentLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity
          onPress={() => (navigation as any).openDrawer()}
          style={styles.drawerToggle}
        >
          <Ionicons name="reorder-three-outline" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.theme.colors.primary,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  logoContainer: {
    width: width * 0.3,
    height: 50,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  drawerToggle: {
    padding: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  backButtonText: {
    fontSize: 14, // Smaller text for better UX
    color: theme.theme.colors.white,
    marginLeft: 5,
  },
});

export default AppHeader;
