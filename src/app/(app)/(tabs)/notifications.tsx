import React, { useState, useEffect } from "react";
import { View, Text, ImageBackground, TouchableOpacity, Pressable, Animated } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "@/app/components/AppHeader";
import { theme } from "@/constants/theme";

// Types
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon?: string;
  date: string;
  isRead: boolean;
  category: 'offer' | 'transaction' | 'reminder' | 'alert';
}

// Components
const NotificationItem = React.memo(({ 
  item, 
  onPress, 
  onDelete 
}: { 
  item: Notification; 
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const getCategoryColor = (category: Notification['category']) => {
    switch (category) {
      case 'offer': return '#FF5722';
      case 'transaction': return '#2196F3';
      case 'reminder': return '#4CAF50';
      case 'alert': return '#FFC107';
      default: return '#2196F3';
    }
  };

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'offer': return 'gift';
      case 'transaction': return 'wallet';
      case 'reminder': return 'calendar';
      case 'alert': return 'alert-circle';
      default: return 'notifications';
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable
        onPress={() => onPress(item.id)}
        className={`mb-3 bg-white rounded-lg ${!item.isRead ? 'border-l-4' : ''}`}
        style={{ 
          borderLeftColor: !item.isRead ? getCategoryColor(item.category) : 'transparent',
        }}
      >
        <View className="p-5">
          <View className="flex-row items-start">
            <View 
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: `${getCategoryColor(item.category)}10` }}
            >
              <Ionicons
                name={getCategoryIcon(item.category) as any}
                size={22}
                color={getCategoryColor(item.category)}
              />
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-semibold text-gray-800">
                  {item.title}
                </Text>
                <TouchableOpacity 
                  onPress={() => onDelete(item.id)}
                  className="p-2 -mr-2"
                >
                  <Ionicons name="close" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600 mt-2 leading-5">{item.message}</Text>
              <View className="flex-row items-center justify-between mt-3">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#9E9E9E" />
                  <Text className="text-xs text-gray-500 ml-1.5">{item.time}</Text>
                </View>
                {!item.isRead && (
                  <View 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getCategoryColor(item.category) }}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const NotificationSection = React.memo(({ 
  title, 
  notifications,
  onNotificationPress,
  onNotificationDelete
}: { 
  title: string;
  notifications: Notification[];
  onNotificationPress: (id: string) => void;
  onNotificationDelete: (id: string) => void;
}) => (
  <View className="mt-6">
    <Text className="text-base font-semibold text-gray-700 mb-3">{title}</Text>
    {notifications.map((notification) => (
      <NotificationItem
        key={notification.id}
        item={notification}
        onPress={onNotificationPress}
        onDelete={onNotificationDelete}
      />
    ))}
  </View>
));

// Main Component
export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Special Diwali Offer",
      message: "Invest ₹1000 today and get ₹50 cashback on your first gold purchase!",
      time: "Today, 09:00 AM",
      date: "Today",
      isRead: false,
      category: 'offer'
    },
    {
      id: "2",
      title: "SIP Transaction Successful",
      message: "Your monthly SIP of ₹5,000 has been processed successfully.",
      time: "Today, 11:30 AM",
      date: "Today",
      isRead: false,
      category: 'transaction'
    },
    {
      id: "3",
      title: "Scheme Maturity Reminder",
      message: "Your Gold Fortune scheme will mature in 5 days. Plan your next investment!",
      time: "Yesterday, 05:00 PM",
      date: "Yesterday",
      isRead: true,
      category: 'reminder'
    },
    {
      id: "4",
      title: "Gold Rate Alert",
      message: "Gold rates have increased by 2.5% today. Great time to check your portfolio!",
      time: "Nov 26, 2023, 08:30 AM",
      date: "Nov 26, 2023",
      isRead: true,
      category: 'alert'
    },
    {
      id: "5",
      title: "New Year Special Offer",
      message: "Get 1% extra gold on investments above ₹10,000. Limited time offer!",
      time: "Nov 25, 2023, 07:45 PM",
      date: "Nov 25, 2023",
      isRead: false,
      category: 'offer'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      isRead: true
    })));
  };

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
          opacity: 0.02,
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
            paddingHorizontal: 20,
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <View className="flex-row items-center">
                <Text className="text-2xl font-bold text-gray-800">
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View className="ml-3 bg-red-500 rounded-full px-2.5 py-1">
                    <Text className="text-white text-xs font-medium">
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-gray-500 mt-2">
                Stay updated with your Digi Gold activities
              </Text>
            </View>
            <TouchableOpacity 
              onPress={markAllAsRead}
              className="bg-gray-100 px-5 py-2.5 rounded-md"
            >
              <Text className="text-gray-700 font-medium">Mark All as Read</Text>
            </TouchableOpacity>
          </View>

          {/* Notification Sections */}
          {Object.entries(groupedNotifications).map(
            ([date, notificationsForDate]) => (
              <NotificationSection
                key={date}
                title={date}
                notifications={notificationsForDate}
                onNotificationPress={markAsRead}
                onNotificationDelete={deleteNotification}
              />
            )
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}
