import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = 200;

const ImageSlider = ({ images = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const timerRef = useRef(null);
  const currentIndexRef = useRef(0); // Track current index with a ref

  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(timerRef.current);
  }, [images]); // Restart autoplay when images change

  const startAutoPlay = () => {
    clearInterval(timerRef.current); // Clear existing interval
    if (images.length <= 1) return; // No autoplay if 0 or 1 image

    timerRef.current = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % images.length;
      currentIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 5000);
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.itemContainer, { transform: [{ scale }] }]}>
        <Image 
          source={typeof item === 'string' ? { uri: item } : item} 
          style={styles.image} 
        />
      </Animated.View>
    );
  };

  const handlePrev = () => {
    if (images.length === 0) return;
    const newIndex = (currentIndexRef.current - 1 + images.length) % images.length;
    currentIndexRef.current = newIndex;
    setActiveIndex(newIndex);
    flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    startAutoPlay(); // Reset autoplay timer
  };

  const handleNext = () => {
    if (images.length === 0) return;
    const newIndex = (currentIndexRef.current + 1) % images.length;
    currentIndexRef.current = newIndex;
    setActiveIndex(newIndex);
    flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    startAutoPlay(); // Reset autoplay timer
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          currentIndexRef.current = newIndex;
          setActiveIndex(newIndex);
        }}
      />

      {images.length > 1 && ( // Only show buttons if multiple images
        <>
          <TouchableOpacity style={styles.prevButton} onPress={handlePrev}>
            <MaterialIcons name="chevron-left" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <MaterialIcons name="chevron-right" size={20} color="white" />
          </TouchableOpacity>
        </>
      )}

      {images.length > 1 && ( // Only show pagination if multiple images
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: index === activeIndex ? 20 : 8,
                  backgroundColor: index === activeIndex
                    ? '#fff'
                    : 'rgba(255,255,255,0.5)',
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Styles remain unchanged

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT,
    backgroundColor: '#000',
  },
  itemContainer: {
    width: SCREEN_WIDTH,
    height: ITEM_HEIGHT,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: ITEM_HEIGHT / 2,
    bottom: 0,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  prevButton: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  nextButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
});

export default ImageSlider;