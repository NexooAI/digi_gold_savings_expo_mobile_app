import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  Text,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Collection {
  id: number;
  name: string;
  status_images: string[];
}

interface StatusViewProps {
  collections: Collection[];
  isVisible: boolean;
  initialCollectionIndex: number;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');
const STATUS_DURATION = 5000; // 5 seconds per status

const StatusView: React.FC<StatusViewProps> = ({
  collections,
  isVisible,
  initialCollectionIndex,
  onClose,
}) => {
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(initialCollectionIndex);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentCollection = collections[currentCollectionIndex];
  const currentImages = currentCollection?.status_images || [];

  useEffect(() => {
    if (isVisible) {
      setCurrentImageIndex(0);
      startProgressAnimation();
    } else {
      stopProgressAnimation();
    }
    return () => stopProgressAnimation();
  }, [isVisible, currentCollectionIndex, currentImageIndex]);

  const startProgressAnimation = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STATUS_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });
  };

  const stopProgressAnimation = () => {
    progressAnim.stopAnimation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleNext = () => {
    if (currentImageIndex < currentImages.length - 1) {
      // Move to next image in current collection
      const nextImageIndex = currentImageIndex + 1;
      setCurrentImageIndex(nextImageIndex);
      flatListRef.current?.scrollToIndex({ index: nextImageIndex, animated: true });
    } else if (currentCollectionIndex < collections.length - 1) {
      // Move to next collection
      const nextCollectionIndex = currentCollectionIndex + 1;
      setCurrentCollectionIndex(nextCollectionIndex);
      setCurrentImageIndex(0);
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    } else {
      // If we're at the last image of the last collection, start over
      setCurrentCollectionIndex(0);
      setCurrentImageIndex(0);
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    }
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      // Move to previous image in current collection
      const prevImageIndex = currentImageIndex - 1;
      setCurrentImageIndex(prevImageIndex);
      flatListRef.current?.scrollToIndex({ index: prevImageIndex, animated: true });
    } else if (currentCollectionIndex > 0) {
      // Move to previous collection
      const prevCollectionIndex = currentCollectionIndex - 1;
      const prevCollection = collections[prevCollectionIndex];
      const prevCollectionLastImage = prevCollection.status_images.length - 1;
      setCurrentCollectionIndex(prevCollectionIndex);
      setCurrentImageIndex(prevCollectionLastImage);
      flatListRef.current?.scrollToIndex({ index: prevCollectionLastImage, animated: true });
    }
  };

  const renderProgressBars = () => {
    return (
      <View style={styles.progressContainer}>
        {currentImages.map((_, index) => (
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
    );
  };

  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderProgressBars()}

        {currentCollection?.name && (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{currentCollection.name}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.closeButton,
            currentCollection?.name && styles.closeButtonWithTitle
          ]} 
          onPress={onClose}
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={currentImages}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / width
            );
            setCurrentImageIndex(newIndex);
          }}
          initialScrollIndex={currentImageIndex}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentImageIndex === 0 && currentCollectionIndex === 0 && styles.disabledButton]}
            onPress={handlePrevious}
            disabled={currentImageIndex === 0 && currentCollectionIndex === 0}
          >
            <Ionicons name="chevron-back" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, currentImageIndex === currentImages.length - 1 && currentCollectionIndex === collections.length - 1 && styles.disabledButton]}
            onPress={handleNext}
            disabled={currentImageIndex === currentImages.length - 1 && currentCollectionIndex === collections.length - 1}
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  progressContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 3,
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
  imageContainer: {
    width,
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  closeButtonWithTitle: {
    top: 90,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default StatusView; 