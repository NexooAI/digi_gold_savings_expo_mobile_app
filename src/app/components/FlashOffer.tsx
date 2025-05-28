import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { news } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface FlashNews {
  id: number;
  f_news: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FlashOfferProps {
  fallbackMessages?: string[];
  textColor?: string;
  duration?: number;
  onPress?: () => void;
}

const FlashOffer: React.FC<FlashOfferProps> = ({
  fallbackMessages = ["🎉 Welcome to Digital Gold Savings!"],
  textColor = "#fff",
  duration = 10000,
  onPress,
}) => {
  const translateX = useRef(new Animated.Value(width)).current;
  const spacing = 30; // Gap between messages
  const [activeNewsMessages, setActiveNewsMessages] = useState<string[]>(fallbackMessages);
  const [loading, setLoading] = useState(true);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [newsItems, setNewsItems] = useState<FlashNews[]>([]);

  // Fetch flash news from API
  useEffect(() => {
    const fetchFlashNews = async () => {
      try {
        setLoading(true);
        const response = await news.getActiveFlashNews();
        const fetchedNewsItems: FlashNews[] = response.data.data;
        setNewsItems(fetchedNewsItems);
        
        // Filter news items by checking if current date is between start and end dates
        const now = new Date();
        const activeNews = fetchedNewsItems.filter(item => {
          const startDate = new Date(item.start_date);
          const endDate = new Date(item.end_date);
          return item.status === 'active' && now >= startDate && now <= endDate;
        });
        
        if (activeNews.length > 0) {
          // Extract news messages
          const messages = activeNews.map(item => item.f_news);
          setActiveNewsMessages(messages);
        }
      } catch (error) {
        console.error('Error fetching flash news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashNews();
  }, []);

  // Rotate through news items every 10 seconds if there are multiple items
  useEffect(() => {
    if (activeNewsMessages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentNewsIndex(prevIndex => (prevIndex + 1) % activeNewsMessages.length);
    }, duration);
    
    return () => clearInterval(interval);
  }, [activeNewsMessages, duration]);

  // Animation for text scrolling
  useEffect(() => {
    if (loading || activeNewsMessages.length === 0) return;
    
    // Reset animation when news changes
    translateX.setValue(width);
    
    const currentMessage = activeNewsMessages[currentNewsIndex];
    const messageWidth = currentMessage.length * 8; // Adjusted for better spacing

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -messageWidth,
          duration: duration * (messageWidth / width) * 5, // Doubled the duration for slower animation
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [currentNewsIndex, activeNewsMessages, loading, duration]);

  // Don't show anything if there are no active news items
  if (!loading && activeNewsMessages.length === 0) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#850111', '#2e0406']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={16} color="#fff" />
          </View>
          
          <View style={styles.textWrapper}>
            <Animated.View
              style={[styles.textContainer, { transform: [{ translateX }] }]}
            >
              {activeNewsMessages.length > 0 && (
                <Text
                  style={[styles.text, { color: textColor }]}
                  numberOfLines={1}
                >
                  {activeNewsMessages[currentNewsIndex]}
                </Text>
              )}
            </Animated.View>
          </View>

          {activeNewsMessages.length > 1 && (
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {currentNewsIndex + 1}/{activeNewsMessages.length}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    overflow: "hidden",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
    paddingRight: 30,
  },
  counterContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FlashOffer;
