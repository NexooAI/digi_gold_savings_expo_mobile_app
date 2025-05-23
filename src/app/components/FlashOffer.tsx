import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { news } from "@/app/services/api";

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
}

const FlashOffer: React.FC<FlashOfferProps> = ({
  fallbackMessages = ["🎉 Welcome to Digital Gold Savings!"],
  textColor = "#fff",
  duration = 10000,
}) => {
  const translateX = new Animated.Value(width);
  const spacing = 30; // Gap between messages
  const [activeNewsMessages, setActiveNewsMessages] = useState<string[]>(fallbackMessages);
  const [loading, setLoading] = useState(true);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  // Fetch flash news from API
  useEffect(() => {
    const fetchFlashNews = async () => {
      try {
        setLoading(true);
        const response = await news.getActiveFlashNews();
        const newsItems: FlashNews[] = response.data.data;
        
        // Filter news items by checking if current date is between start and end dates
        const now = new Date();
        const activeNews = newsItems.filter(item => {
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
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeNewsMessages]);

  // Animation for text scrolling
  useEffect(() => {
    if (loading || activeNewsMessages.length === 0) return;
    
    // Reset animation when news changes
    translateX.setValue(width);
    
    const currentMessage = activeNewsMessages[currentNewsIndex];
    const messageWidth = currentMessage.length * 5 + spacing;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -messageWidth,
          duration: duration * (messageWidth / width),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [currentNewsIndex, activeNewsMessages, loading]);

  // Don't show anything if there are no active news items
  if (!loading && activeNewsMessages.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#850111', '#2e0406']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[styles.textContainer, { transform: [{ translateX }] }]}
        >
          {activeNewsMessages.length > 0 && (
            <Text
              style={[styles.text, { color: textColor, marginRight: spacing }]}
            >
              {activeNewsMessages[currentNewsIndex]}
            </Text>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
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
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default FlashOffer;
