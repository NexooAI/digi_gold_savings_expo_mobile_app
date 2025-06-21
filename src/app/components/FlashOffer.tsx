import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, Easing } from "react-native";
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
  duration = 8000,
  onPress,
}) => {
  const translateX = useRef(new Animated.Value(width)).current;
  const [activeNewsMessages, setActiveNewsMessages] = useState<string[]>(fallbackMessages);
  const [loading, setLoading] = useState(true);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [hasFetched, setHasFetched] = useState(false); // Flag to prevent multiple API calls

  // Fetch flash news from API - only once when component mounts
  useEffect(() => {
    const fetchFlashNews = async () => {
      // Prevent multiple API calls
      if (hasFetched) return;
      
      // TEMPORARILY DISABLED: Flash news API call to prevent continuous triggering
      console.log('🚫 Flash news API call temporarily disabled to prevent continuous triggering');
      setActiveNewsMessages(fallbackMessages);
      setHasFetched(true);
      setLoading(false);
      return;
      
      /*
      try {
        setLoading(true);
        console.log('🔍 Fetching flash news from API...');
        const response = await news.getActiveFlashNews();
        const fetchedNewsItems: FlashNews[] = response.data.data;
        
        const now = new Date();
        const activeNews = fetchedNewsItems.filter(item => {
          const startDate = new Date(item.start_date);
          const endDate = new Date(item.end_date);
          return item.status === 'active' && now >= startDate && now <= endDate;
        });
        
        if (activeNews.length > 0) {
          const messages = activeNews.map(item => item.f_news);
          setActiveNewsMessages(messages);
          console.log('✅ Flash news loaded from API:', messages.length, 'items');
        } else {
          setActiveNewsMessages(fallbackMessages);
          console.log('ℹ️ No active flash news, using fallback messages');
        }
        setHasFetched(true); // Mark as fetched
      } catch (error) {
        console.error('❌ Error fetching flash news:', error);
        setActiveNewsMessages(fallbackMessages);
        setHasFetched(true); // Mark as fetched even on error
      } finally {
        setLoading(false);
      }
      */
    };

    fetchFlashNews();
  }, []); // Remove fallbackMessages dependency to prevent continuous calls

  // Rotate through news items
  useEffect(() => {
    if (activeNewsMessages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentNewsIndex(prevIndex => (prevIndex + 1) % activeNewsMessages.length);
    }, duration);
    
    return () => clearInterval(interval);
  }, [activeNewsMessages, duration]);

  // Text scrolling animation
  useEffect(() => {
    if (loading || activeNewsMessages.length === 0) return;

    const currentMessage = activeNewsMessages[currentNewsIndex];
    const messageWidth = currentMessage.length * 8; // Approximate width of text
    
    // Reset position to start from right
    translateX.setValue(width);

    // Create the scrolling animation
    const animation = Animated.loop(
      Animated.sequence([
        // Initial pause
        Animated.delay(500),
        // Scroll from right to left
        Animated.timing(translateX, {
          toValue: -messageWidth,
          duration: messageWidth * 10, // Faster animation
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        // Reset position
        Animated.timing(translateX, {
          toValue: width,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [currentNewsIndex, activeNewsMessages, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#850111', '#2e0406']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.contentContainer}>
            <Text style={[styles.text, { color: textColor }]}>Loading...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (activeNewsMessages.length === 0) {
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
              style={[
                styles.textContainer,
                {
                  transform: [{ translateX }],
                },
              ]}
            >
              <Text
                style={[styles.text, { color: textColor }]}
                numberOfLines={1}
              >
                {activeNewsMessages[currentNewsIndex]}
              </Text>
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
