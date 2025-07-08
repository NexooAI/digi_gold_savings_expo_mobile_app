import { Tabs } from "expo-router";
import CustomBottomBar from "@/common/components/navigation/CustomBottomBar";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

function MyTabBar(props: BottomTabBarProps) {
  return <CustomBottomBar {...props} />;
}

export default function TabsLayout() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
          tabBar={(props) => <CustomBottomBar {...props} />}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="savings" />
          <Tabs.Screen name="notifications" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </View>
    </SafeAreaProvider>
  );
}

// You can add styles for the custom bar if needed
const styles = StyleSheet.create({});
