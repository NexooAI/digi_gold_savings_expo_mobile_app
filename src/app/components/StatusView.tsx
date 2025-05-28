import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface StatusViewProps {
  collections: any[];
  isVisible: boolean;
  initialCollectionIndex: number;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');
const STATUS_DURATION = 10000; // 10 seconds per status

const StatusView: React.FC<StatusViewProps> = ({
  collections,
  isVisible,
  initialCollectionIndex,
  onClose,
}) => {
  const [currentCollection, setCurrentCollection] = useState(collections[initialCollectionIndex]);
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(initialCollectionIndex);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);

  // Reset and start animation when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentCollection(collections[initialCollectionIndex]);
      setCurrentCollectionIndex(initialCollectionIndex);
      setCurrentImageIndex(0);
      setIsPaused(false);
      startProgressAnimation();
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isVisible]);

  // Handle image progression
  useEffect(() => {
    if (isVisible && !isPaused) {
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
      setCurrentImageIndex(prev => prev + 1);
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
      setCurrentImageIndex(prev => prev - 1);
    } else if (currentCollectionIndex > 0) {
      // Move to previous collection
      const prevCollectionIndex = currentCollectionIndex - 1;
      setCurrentCollectionIndex(prevCollectionIndex);
      setCurrentCollection(collections[prevCollectionIndex]);
      setCurrentImageIndex(collections[prevCollectionIndex].status_images.length - 1);
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

  const getFullImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${theme.baseUrl}/${path}`;
  };

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
            {currentCollection?.status_images?.map((_, index) => (
              <View key={index} style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: index === currentImageIndex
                        ? progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : index < currentImageIndex
                        ? '100%'
                        : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: getFullImageUrl(currentCollection?.thumbnail) }}
                style={styles.avatar}
              />
              <Text style={styles.username}>{currentCollection?.name}</Text>
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
            <Image
              source={{ uri: getFullImageUrl(currentCollection?.status_images?.[currentImageIndex]) }}
              style={styles.statusImage}
              resizeMode="contain"
            />
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
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusImage: {
    width: width,
    height: height,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  navigationContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: width * 0.2,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    left: 0,
  },
  rightButton: {
    right: 0,
  },
});

export default StatusView; 