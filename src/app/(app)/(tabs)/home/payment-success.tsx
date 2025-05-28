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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { BlurView } from "expo-blur";

const { width } = Dimensions.get('window');

const PaymentSuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width: windowWidth } = useWindowDimensions();
  const [goldWeight, setGoldWeight] = useState(0);
  const [currentGoldRate, setCurrentGoldRate] = useState(0);
  const [currentDate, setCurrentDate] = useState('');

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Get current gold rate and calculate weight
    const getGoldRate = async () => {
      try {
        const cachedRate = await AsyncStorage.getItem('gold_rate');
        if (cachedRate) {
          const rate = parseFloat(cachedRate);
          setCurrentGoldRate(rate);
          const amount = parseFloat(params.amount as string);
          const calculatedWeight = amount / rate;
          setGoldWeight(calculatedWeight);
        }
      } catch (error) {
        console.error('Error getting gold rate:', error);
      }
    };

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

    getGoldRate();

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
      Animated.spring(checkmarkScale, {
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
Payment Successful!

Amount Paid: ₹${params.amount}
Gold Weight: ${goldWeight.toFixed(3)}g
Transaction ID: ${params.txnId}
Order ID: ${params.orderId}
Date & Time: ${currentDate}

Scheme: ${params.schemeName}
Installment: ${params.installmentNumber} of ${params.totalInstallments}

Thank you for your payment!
      `;

      await Share.share({
        message,
        title: 'Payment Receipt',
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
        colors={['#4CAF50', '#2E7D32']}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text style={styles.headerTitle}>Payment Success</Text>
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
              styles.successContainer,
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
                  styles.checkmarkContainer,
                  {
                    transform: [{ scale: checkmarkScale }]
                  }
                ]}
              >
                <Ionicons name="checkmark-circle" size={80} color="#fff" />
              </Animated.View>
            </View>

            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              Your gold investment has been processed
            </Text>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount Paid</Text>
                  <Text style={styles.detailValue}>₹{params.amount}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Gold Weight</Text>
                  <Text style={styles.detailValue}>{goldWeight.toFixed(3)} g</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.schemeInfo}>
                <Text style={styles.schemeName}>{params.schemeName}</Text>
                <Text style={styles.installmentInfo}>
                  Installment {params.installmentNumber} of {params.totalInstallments}
                </Text>
              </View>

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
                  colors={['#4CAF50', '#2E7D32']}
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
                  colors={['#4CAF50', '#2E7D32']}
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
                  colors={['#4CAF50', '#2E7D32']}
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
                  colors={['#4CAF50', '#2E7D32']}
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
    width: 40, // Same width as the share button for balance
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
  successContainer: {
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
  checkmarkContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
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
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 16,
  },
  schemeInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  schemeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  installmentInfo: {
    fontSize: 14,
    color: '#666',
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
        shadowColor: '#4CAF50',
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

export default PaymentSuccessScreen; 