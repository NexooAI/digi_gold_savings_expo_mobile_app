import { Tabs } from "expo-router";
import { StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

export default function TabsLayout() {
  return (
    <AppLayoutWrapper
      showHeader={true}
      showBottomBar={true}
      headerProps={{
        showMenu: true,
        showLanguageSwitcher: true,
      }}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        enabled={Platform.OS === "ios"} // Only enable on iOS to prevent interference with bottom bar
      >
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Hide the default tab bar
            tabBarButton: () => null, // Disable tab bar buttons
          }}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="savings" />
          <Tabs.Screen name="gold_advance"/>
          <Tabs.Screen name="notifications" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </KeyboardAvoidingView>
    </AppLayoutWrapper>
  );
}

const styles = StyleSheet.create({});
