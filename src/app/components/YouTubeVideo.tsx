import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Text,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import api from "../services/api";
import { theme } from "@/constants/theme";

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
        const response = await api.get("video/1");
        let videoUrl = response.data.data?.video_url;
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
    <SafeAreaView
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <YoutubePlayer
        height={260}
        width={screenWidth}
        play={playing}
        videoId={videoId}
        onChangeState={onStateChange}
      />
    </SafeAreaView>
  );
};

export default YouTubeVideo;
