import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale } from "react-native-size-matters";
import api, { news } from "@/services/api";

const { width: screenWidth } = Dimensions.get("window");

interface FlashNewsItem {
  id: number;
  title: string;
  content: string;
  image?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface FlashNewsProps {
  onNewsPress?: (newsItem: FlashNewsItem) => void;
}

const FlashNews: React.FC<FlashNewsProps> = ({ onNewsPress }) => {
  const [newsData, setNewsData] = useState<FlashNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchFlashNews();
  }, []);

  const fetchFlashNews = async () => {
    try {
      setLoading(true);

      // For testing - always show dummy data first
      //console.log('FlashNews: Setting dummy data for testing');
      setNewsData([
        {
          id: 1,
          title: "Gold Prices Surge to New Heights",
          content:
            "Gold prices have reached unprecedented levels this week, making it an excellent time to invest in our digital gold schemes.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        {
          id: 2,
          title: "New Investment Schemes Available",
          content:
            "We're excited to announce new flexible investment schemes with better returns and lower entry amounts.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        {
          id: 3,
          title: "Special Festive Offers",
          content:
            "Celebrate this festive season with our special gold investment offers. Limited time only!",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
      ]);

      // Comment out API call for now
      /*
      const response = await news.getActiveFlashNews();
      //console.log('Flash news response:', response.data);
      if (response.data && response.data.data) {
        setNewsData(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setNewsData(response.data);
      } else {
        // If no data from API, use dummy data for testing
        //console.log('No flash news data, using dummy data');
        setNewsData([
          {
            id: 1,
            title: "Gold Prices Surge to New Heights",
            content: "Gold prices have reached unprecedented levels this week, making it an excellent time to invest in our digital gold schemes.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: 2,
            title: "New Investment Schemes Available",
            content: "We're excited to announce new flexible investment schemes with better returns and lower entry amounts.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          }
        ]);
      }
      */
    } catch (error) {
      console.error("Error fetching flash news:", error);
      // Use dummy data as fallback
      //console.log('API error, using dummy data as fallback');
      setNewsData([
        {
          id: 1,
          title: "Welcome to DC Jewellers",
          content:
            "Discover our premium gold investment schemes and start your journey towards financial security.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderNewsItem = ({
    item,
    index,
  }: {
    item: FlashNewsItem;
    index: number;
  }) => (
    <TouchableOpacity
      style={styles.newsItem}
      onPress={() => onNewsPress?.(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={["#850111", "#5a000b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.newsGradient}
      >
        <View style={styles.newsHeader}>
          <View style={styles.newsIconContainer}>
            <Ionicons name="flash" size={20} color="#FFD700" />
          </View>
          <Text style={styles.newsDate}>{formatDate(item.created_at)}</Text>
        </View>

        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.newsContent} numberOfLines={3}>
          {item.content}
        </Text>

        <View style={styles.newsFooter}>
          <Text style={styles.readMoreText}>Read More</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFD700" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#850111" />
        <Text style={styles.loadingText}>Loading Flash News...</Text>
      </View>
    );
  }

  if (!newsData || newsData.length === 0) {
    return null; // Don't render anything if no news
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Ionicons name="flash" size={24} color="#850111" />
        <Text style={styles.sectionTitle}>Flash News</Text>
        <View style={styles.newsIndicator}>
          <Text style={styles.indicatorText}>
            {currentIndex + 1} / {newsData.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={newsData}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={screenWidth - 40}
        decelerationRate="fast"
        contentContainerStyle={styles.newsList}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / (screenWidth - 40)
          );
          setCurrentIndex(index);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: moderateScale(16),
    paddingHorizontal: moderateScale(16),
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
    paddingHorizontal: moderateScale(4),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "#850111",
    marginLeft: moderateScale(8),
    flex: 1,
  },
  newsIndicator: {
    backgroundColor: "rgba(133, 1, 17, 0.1)",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  indicatorText: {
    fontSize: moderateScale(12),
    color: "#850111",
    fontWeight: "600",
  },
  newsList: {
    paddingHorizontal: moderateScale(4),
  },
  newsItem: {
    width: screenWidth - 40,
    marginHorizontal: moderateScale(4),
    borderRadius: moderateScale(16),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  newsGradient: {
    padding: moderateScale(16),
    minHeight: moderateScale(140),
  },
  newsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  newsIconContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  newsDate: {
    fontSize: moderateScale(12),
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  newsTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: moderateScale(8),
    lineHeight: moderateScale(22),
  },
  newsContent: {
    fontSize: moderateScale(14),
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  newsFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  readMoreText: {
    fontSize: moderateScale(12),
    color: "#FFD700",
    fontWeight: "600",
    marginRight: moderateScale(4),
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(32),
  },
  loadingText: {
    marginTop: moderateScale(8),
    fontSize: moderateScale(14),
    color: "#850111",
    fontWeight: "500",
  },
});

export default FlashNews;
