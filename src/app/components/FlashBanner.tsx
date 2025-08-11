import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface FlashBannerProps {
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  imageSource?: any;
}

const { width, height } = Dimensions.get('window');

const FlashBanner: React.FC<FlashBannerProps> = ({ message, children, onClose, imageSource = require('../../../assets/images/flashbanner.png') }) => {
  const [visible, setVisible] = useState(true);
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={32} color={theme.colors.white} />
      </TouchableOpacity>
      {children ? children : (
        <Image 
          source={imageSource}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0,0,0,0.8)', // Dark overlay
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 30,
    zIndex: 10000,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    padding: 6,
  },
  message: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.redDarker,
    textAlign: 'center',
    marginVertical: 10,
  },
  bannerImage: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  }
});

export default FlashBanner; 