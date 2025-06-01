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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import useGlobalStore from '@/store/global.store';
import { BlurView } from "expo-blur";

// Payment retry data keys
const PAYMENT_DATA_KEY = '@payment_data_retry';
const INVESTMENT_DATA_KEY = '@investment_data_retry';
const TRANSACTION_DATA_KEY = '@transaction_data_retry';
const COMPLETE_RETRY_DATA_KEY = '@complete_payment_retry_data';

const PaymentFailureScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width: windowWidth, height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState('');

  // Get global store functions
  const { 
    hasPaymentRetryData, 
    getPaymentRetryData, 
    storePaymentSession,
    clearPaymentRetryData,
    setTabVisibility
  } = useGlobalStore();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const errorScale = useRef(new Animated.Value(0)).current;

  // Calculate proper bottom padding for tab navigation
  const bottomPadding = Math.max(bottom, 20) + 80;

  // Create styles with dynamic height
  const dynamicStyles = StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      padding: 16,
      justifyContent: 'space-between',
      minHeight: height - 200, // Better screen utilization
    },
  });

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

    setTabVisibility(false);
    return () => {
      setTabVisibility(true);
    };
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
    Alert.alert('Coming Soon', 'This feature is coming soon');
    // router.replace('/(tabs)/transactions');
  };

  const handleViewProfile = () => {
    router.replace('/(tabs)/profile');
  };

  const handleRetryPayment = async () => {
    try {
      console.log('Checking for payment retry data in global store...');
      
      // Check if we have payment retry data in global store
      if (hasPaymentRetryData()) {
        const retryData = getPaymentRetryData();
        
        if (retryData) {
          console.log('Using payment retry data from global store:', retryData);

          // Store the retry session data in the format expected by payment screen
          const retryPaymentSession = {
            amount: retryData.paymentData.amount,
            userDetails: {
              accountname: retryData.displayData.accountHolder,
              accNo: retryData.displayData.accNo,
              name: retryData.displayData.accountHolder,
              mobile: retryData.paymentData.userMobile,
              email: retryData.paymentData.userEmail,
              userId: retryData.paymentData.userId,
              
              // Investment data
              investmentId: retryData.paymentData.investmentId,
              chitId: retryData.paymentData.chitId,
              schemeId: retryData.paymentData.schemeId,
              
              // Retry context
              isRetryAttempt: true,
              originalPaymentTimestamp: retryData.timestamp,
              retryTimestamp: new Date().toISOString(),
              source: 'payment_failure_retry',
              
              // Store complete retry data for reference
              retryData: retryData,
            },
            timestamp: new Date().toISOString(),
          };

          // Store the retry session data in global store
          storePaymentSession(retryPaymentSession);
          
          console.log('Retry payment session stored successfully in global store');

          // Navigate with minimal parameters - let payment screen load from store
          router.replace({
            pathname: '/(tabs)/home/payment',
            params: {
              amount: retryData.paymentData.amount.toString(),
              isRetry: 'true',
              retryTimestamp: new Date().getTime().toString(),
            }
          });
        } else {
          throw new Error('Payment retry data is null');
        }
      } else {
        // No stored data available, show error
        console.log('No payment retry data found in global store');
        
        Alert.alert(
          'Retry Error',
          'No payment data found for retry. Please try again from the savings screen.',
          [
            { text: 'OK', onPress: () => router.replace('/(tabs)/savings') }
          ]
        );
      }
    } catch (error) {
      console.error('Error retrieving payment data for retry:', error);
      Alert.alert(
        'Retry Error',
        'Unable to retrieve payment data. Please try again from the savings screen.',
        [
          { text: 'OK', onPress: () => router.replace('/(tabs)/savings') }
        ]
      );
    }
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
          contentContainerStyle={[
            dynamicStyles.scrollContent,
            { paddingBottom: bottomPadding }
          ]}
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
                <Ionicons name="close-circle" size={60} color="#fff" />
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

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryPayment}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Retry Payment</Text>
              </LinearGradient>
            </TouchableOpacity>

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

            {/* <View style={styles.buttonContainer}>
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
            </View> */}
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
  failureContainer: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-around',
  },
  iconContainer: {
    width: 100,
    height: 100,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 35,
  },
  failureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  failureSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
  },
  failedText: {
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  transactionInfo: {
    alignItems: 'center',
    gap: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  transactionLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
  transactionId: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  navigationButton: {
    flex: 1,
    height: 45,
    borderRadius: 22,
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
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  retryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
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
  retryButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default PaymentFailureScreen; 