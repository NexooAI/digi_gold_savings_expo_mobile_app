import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/constants/config';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import { socket } from '@/services/socket';
import PayButton from '@/components/payment/PayButton';
import { t } from '@/i18n';
import AppHeader from '@/app/components/AppHeader';

// Import components
import { Header } from '@/components/payment/Header';
import { DetailRow } from '@/components/payment/DetailRow';
import { Card } from '@/components/payment/Card';
import { ProcessingStatus } from '@/components/payment/ProcessingStatus';

interface UserDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  amount: string;
  scheme_id: string;
  scheme_name: string;
  scheme_description: string;
  scheme_duration: string;
  scheme_installment: string;
  scheme_total_amount: string;
  scheme_total_gold: string;
  scheme_start_date: string;
  scheme_end_date: string;
  scheme_status: string;
  scheme_created_at: string;
  scheme_updated_at: string;
}

// Scheme Type Badge Component
const SchemeTypeBadge = ({ type }: { type?: string }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{type || 'Regular'}</Text>
  </View>
);

export default function PaymentPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // Parse user details from params
  useEffect(() => {
    try {
      if (params.userDetails) {
        const details = JSON.parse(params.userDetails as string);
        setUserDetails(details);
        console.log('User details parsed successfully:', details);
      } else {
        console.error('No user details found in params');
        Alert.alert('Error', 'Required payment information is missing');
        router.back();
      }
    } catch (error) {
      console.error('Error parsing user details:', error);
      Alert.alert('Error', 'Invalid payment information');
      router.back();
    }
  }, [params]);

  // Initialize socket connection
  useEffect(() => {
    console.log('Initializing socket connection...');
    
    // Configure socket with automatic connection
    socket.io.opts.autoConnect = true;
    socket.io.opts.reconnection = true;
    socket.io.opts.reconnectionAttempts = 5;
    socket.io.opts.reconnectionDelay = 1000;

    // Connect to socket
    socket.connect();
    console.log('Socket connection initiated');

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      setIsSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsSocketConnected(false);
    });

    socket.on('payment_status', (data) => {
      console.log('Payment status received:', data);
      if (data.status === 'success') {
        handlePaymentSuccess(data);
      } else if (data.status === 'failed') {
        handlePaymentFailure(data);
      } else if (data.status === 'cancel') {
        handlePaymentCancel(data);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection...');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('payment_status');
      socket.disconnect();
    };
  }, []);

  // Handle successful payment
  const handlePaymentSuccess = (data: any) => {
    console.log('Processing successful payment:', data);
    setIsProcessing(false);
    router.push({
      pathname: '/(app)/(tabs)/home/payment-success',
      params: {
        transactionId: data.transaction_id,
        amount: data.amount,
        schemeId: data.scheme_id,
        schemeName: data.scheme_name,
        schemeDescription: data.scheme_description,
        schemeDuration: data.scheme_duration,
        schemeInstallment: data.scheme_installment,
        schemeTotalAmount: data.scheme_total_amount,
        schemeTotalGold: data.scheme_total_gold,
        schemeStartDate: data.scheme_start_date,
        schemeEndDate: data.scheme_end_date,
        schemeStatus: data.scheme_status,
        schemeCreatedAt: data.scheme_created_at,
        schemeUpdatedAt: data.scheme_updated_at,
      },
    });
  };

  // Handle failed payment
  const handlePaymentFailure = (data: any) => {
    console.log('Processing failed payment:', data);
    setIsProcessing(false);
    router.push({
      pathname: '/(app)/(tabs)/home/payment-failed',
      params: {
        error: data.error || 'Payment failed',
        transactionId: data.transaction_id,
        amount: data.amount,
        schemeId: data.scheme_id,
        schemeName: data.scheme_name,
        schemeDescription: data.scheme_description,
        schemeDuration: data.scheme_duration,
        schemeInstallment: data.scheme_installment,
        schemeTotalAmount: data.scheme_total_amount,
        schemeTotalGold: data.scheme_total_gold,
        schemeStartDate: data.scheme_start_date,
        schemeEndDate: data.scheme_end_date,
        schemeStatus: data.scheme_status,
        schemeCreatedAt: data.scheme_created_at,
        schemeUpdatedAt: data.scheme_updated_at,
      },
    });
  };

  // Handle cancelled payment
  const handlePaymentCancel = (data: any) => {
    console.log('Processing cancelled payment:', data);
    setIsProcessing(false);
    router.push({
      pathname: '/(app)/(tabs)/home/payment-cancel',
      params: {
        transactionId: data.transaction_id,
        amount: data.amount,
        schemeId: data.scheme_id,
        schemeName: data.scheme_name,
        schemeDescription: data.scheme_description,
        schemeDuration: data.scheme_duration,
        schemeInstallment: data.scheme_installment,
        schemeTotalAmount: data.scheme_total_amount,
        schemeTotalGold: data.scheme_total_gold,
        schemeStartDate: data.scheme_start_date,
        schemeEndDate: data.scheme_end_date,
        schemeStatus: data.scheme_status,
        schemeCreatedAt: data.scheme_created_at,
        schemeUpdatedAt: data.scheme_updated_at,
      },
    });
  };

  // Handle pay now button press
  const handlePayNow = async () => {
    if (!userDetails) {
      console.error('User details not available');
      Alert.alert('Error', 'Required payment information is missing');
      return;
    }

    if (!isSocketConnected) {
      console.error('Socket not connected');
      Alert.alert('Error', 'Payment service is not available. Please try again.');
      return;
    }

    setIsProcessing(true);
    console.log('Initiating payment process...');

    try {
      const response = await api.post('/payments/initiate', {
        user_id: userDetails.id,
        scheme_id: userDetails.scheme_id,
        amount: userDetails.amount,
      });

      console.log('Payment initiation response:', response.data);

      if (response.data?.data?.payment_url) {
        router.push({
          pathname: '/(app)/(tabs)/home/payment-webview',
          params: {
            paymentUrl: response.data.data.payment_url,
            userDetails: JSON.stringify(userDetails),
          },
        });
      } else {
        throw new Error('Invalid payment URL received');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    }
  };

  // Determine if payment can be initiated
  const canInitiatePayment = useMemo(() => {
    const hasRequiredData = userDetails?.id && userDetails?.scheme_id && userDetails?.amount;
    const isReady = !isLoading && !isProcessing && isSocketConnected && hasRequiredData;
    console.log('Payment initiation status:', {
      hasRequiredData,
      isLoading,
      isProcessing,
      isSocketConnected,
      isReady,
    });
    return isReady;
  }, [isLoading, isProcessing, isSocketConnected, userDetails]);

  if (!userDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader showBackButton={true} backRoute="index" showLanguageSwitcher={false} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBackButton={true} backRoute="index" showLanguageSwitcher={false} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <Ionicons
              name={isSocketConnected ? 'wifi' : 'wifi-off'}
              size={20}
              color={isSocketConnected ? theme.colors.success : theme.colors.error}
            />
            <Text style={[
              styles.connectionStatusText,
              { color: isSocketConnected ? theme.colors.success : theme.colors.error }
            ]}>
              {isSocketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>

          {/* Scheme Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scheme Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scheme Name:</Text>
              <Text style={styles.detailValue}>{userDetails.scheme_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{userDetails.scheme_duration}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Installment:</Text>
              <Text style={styles.detailValue}>{userDetails.scheme_installment}</Text>
            </View>
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>₹{userDetails.amount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Gold:</Text>
              <Text style={styles.detailValue}>{userDetails.scheme_total_gold}g</Text>
            </View>
          </View>

          {/* Account Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{userDetails.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{userDetails.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{userDetails.phone}</Text>
            </View>
          </View>

          {/* Pay Button */}
          <View style={styles.buttonContainer}>
            <PayButton
              onPress={handlePayNow}
              isLoading={isProcessing}
              isDisabled={!canInitiatePayment}
              amount={userDetails.amount}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: moderateScale(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: moderateScale(16),
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    padding: moderateScale(8),
    backgroundColor: theme.colors.card,
    borderRadius: moderateScale(8),
  },
  connectionStatusText: {
    marginLeft: moderateScale(8),
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: moderateScale(12),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  detailLabel: {
    fontSize: moderateScale(14),
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: moderateScale(14),
    color: theme.colors.text,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(32),
  },
  badge: {
    backgroundColor: '#FFC857',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(4),
  },
  badgeText: {
    color: '#1a237e',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
}); 