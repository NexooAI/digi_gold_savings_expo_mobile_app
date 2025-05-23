import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
  PanResponder,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatusViewProps {
  images: any[];
  isVisible: boolean;
  initialIndex: number;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const StatusView: React.FC<StatusViewProps> = ({ images, isVisible, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isVisible]);

  const goNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };
  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) goNext();
      else if (gestureState.dx > 50) goPrev();
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.container} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.leftNav} onPress={goPrev}>
            <Ionicons name="chevron-back" size={36} color="#fff" />
          </TouchableOpacity>
        )}
        <Image
          source={images[currentIndex]}
          style={styles.image}
          resizeMode="contain"
        />
        {currentIndex < images.length - 1 && (
          <TouchableOpacity style={styles.rightNav} onPress={goNext}>
            <Ionicons name="chevron-forward" size={36} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.counter}>
          <Text style={styles.counterText}>{currentIndex + 1} / {images.length}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  leftNav: {
    position: 'absolute',
    left: 10,
    top: height / 2 - 30,
    zIndex: 2,
    padding: 10,
  },
  rightNav: {
    position: 'absolute',
    right: 10,
    top: height / 2 - 30,
    zIndex: 2,
    padding: 10,
  },
  counter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  counterText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default StatusView; 