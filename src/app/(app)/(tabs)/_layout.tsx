import { Tabs } from "expo-router";
import CustomBottomBar from "@/common/components/navigation/CustomBottomBar";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

function MyTabBar(props: BottomTabBarProps) {
  return <CustomBottomBar {...props} />;
}

export default function TabsLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
          tabBar={MyTabBar}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="savings" />
          <Tabs.Screen name="gold_advance"/>
          <Tabs.Screen name="notifications" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

// You can add styles for the custom bar if needed
const styles = StyleSheet.create({});
