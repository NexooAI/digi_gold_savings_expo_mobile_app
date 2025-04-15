import React from "react";
import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "@/app/components/AppHeader";
import { theme } from "@/constants/theme";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon?: string;
  date: string; // Used for grouping
}

export default function NotificationsScreen() {
  // Notifications relevant to the DigiGold mobile app
  const notifications: Notification[] = [
    {
      id: "1",
      title: "Monthly Savings Credited",
      message:
        "Your monthly savings of ₹1,000 for Gold Investment has been credited successfully.",
      time: "Today, 09:00 AM",
      icon: "wallet-outline",
      date: "Today",
    },
    {
      id: "2",
      title: "New Scheme Available",
      message:
        'A new gold savings scheme "Gold Boost" is now available. Check it out!',
      time: "Today, 11:30 AM",
      icon: "flash-outline",
      date: "Today",
    },
    {
      id: "3",
      title: "Maturity Reminder",
      message: "Your gold savings plan will mature in 5 days. Tap for details.",
      time: "Yesterday, 05:00 PM",
      icon: "calendar-outline",
      date: "Yesterday",
    },
    {
      id: "4",
      title: "Investment Pending",
      message:
        "Your last investment of ₹3,000 is pending verification. Please check your account.",
      time: "Nov 26, 2020, 08:30 AM",
      icon: "information-circle-outline",
      date: "Nov 26, 2020",
    },
    {
      id: "5",
      title: "Referral Reward Earned",
      message:
        "You earned a referral reward of ₹200 when a friend invested using your code.",
      time: "Nov 25, 2020, 07:45 PM",
      icon: "gift-outline",
      date: "Nov 25, 2020",
    },
    {
      id: "6",
      title: "Limited Time Offer",
      message:
        "Get an extra 1% return on your next gold savings deposit. Limited time offer!",
      time: "Nov 25, 2020, 06:00 PM",
      icon: "pricetag-outline",
      date: "Nov 25, 2020",
    },
  ];

  // Group notifications by date
  const groupedNotifications = notifications.reduce(
    (acc: { [key: string]: Notification[] }, notification) => {
      const date = notification.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(notification);
      return acc;
    },
    {}
  );

  const renderNotificationItem = (item: Notification) => (
    <View
      key={item.id}
      className="flex-row p-3 mb-2 bg-white rounded-md shadow-sm"
    >
      {item.icon && (
        <Ionicons
          name={item.icon as any}
          size={24}
          color={theme.colors.primary}
          className="mr-3"
        />
      )}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-800">
          {item.title}
        </Text>
        <Text className="text-xs text-gray-600">{item.message}</Text>
        <Text className="text-xxs text-gray-500 mt-1">📅 {item.time}</Text>
      </View>
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <Text className="text-base font-semibold mt-5 mb-2 px-4 text-gray-700">
      {title}
    </Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ImageBackground
        source={theme.image.menu_bg}
        resizeMode="repeat"
        className="flex-1"
        imageStyle={{
          width: "100%",
          height: "100%",
          resizeMode: "repeat",
          opacity: 0.1,
        }}
      >
        {/* Fixed Header */}
        <View className="absolute top-0 left-0 right-0 z-10 bg-transparent px-4">
          <AppHeader showBackButton={false} backRoute="index" />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 100,
            paddingBottom: 80,
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Notifications
            </Text>
            <TouchableOpacity>
              <Text className="text-blue-500">Mark All as Read</Text>
            </TouchableOpacity>
          </View>

          {/* Loop through grouped notifications */}
          {Object.entries(groupedNotifications).map(
            ([date, notificationsForDate]) => (
              <View key={date}>
                {renderSectionHeader(date)}
                {notificationsForDate.map(renderNotificationItem)}
              </View>
            )
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}
