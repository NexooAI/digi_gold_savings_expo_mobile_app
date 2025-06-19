import CustomBottomBar from "@/common/components/navigation/CustomBottomBar";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Slot />
        <CustomBottomBar />
      </View>
    </SafeAreaProvider>
  );
}

// You can add styles for the custom bar if needed
const styles = StyleSheet.create({});
