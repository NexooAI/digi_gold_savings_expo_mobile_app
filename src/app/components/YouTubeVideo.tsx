import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from "react-native-size-matters";

const YouTubeVideo: React.FC = () => {
  const screenWidth = Dimensions.get("window").width;
  const [playing, setPlaying] = useState(false);
  const [videoId, setVideoId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  // Function to extract video ID from various YouTube URL formats.
  const extractYouTubeVideoId = (url: string): string => {
    if (!url) return "";
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=))([^?&]+)/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  useEffect(() => {
    const fetchVideoUrl = async () => {
      const fallbackUrl = theme.youtubeUrl; // Fallback URL
      try {
        const response = await api.get("videos/active");
        let videoUrl = response.data.data[0].video_url;
        if (!videoUrl) {
          console.error(
            "API response does not contain a valid video URL:",
            response
          );
          videoUrl = fallbackUrl;
        }
        let id = extractYouTubeVideoId(videoUrl);
        if (!id) {
          console.error("Failed to extract video ID from the URL:", videoUrl);
          id = extractYouTubeVideoId(fallbackUrl);
        }
        setVideoId(id);
      } catch (error) {
        console.error("Error fetching video URL:", error);
        // Use fallback video ID when API call fails.
        setVideoId(extractYouTubeVideoId(fallbackUrl));
      } finally {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!videoId) {
    return <Text>Error loading video.</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Ionicons name="play-circle" size={24} color="#850111" />
          <Text style={styles.headerText}>Featured Video</Text>
        </View>
        <View style={styles.headerLine} />
      </View>
      
      <View style={styles.videoContainer}>
        <View style={styles.videoWrapper}>
          <YoutubePlayer
            height={220}
            width={screenWidth - 40}
            play={playing}
            videoId={videoId}
            onChangeState={onStateChange}
            initialPlayerParams={{
              controls: true,
              modestbranding: true,
              rel: 0,
            }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  headerContainer: {
    marginBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#850111',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerLine: {
    height: 2,
    backgroundColor: '#FFD700',
    width: '100%',
    borderRadius: 1,
  },
  videoContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  videoWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});

export default YouTubeVideo;
