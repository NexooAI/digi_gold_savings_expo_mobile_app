import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  Share,
  Clipboard,
  Alert,
  Image,
  useWindowDimensions,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from "expo-blur";

const PaymentFailureScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width: windowWidth } = useWindowDimensions();
  const [currentDate, setCurrentDate] = useState('');

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const errorScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set current date
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setCurrentDate(formattedDate);

    // Start animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.spring(errorScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    }, 300);
  }, []);

  const handleCopyText = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Success', `${label} copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', `Failed to copy ${label}`);
    }
  };

  const handleShare = async () => {
    try {
      const message = `
Payment Failed

Amount: ₹${params.amount}
Transaction ID: ${params.txnId}
Order ID: ${params.orderId}
Date & Time: ${currentDate}
Error Message: ${params.errorMessage || 'Payment processing failed'}

Please try again or contact support.
      `;

      await Share.share({
        message,
        title: 'Payment Failure Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share payment details');
    }
  };

  const handleGoToHome = () => {
    router.replace('/(tabs)/home');
  };

  const handleGoToSchemes = () => {
    router.replace('/(tabs)/savings');
  };

  const handleViewTransactions = () => {
    router.replace('/(tabs)/transactions');
  };

  const handleViewProfile = () => {
    router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <LinearGradient
        colors={['#ef4444', '#dc2626']}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text style={styles.headerTitle}>Payment Failed</Text>
          <TouchableOpacity 
            onPress={handleShare}
            style={styles.shareButton}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.failureContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.errorContainer,
                  {
                    transform: [{ scale: errorScale }]
                  }
                ]}
              >
                <Ionicons name="close-circle" size={80} color="#fff" />
              </Animated.View>
            </View>

            <Text style={styles.failureTitle}>Payment Failed</Text>
            <Text style={styles.failureSubtitle}>
              {params.errorMessage || 'Your payment could not be processed'}
            </Text>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>₹{params.amount}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, styles.failedText]}>Failed</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.transactionInfo}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionLabel}>Transaction ID</Text>
                  <TouchableOpacity 
                    onPress={() => handleCopyText(params.txnId as string, 'Transaction ID')}
                    style={styles.copyButton}
                  >
                    <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.transactionId}>{params.txnId}</Text>

                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionLabel}>Order ID</Text>
                  <TouchableOpacity 
                    onPress={() => handleCopyText(params.orderId as string, 'Order ID')}
                    style={styles.copyButton}
                  >
                    <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.transactionId}>{params.orderId}</Text>

                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionLabel}>Date & Time</Text>
                </View>
                <Text style={styles.transactionId}>{currentDate}</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={handleGoToHome}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="home-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Go to Home</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navigationButton}
                onPress={handleGoToSchemes}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="list-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>View Schemes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={handleViewTransactions}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="time-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Transactions</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navigationButton}
                onPress={handleViewProfile}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="person-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  failureContainer: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
  },
  failureTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  failureSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 32,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
  },
  failedText: {
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 16,
  },
  transactionInfo: {
    alignItems: 'center',
    gap: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
  transactionId: {
    fontSize: 12,
    color: '#999',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  navigationButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default PaymentFailureScreen; 