import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Text,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface EnhancedLoaderProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

const EnhancedLoader: React.FC<EnhancedLoaderProps> = ({
  visible,
  message = 'Loading...',
  size = 'medium',
  overlay = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const crownRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { logoSize: 60, containerSize: 120 };
      case 'large':
        return { logoSize: 120, containerSize: 200 };
      default:
        return { logoSize: 80, containerSize: 160 };
    }
  };

  const { logoSize, containerSize } = getSizeConfig();

  useEffect(() => {
    if (visible) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Start continuous animations
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );

      const crownAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(crownRotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(crownRotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      rotateAnimation.start();
      crownAnimation.start();
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        crownAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const crownRotateInterpolate = crownRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        overlay && styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {overlay && Platform.OS === 'ios' ? (
        <BlurView intensity={10} style={StyleSheet.absoluteFill} />
      ) : null}
      
      <LinearGradient
        colors={['rgba(133, 1, 17, 0.9)', 'rgba(90, 0, 11, 0.9)']}
        style={[styles.gradientBackground, overlay && StyleSheet.absoluteFill]}
      />

      <Animated.View
        style={[
          styles.loaderContainer,
          {
            width: containerSize,
            height: containerSize,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Outer rotating ring */}
        <Animated.View
          style={[
            styles.outerRing,
            {
              width: containerSize,
              height: containerSize,
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FFD700']}
            style={styles.ringGradient}
          />
        </Animated.View>

        {/* Inner glow effect */}
        <Animated.View
          style={[
            styles.innerGlow,
            {
              width: containerSize - 20,
              height: containerSize - 20,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Logo container with GIF animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              width: logoSize,
              height: logoSize,
              transform: [{ rotate: crownRotateInterpolate }],
            },
          ]}
        >
          {/* DC Jewellers animated gold GIF */}
          <Image
            source={require('../../../assets/images/gold_animate.gif')}
            style={[styles.logo, { width: logoSize, height: logoSize }]}
            resizeMode="contain"
          />
          
          {/* Crown effect overlay */}
          <View style={styles.crownOverlay}>
            <Text style={styles.crownText}>👑</Text>
          </View>
        </Animated.View>

        {/* Sparkle effects */}
        <View style={styles.sparkleContainer}>
          {[...Array(6)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.sparkle,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [`${index * 60}deg`, `${(index * 60) + 360}deg`],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Loading text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: scaleAnim.interpolate({
              inputRange: [0.8, 1],
              outputRange: [20, 0],
            })}],
          },
        ]}
      >
        <Text style={styles.loadingText}>{message}</Text>
        <Text style={styles.brandText}>DC JEWELLERS</Text>
        <View style={styles.dotsContainer}>
          {[...Array(3)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: rotateAnim.interpolate({
                    inputRange: [0, 0.33, 0.66, 1],
                    outputRange: index === 0 ? [1, 0.5, 0.5, 1] : 
                               index === 1 ? [0.5, 1, 0.5, 0.5] : 
                                           [0.5, 0.5, 1, 0.5],
                  }),
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradientBackground: {
    borderRadius: 20,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  ringGradient: {
    flex: 1,
    borderRadius: 1000,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  innerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 1000,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 1000,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logo: {
    borderRadius: 1000,
  },
  crownOverlay: {
    position: 'absolute',
    top: -15,
    right: -5,
  },
  crownText: {
    fontSize: 20,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -10,
  },
  sparkleText: {
    fontSize: 16,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 2,
    marginBottom: 15,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
});

export default EnhancedLoader; 