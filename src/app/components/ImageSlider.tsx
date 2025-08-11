import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  StyleSheet,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = 200;
const CONTAINER_WIDTH = SCREEN_WIDTH * 0.95;

interface ImageSliderProps {
  images: Array<{
    id: string | number;
    image: string | number | { uri: string };
  }>;
}

const ImageSlider = ({ images = [] }: ImageSliderProps): React.ReactElement => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [images]);

  const startAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (images.length <= 1) return;

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

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const inputRange = [
      (index - 1) * CONTAINER_WIDTH,
      index * CONTAINER_WIDTH,
      (index + 1) * CONTAINER_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.itemContainer, { transform: [{ scale }] }]}>
        <Image
          source={typeof item.image === 'string' ? { uri: item.image } : item.image}
          style={styles.image}
          resizeMode="cover"
        />
      </Animated.View>
    );
  };

  const handlePrev = () => {
    if (images.length === 0) return;
    const newIndex = (currentIndexRef.current - 1 + images.length) % images.length;
    currentIndexRef.current = newIndex;
    setActiveIndex(newIndex);
    flatListRef.current?.scrollToIndex({ 
      index: newIndex, 
      animated: true 
    });
    startAutoPlay();
  };

  const handleNext = () => {
    if (images.length === 0) return;
    const newIndex = (currentIndexRef.current + 1) % images.length;
    currentIndexRef.current = newIndex;
    setActiveIndex(newIndex);
    flatListRef.current?.scrollToIndex({ 
      index: newIndex, 
      animated: true 
    });
    startAutoPlay();
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        getItemLayout={(_, index) => ({
          length: CONTAINER_WIDTH,
          offset: CONTAINER_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / CONTAINER_WIDTH);
          currentIndexRef.current = newIndex;
          setActiveIndex(newIndex);
        }}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
      />

      {images.length > 1 && (
        <>
          <TouchableOpacity style={styles.prevButton} onPress={handlePrev}>
            <MaterialIcons name="chevron-left" size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </>
      )}

      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: index === activeIndex ? 20 : 8,
                  backgroundColor: index === activeIndex
                    ? theme.colors.white
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

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT,
    backgroundColor: theme.colors.black,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
    width: '95%',
    alignSelf: 'center',
  },
  itemContainer: {
    width: CONTAINER_WIDTH,
    height: ITEM_HEIGHT,
    overflow: 'hidden',
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 12,
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