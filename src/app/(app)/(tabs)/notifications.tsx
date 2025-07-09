import React, { useState, useEffect } from "react";
import { View, Text, ImageBackground, TouchableOpacity, Pressable, Animated, StyleSheet, Modal } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "@/app/components/AppHeader";
import { theme } from "@/constants/theme";
import { LinearGradient } from 'expo-linear-gradient';

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
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const getCategoryColor = (category: Notification['category']) => {
    switch (category) {
      case 'offer': return '#FF7043';
      case 'transaction': return '#42A5F5';
      case 'reminder': return '#66BB6A';
      case 'alert': return '#FFCA28';
      default: return '#42A5F5';
    }
  };

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'offer': return 'gift';
      case 'transaction': return 'cash';
      case 'reminder': return 'time';
      case 'alert': return 'warning';
      default: return 'notifications';
    }
  };

  const getCategoryGradient = (category: Notification['category']) => {
    switch (category) {
      case 'offer': return ['#FF7043', '#FF8A65'] as const;
      case 'transaction': return ['#42A5F5', '#64B5F6'] as const;
      case 'reminder': return ['#66BB6A', '#81C784'] as const;
      case 'alert': return ['#FFCA28', '#FFD54F'] as const;
      default: return ['#42A5F5', '#64B5F6'] as const;
    }
  };

  return (
    <Animated.View style={{ 
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
      marginBottom: 12,
    }}>
      <Pressable
        onPress={() => onPress(item.id)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
          borderRadius: 16,
          backgroundColor: item.isRead ? '#FAFAFA' : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: item.isRead ? 0.05 : 0.1,
          shadowRadius: 6,
          elevation: item.isRead ? 1 : 2,
          borderLeftWidth: !item.isRead ? 4 : 0,
          borderLeftColor: !item.isRead ? getCategoryColor(item.category) : 'transparent',
        })}
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <LinearGradient
              colors={getCategoryGradient(item.category)}
              style={styles.notificationIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name={getCategoryIcon(item.category) as any}
                size={20}
                color="white"
              />
            </LinearGradient>
            
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.notificationTitle, { 
                  color: item.isRead ? '#616161' : '#212121',
                  fontWeight: item.isRead ? '500' : '600'
                }]}>
                  {item.title}
                </Text>
                <TouchableOpacity 
                  onPress={() => onDelete(item.id)}
                  style={{ padding: 4, margin: -4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color="#BDBDBD" />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.notificationMessage, {
                color: item.isRead ? '#757575' : '#424242'
              }]}>
                {item.message}
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginTop: 8
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={14} color="#9E9E9E" />
                  <Text style={styles.notificationTime}>{item.time}</Text>
                </View>
                
                {!item.isRead && (
                  <View style={[styles.unreadIndicator, {
                    backgroundColor: getCategoryColor(item.category)
                  }]} />
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
    <Text style={styles.sectionTitle}>{title}</Text>
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

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationPress = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      setSelectedNotification(notification);
      setModalVisible(true);
      markAsRead(id);
    }
  };

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
    <SafeAreaView style={styles.container}>
      {/* Modal for notification details */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#212121', textAlign: 'center' }}>
              {selectedNotification?.title}
            </Text>
            <Text style={{ fontSize: 16, color: '#424242', marginBottom: 24, textAlign: 'center' }}>
              {selectedNotification?.message}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ backgroundColor: '#1976D2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ImageBackground
        source={theme.image.menu_bg}
        resizeMode="repeat"
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        {/* Fixed Header */}
        <View style={styles.headerContainer}>
          <AppHeader showBackButton={false} backRoute="index" />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.mainHeader}>
            <View>
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtitle}>
                Stay updated with your activities
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={markAllAsRead}
              style={styles.markAllButton}
              disabled={unreadCount === 0}
            >
              <Text style={[
                styles.markAllButtonText,
                unreadCount === 0 && { color: '#BDBDBD' }
              ]}>
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
          
          {notifications.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={48} color="#E0E0E0" />
              <Text style={styles.emptyStateText}>No notifications yet</Text>
              <Text style={styles.emptyStateSubtext}>
                We'll notify you when something arrives
              </Text>
            </View>
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    width: "100%",
    height: "100%",
    resizeMode: "repeat",
    opacity: 0.03,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 100,
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  badge: {
    marginLeft: 12,
    backgroundColor: '#FF3D00',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  markAllButtonText: {
    color: '#1976D2',
    fontWeight: '500',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 16,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 4,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#757575',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 4,
  },
});