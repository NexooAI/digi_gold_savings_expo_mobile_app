import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Text,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";

interface StatusViewProps {
  collections: any[];
  isVisible: boolean;
  initialCollectionIndex: number;
  onClose: () => void;
}

const { width, height } = Dimensions.get("window");
const STATUS_DURATION = 10000; // 10 seconds per status

const StatusView: React.FC<StatusViewProps> = ({
  collections,
  isVisible,
  initialCollectionIndex,
  onClose,
}) => {
  const [currentCollection, setCurrentCollection] = useState(
    collections[initialCollectionIndex]
  );
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(
    initialCollectionIndex
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);
  const [viewedStatus, setViewedStatus] = useState<boolean[]>([]);

  // Reset and start animation when visibility, collections, or index changes
  useEffect(() => {
    if (
      isVisible &&
      collections.length > 0 &&
      initialCollectionIndex >= 0 &&
      initialCollectionIndex < collections.length
    ) {
      setCurrentCollection(collections[initialCollectionIndex]);
      setCurrentCollectionIndex(initialCollectionIndex);
      setCurrentImageIndex(0);
      setIsPaused(false);
      setImageLoading(true);
      // Initialize viewedStatus: first image is true, rest are false
      const images = collections[initialCollectionIndex]?.status_images || [];
      setViewedStatus(images.map((_: any, idx: number) => idx === 0));
      startProgressAnimation();
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isVisible, collections, initialCollectionIndex]);

  // Mark status as viewed when currentImageIndex changes
  useEffect(() => {
    if (isVisible && currentCollection?.status_images) {
      setViewedStatus((prev) => {
        if (!prev.length) return [];
        if (prev[currentImageIndex]) return prev; // already viewed
        const updated = [...prev];
        updated[currentImageIndex] = true;
        return updated;
      });
    }
  }, [currentImageIndex, isVisible, currentCollection]);

  // Handle image progression
  useEffect(() => {
    if (isVisible && !isPaused) {
      setImageLoading(true);
      startProgressAnimation();
    }
  }, [currentImageIndex, currentCollectionIndex, isPaused]);

  const startProgressAnimation = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Reset progress animation
    progressAnim.setValue(0);

    if (!isPaused) {
      // Start progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: STATUS_DURATION,
        useNativeDriver: false,
      }).start();

      // Set timer to move to next image/collection
      timerRef.current = setTimeout(() => {
        handleNext();
      }, STATUS_DURATION);
    }
  };

  const handleNext = () => {
    const currentImages = currentCollection?.status_images || [];

    if (currentImageIndex < currentImages.length - 1) {
      // Move to next image in current collection
      setCurrentImageIndex((prev) => prev + 1);
    } else if (currentCollectionIndex < collections.length - 1) {
      // Move to next collection
      const nextCollectionIndex = currentCollectionIndex + 1;
      setCurrentCollectionIndex(nextCollectionIndex);
      setCurrentCollection(collections[nextCollectionIndex]);
      setCurrentImageIndex(0);
    } else {
      // If we're at the last image of the last collection, close the view
      onClose();
    }
  };

  const handlePrev = () => {
    const currentImages = currentCollection?.status_images || [];

    if (currentImageIndex > 0) {
      // Move to previous image in current collection
      setCurrentImageIndex((prev) => prev - 1);
    } else if (currentCollectionIndex > 0) {
      // Move to previous collection
      const prevCollectionIndex = currentCollectionIndex - 1;
      setCurrentCollectionIndex(prevCollectionIndex);
      setCurrentCollection(collections[prevCollectionIndex]);
      setCurrentImageIndex(
        collections[prevCollectionIndex].status_images.length - 1
      );
    }
  };

  const handleTouchStart = (event: any) => {
    touchStartX.current = event.nativeEvent.locationX;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (event: any) => {
    const touchEndX = event.nativeEvent.locationX;
    const touchEndTime = Date.now();
    const swipeDistance = touchEndX - touchStartX.current;
    const touchDuration = touchEndTime - touchStartTime.current;

    // If touch duration is less than 200ms, it's a tap
    if (touchDuration < 200) {
      if (swipeDistance > 50) {
        // Swipe right - go to previous
        handlePrev();
      } else if (swipeDistance < -50) {
        // Swipe left - go to next
        handleNext();
      } else {
        // Tap - toggle pause
        setIsPaused(!isPaused);
        if (!isPaused) {
          progressAnim.stopAnimation();
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
        } else {
          startProgressAnimation();
        }
      }
    }
  };

  // Utility to get image source for local/remote/relative
  const getImageSource = (
    path: string | number | undefined | null
  ): import("react-native").ImageSourcePropType | undefined => {
    if (!path) return undefined;
    if (typeof path === "number") return path; // local require
    if (typeof path === "string") {
      if (path.startsWith("http")) return { uri: path };
      // Prepend base URL for relative paths (avoid double slashes)
      return {
        uri: `${theme.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
      };
    }
    return undefined;
  };

  // --- Add this useEffect to handle invalid collections/index ---
  React.useEffect(() => {
    if (
      isVisible &&
      (!collections ||
        collections.length === 0 ||
        initialCollectionIndex < 0 ||
        initialCollectionIndex >= collections.length)
    ) {
      console.error(
        "🔍 StatusView: Invalid collections data or index, closing modal",
        collections,
        initialCollectionIndex
      );
      onClose();
    }
  }, [isVisible, collections, initialCollectionIndex, onClose]);

  // --- Add this useEffect to handle missing status_images ---
  React.useEffect(() => {
    if (
      isVisible &&
      currentCollection &&
      (!currentCollection.status_images ||
        currentCollection.status_images.length === 0)
    ) {
      console.error(
        "🔍 StatusView: No status_images in currentCollection:",
        currentCollection
      );
      onClose();
    }
  }, [isVisible, currentCollection, onClose]);

  // Don't render if no collections or invalid index
  if (
    !collections ||
    collections.length === 0 ||
    initialCollectionIndex < 0 ||
    initialCollectionIndex >= collections.length
  ) {
    // onClose() removed from here
    return null;
  }

  // Use stateful currentCollection
  if (!currentCollection) {
    // Show a loading spinner while currentCollection is being set
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000000AA",
        }}
      >
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }
  if (
    !currentCollection.status_images ||
    currentCollection.status_images.length === 0
  ) {
    // onClose() removed from here
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            {currentCollection?.status_images?.map(
              (_: unknown, index: number) => (
                <View key={index} style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width:
                          index === currentImageIndex
                            ? progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0%", "100%"],
                              })
                            : index < currentImageIndex
                            ? "100%"
                            : "0%",
                        borderColor: !viewedStatus[index]
                          ? "#00FF00"
                          : "rgba(255,255,255,0.3)", // green if not viewed
                        borderWidth: 2,
                      },
                    ]}
                  />
                </View>
              )
            )}
          </View>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              {currentCollection?.thumbnail ? (
                <Image
                  source={
                    getImageSource(currentCollection?.thumbnail) ?? undefined
                  }
                  style={styles.avatar}
                  onError={(e) => {
                    console.error(
                      "Avatar image failed to load:",
                      getImageSource(currentCollection?.thumbnail),
                      e.nativeEvent
                    );
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: "#666",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Ionicons name="image" size={20} color="#fff" />
                </View>
              )}
              <Text style={styles.username}>
                {currentCollection?.name || "Unknown Collection"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableWithoutFeedback
          onPressIn={handleTouchStart}
          onPressOut={handleTouchEnd}
        >
          <View style={styles.imageContainer}>
            {currentCollection?.status_images?.[currentImageIndex] ? (
              <Image
                source={
                  getImageSource(
                    currentCollection?.status_images?.[currentImageIndex]
                  ) ?? undefined
                }
                style={styles.statusImage}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={(e) => {
                  console.error(
                    "Status image failed to load:",
                    getImageSource(
                      currentCollection?.status_images?.[currentImageIndex]
                    ),
                    e.nativeEvent
                  );
                  setImageLoading(false);
                }}
              />
            ) : (
              <View
                style={[
                  styles.statusImage,
                  {
                    backgroundColor: "#333",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  No image available
                </Text>
              </View>
            )}
            {imageLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator
                  size="large"
                  color="#FFD700"
                  accessibilityLabel="Loading image"
                />
              </View>
            )}
            {isPaused && (
              <View style={styles.pauseOverlay}>
                <Ionicons name="pause" size={40} color="#fff" />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, styles.leftButton]}
            onPress={handlePrev}
          >
            <Ionicons name="chevron-back" size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.rightButton]}
            onPress={handleNext}
          >
            <Ionicons name="chevron-forward" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50, // Add top spacing
    paddingBottom: 50, // Add bottom spacing
  },
  header: {
    position: "absolute",
    top: 50, // Adjust top position to account for container padding
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 10,
  },
  progressContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 2,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: 5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60, // Add top margin to account for header
    marginBottom: 60, // Add bottom margin for navigation
  },
  statusImage: {
    width: width,
    height: height,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 2,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  navigationContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 50, // Add bottom padding to navigation container
  },
  navButton: {
    width: width * 0.2,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  leftButton: {
    left: 0,
  },
  rightButton: {
    right: 0,
  },
});

export default StatusView;
