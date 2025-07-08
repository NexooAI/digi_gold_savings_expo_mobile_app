import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { theme } from "@/constants/theme";
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from "react-native-size-matters";
import { t } from "@/i18n";
import { LinearGradient } from "expo-linear-gradient";

interface Video {
  id: number;
  title: string;
  video_url?: string;
  url?: string | null;
  created_at: string;
}

interface YouTubeVideoProps {
  videos?: Video[];
}

const YouTubeVideo: React.FC<YouTubeVideoProps> = ({ videos }) => {
  const screenWidth = Dimensions.get("window").width;
  const [playing, setPlaying] = useState(false);
  const [videoId, setVideoId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
      // Auto-play next video if available
      if (videoList.length > 1) {
        const nextIndex = (currentIndex + 1) % videoList.length;
        setCurrentIndex(nextIndex);
        const nextVideo = videoList[nextIndex];
        const nextVideoUrl = nextVideo.video_url || nextVideo.url || "";
        const nextVideoId = extractYouTubeVideoId(nextVideoUrl);
        setVideoId(nextVideoId);
        setCurrentVideo(nextVideo);
        setPlaying(true);
      }
    }
  }, [videoList, currentIndex]);

  // Function to extract video ID from various YouTube URL formats.
  const extractYouTubeVideoId = (url: string): string => {
    if (!url) return "";
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=))([^?&]+)/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  const initializeVideo = () => {
    try {
      setLoading(true);
      setError("");
      
      let videoData: Video[] = [];
      
      // Use provided videos if available and not empty
      if (videos && videos.length > 0) {
        videoData = videos;
        console.log('Using provided videos:', videoData);
      } else {
        // Use the local YouTube URL from theme as fallback
        const localVideoUrl = theme.youtubeUrl;
        const localVideoId = extractYouTubeVideoId(localVideoUrl);
        
        if (!localVideoId) {
          setError("videoLoadingError");
          return;
        }

        // Create a local video object
        const localVideo: Video = {
          id: 1,
          title: "DC Jewellers - Featured Video",
          video_url: localVideoUrl,
          created_at: new Date().toISOString(),
        };

        videoData = [localVideo];
        console.log('Using fallback video from theme:', localVideo);
      }

      // Find the first valid video
      const firstVideo = videoData[0];
      const videoUrl = firstVideo.video_url || firstVideo.url;
      const extractedVideoId = extractYouTubeVideoId(videoUrl || "");
      
      if (!extractedVideoId) {
        setError("videoLoadingError");
        return;
      }

      setVideoList(videoData);
      setVideoId(extractedVideoId);
      setCurrentVideo(firstVideo);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error initializing video:", error);
      setError("videoLoadingError");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeVideo();
  }, [videos]);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleNextVideo = () => {
    if (videoList.length > 1) {
      const nextIndex = (currentIndex + 1) % videoList.length;
      setCurrentIndex(nextIndex);
      const nextVideo = videoList[nextIndex];
      const nextVideoUrl = nextVideo.video_url || nextVideo.url || "";
      const nextVideoId = extractYouTubeVideoId(nextVideoUrl);
      setVideoId(nextVideoId);
      setCurrentVideo(nextVideo);
      setPlaying(true);
    }
  };

  const handlePreviousVideo = () => {
    if (videoList.length > 1) {
      const prevIndex = currentIndex === 0 ? videoList.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      const prevVideo = videoList[prevIndex];
      const prevVideoUrl = prevVideo.video_url || prevVideo.url || "";
      const prevVideoId = extractYouTubeVideoId(prevVideoUrl);
      setVideoId(prevVideoId);
      setCurrentVideo(prevVideo);
      setPlaying(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Ionicons name="play-circle" size={24} color="#850111" />
            <Text style={styles.headerText}>{t("featuredVideo")}</Text>
          </View>
          <View style={styles.headerLine} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#850111" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </View>
    );
  }

  if (error || !videoId) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Ionicons name="play-circle" size={24} color="#850111" />
            <Text style={styles.headerText}>{t("featuredVideo")}</Text>
          </View>
          <View style={styles.headerLine} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#850111" />
          <Text style={styles.errorText}>{t(error || "videoLoadingError")}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeVideo}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Ionicons name="play-circle" size={24} color="#850111" />
          <Text style={styles.headerText}>{t("featuredVideo")}</Text>
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
              showinfo: 0,
            }}
          />
        </View>
        
        {/* Video Controls */}
        {videoList.length > 1 && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={handlePreviousVideo}
            >
              <Ionicons name="play-skip-back" size={20} color="#850111" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={handlePlayPause}
            >
              <Ionicons 
                name={playing ? "pause" : "play"} 
                size={24} 
                color="#850111" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={handleNextVideo}
            >
              <Ionicons name="play-skip-forward" size={20} color="#850111" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Video Info */}
        {currentVideo && (
          <View style={styles.videoInfoContainer}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {currentVideo.title}
            </Text>
            <Text style={styles.videoDate}>
              {new Date(currentVideo.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#850111',
    marginLeft: 10,
  },
  errorContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#850111',
    marginBottom: 20,
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#850111',
    borderRadius: 5,
  },
  retryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#fff',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  controlButton: {
    padding: 10,
  },
  videoInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  videoTitle: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#850111',
    marginRight: 8,
  },
  videoDate: {
    fontSize: moderateScale(14),
    color: '#850111',
  },
});

export default YouTubeVideo;
