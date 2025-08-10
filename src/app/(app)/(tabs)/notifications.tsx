import React, { useState, useEffect } from "react";
import { View, Text, ImageBackground, TouchableOpacity, Pressable, Animated, Modal } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
// AppHeader is now handled by the layout wrapper
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

  // Unique design: colored left bar, shadow, bold unread, background color change
  const isUnread = !item.isRead;
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable
        onPress={() => onPress(item.id)}
        style={{
          flexDirection: 'row',
          backgroundColor: isUnread ? '#FFF7F0' : '#F6F6F6',
          borderRadius: 12,
          marginBottom: 14,
          shadowColor: isUnread ? getCategoryColor(item.category) : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isUnread ? 0.18 : 0.08,
          shadowRadius: 6,
          elevation: isUnread ? 4 : 1,
        }}
      >
        {/* Colored left bar */}
        <View style={{
          width: 6,
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          backgroundColor: isUnread ? getCategoryColor(item.category) : 'transparent',
        }} />
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View 
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
                backgroundColor: `${getCategoryColor(item.category)}10`,
                flexShrink: 0,
              }}
            >
              <Ionicons
                name={getCategoryIcon(item.category) as any}
                size={22}
                color={getCategoryColor(item.category)}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 6,
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: isUnread ? 'bold' : '600', 
                  color: '#222',
                  flex: 1,
                  marginRight: 8,
                  flexWrap: 'wrap',
                }}>
                  {item.title}
                </Text>
                <TouchableOpacity 
                  onPress={() => onDelete(item.id)}
                  style={{ 
                    padding: 6, 
                    marginRight: -8, 
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Ionicons name="close" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              </View>
              <Text style={{ 
                fontSize: 14, 
                color: '#555', 
                lineHeight: 20,
                marginRight: 8,
                flexWrap: 'wrap',
              }}>
                {item.message}
              </Text>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginTop: 10,
                marginRight: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="time-outline" size={14} color="#9E9E9E" />
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#888', 
                    marginLeft: 6,
                    flexWrap: 'wrap',
                  }}>
                    {item.time}
                  </Text>
                </View>
                {isUnread && (
                  <View 
                    style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: getCategoryColor(item.category),
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
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
  <View style={{ marginTop: 24 }}>
    <Text style={{
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 16,
      paddingHorizontal: 4,
    }}>
      {title}
    </Text>
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

// Notification Modal Component
const NotificationModal = ({ 
  visible, 
  notification, 
  onClose 
}: { 
  visible: boolean; 
  notification: Notification | null; 
  onClose: () => void; 
}) => {
  if (!notification) return null;

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
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        }}>
          {/* Header with icon */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
          }}>
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${getCategoryColor(notification.category)}15`,
              marginRight: 16,
            }}>
              <Ionicons
                name={getCategoryIcon(notification.category) as any}
                size={24}
                color={getCategoryColor(notification.category)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#222',
                marginBottom: 4,
              }}>
                {notification.title}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#888',
              }}>
                {notification.time}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Message */}
          <Text style={{
            fontSize: 16,
            color: '#444',
            lineHeight: 24,
            marginBottom: 20,
          }}>
            {notification.message}
          </Text>

          {/* Footer */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
          }}>
            <Text style={{
              fontSize: 12,
              color: '#888',
            }}>
              {notification.date}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: getCategoryColor(notification.category),
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 14,
              }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main Component
export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Special Diwali Offer",
      message: "Invest ₹1000 today and get ₹50 cashback on your first gold purchase! Limited time offer valid until Diwali. Don't miss this amazing opportunity to start your gold investment journey with extra benefits.",
      time: "Today, 09:00 AM",
      date: "Today",
      isRead: false,
      category: 'offer'
    },
    {
      id: "2",
      title: "SIP Transaction Successful",
      message: "Your monthly SIP of ₹5,000 has been processed successfully. The amount has been deducted from your registered bank account and gold units have been allocated to your portfolio. You can view the transaction details in your account.",
      time: "Today, 11:30 AM",
      date: "Today",
      isRead: false,
      category: 'transaction'
    },
    {
      id: "3",
      title: "Scheme Maturity Reminder",
      message: "Your Gold Fortune scheme will mature in 5 days. Plan your next investment! You can either withdraw the amount or reinvest it in another scheme. Contact our support team for assistance.",
      time: "Yesterday, 05:00 PM",
      date: "Yesterday",
      isRead: true,
      category: 'reminder'
    },
    {
      id: "4",
      title: "Gold Rate Alert",
      message: "Gold rates have increased by 2.5% today. Great time to check your portfolio! The current market conditions are favorable for gold investments. Consider reviewing your investment strategy.",
      time: "Nov 26, 2023, 08:30 AM",
      date: "Nov 26, 2023",
      isRead: true,
      category: 'alert'
    },
    {
      id: "5",
      title: "New Year Special Offer",
      message: "Get 1% extra gold on investments above ₹10,000. Limited time offer! This exclusive offer is available only for our premium customers. Hurry up and make the most of this opportunity.",
      time: "Nov 25, 2023, 07:45 PM",
      date: "Nov 25, 2023",
      isRead: false,
      category: 'offer'
    }
  ]);

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleNotificationPress = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      setSelectedNotification(notification);
      setModalVisible(true);
      markAsRead(id);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ImageBackground
        source={theme.image.menu_bg}
        resizeMode="repeat"
        style={{ flex: 1 }}
        imageStyle={{
          width: "100%",
          height: "100%",
          resizeMode: "repeat",
          opacity: 0.02,
        }}
      >
        {/* Fixed Header */}
        {/* Header is now handled by the layout wrapper */}

        {/* Scrollable Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 80,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 32,
          }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#1f2937',
                }}>
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View style={{
                    marginLeft: 12,
                    backgroundColor: '#ef4444',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    minWidth: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: '500',
                    }}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{
                fontSize: 14,
                color: '#6b7280',
              }}>
                Stay updated with your Digi Gold activities
              </Text>
            </View>
            <TouchableOpacity 
              onPress={markAllAsRead}
              style={{
                backgroundColor: '#f3f4f6',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              <Text style={{
                color: '#374151',
                fontWeight: '500',
                fontSize: 14,
              }}>
                Mark All as Read
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notification Sections */}
          {Object.entries(groupedNotifications).map(
            ([date, notificationsForDate]) => (
              <NotificationSection
                key={date}
                title={date}
                notifications={notificationsForDate}
                onNotificationPress={handleNotificationPress}
                onNotificationDelete={deleteNotification}
              />
            )
          )}
        </ScrollView>

        {/* Notification Modal */}
        <NotificationModal
          visible={modalVisible}
          notification={selectedNotification}
          onClose={closeModal}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}
