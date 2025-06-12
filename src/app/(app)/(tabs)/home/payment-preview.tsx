import React, { useEffect, useState, useMemo, useRef } from 'react';
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

interface PaymentStatusData {
  status: 'success' | 'failed' | 'cancel';
  transaction_id: string;
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
  error?: string;
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
  const socketInitialized = useRef(false);
  const detailsParsed = useRef(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Parse user details from params
  useEffect(() => {
    if (detailsParsed.current) return;

    try {
      if (params.userDetails) {
        const details = JSON.parse(params.userDetails as string);
        console.log('User details received:', details);

        // Check for required fields
        const required = [
          { keys: ['amount'], label: 'Amount' },
          { keys: ['schemeDuration', 'scheme_duration'], label: 'Duration' },
          { keys: ['schemeInstallment', 'scheme_installment'], label: 'Installment' },
          { keys: ['schemeTotalAmount', 'scheme_total_amount'], label: 'Total Amount' },
          { keys: ['schemeTotalGold', 'scheme_total_gold'], label: 'Total Gold' }
        ];

        const missing = required.filter(({ keys }) =>
          keys.every(key => details[key] === undefined || details[key] === null || details[key] === '')
        );

        if (missing.length > 0) {
          Alert.alert(
            'Error',
            `Missing payment info: ${missing.map(f => f.label).join(', ')}`
          );
          router.back();
          return;
        }

        setUserDetails({
          ...details,
          id: details.userId || details.id,
          scheme_id: details.schemeId || details.scheme_id,
          scheme_name: details.schemeName || details.scheme_name,
          scheme_description: details.schemeDescription || details.scheme_description,
          scheme_duration: details.schemeDuration || details.scheme_duration,
          scheme_installment: details.schemeInstallment || details.scheme_installment,
          scheme_total_amount: details.schemeTotalAmount || details.scheme_total_amount,
          scheme_total_gold: details.schemeTotalGold || details.scheme_total_gold,
          scheme_start_date: details.schemeStartDate || details.scheme_start_date,
          scheme_end_date: details.schemeEndDate || details.scheme_end_date,
          scheme_status: details.schemeStatus || details.scheme_status,
          scheme_created_at: details.schemeCreatedAt || details.scheme_created_at,
          scheme_updated_at: details.schemeUpdatedAt || details.scheme_updated_at,
          amount: details.amount,
          name: details.name,
          email: details.email,
          phone: details.mobile || details.phone,
        });
        detailsParsed.current = true;
        console.log('User details parsed and mapped:', userDetails);
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
  }, [params.userDetails]);

  // Initialize socket connection
  useEffect(() => {
    if (socketInitialized.current) {
      return;
    }

    console.log('Initializing socket connection to:', SOCKET_URL);
    
    if (!socket) {
      console.error('Socket instance not available');
      Alert.alert('Error', 'Payment service is not available. Please try again later.');
      return;
    }

    socketInitialized.current = true;

    // Set up socket event handlers
    const setupSocketHandlers = () => {
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setIsSocketConnected(true);
        setReconnectAttempts(0); // Reset attempts on successful connection
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected. Reason:', reason);
        setIsSocketConnected(false);
        
        // Attempt to reconnect if not manually disconnected
        if (reason !== 'io client disconnect') {
          console.log('Attempting to reconnect...');
          socket.connect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error, 'URL:', SOCKET_URL);
        setIsSocketConnected(false);
        setReconnectAttempts(prev => prev + 1);
        
        // Show error to user after multiple failed attempts
        if (reconnectAttempts >= 3) {
          Alert.alert(
            'Connection Error',
            'Unable to connect to payment service. Please check your internet connection and try again.',
            [
              {
                text: 'Retry',
                onPress: () => {
                  setReconnectAttempts(0);
                  socket.connect();
                }
              },
              {
                text: 'Cancel',
                onPress: () => {
                  router.back();
                }
              }
            ]
          );
        }
      });

      socket.on('reconnect_attempt', (attempt) => {
        console.log('Socket reconnect attempt:', attempt);
      });

      socket.on('reconnect', (attempt) => {
        console.log('Socket reconnected after attempts:', attempt);
        setIsSocketConnected(true);
      });

      socket.on('reconnect_error', (error) => {
        console.error('Socket reconnect error:', error);
      });

      socket.on('reconnect_failed', () => {
        console.error('Socket failed to reconnect');
        Alert.alert(
          'Connection Failed',
          'Unable to establish connection to payment service. Please try again later.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              }
            }
          ]
        );
      });

      socket.on('payment_status_update', (data: PaymentStatusData) => {
        console.log('Payment status received:', data);
        if (data.status === 'success') {
          handlePaymentSuccess(data);
        } else if (data.status === 'failed') {
          handlePaymentFailure(data);
        } else if (data.status === 'cancel') {
          handlePaymentCancel(data);
        }
      });
    };

    // Initial setup
    setupSocketHandlers();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection...');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect_attempt');
      socket.off('reconnect');
      socket.off('reconnect_error');
      socket.off('reconnect_failed');
      socket.off('payment_status_update');
      socketInitialized.current = false;
    };
  }, []);

  // Handle successful payment
  const handlePaymentSuccess = (data: PaymentStatusData) => {
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
  const handlePaymentFailure = (data: PaymentStatusData) => {
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
  const handlePaymentCancel = (data: PaymentStatusData) => {
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

    // Validate required fields
    const requiredFields = [
      { field: 'id', label: 'User ID' },
      { field: 'scheme_id', label: 'Scheme ID' },
      { field: 'amount', label: 'Amount' },
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' }
    ];

    const missingFields = requiredFields.filter(
      ({ field }) => !userDetails[field as keyof UserDetails]
    );

    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please provide: ${missingFields.map(f => f.label).join(', ')}`
      );
      return;
    }

    if (!isSocketConnected) {
      console.error('Socket not connected');
      Alert.alert(
        'Connection Error',
        'Payment service is not available. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              socket.connect();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    setIsProcessing(true);
    console.log('Initiating payment process...');

    try {
      const response = await api.post('/payments/initiate', {
        user_id: userDetails.id,
        scheme_id: userDetails.scheme_id,
        amount: userDetails.amount,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone
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
      console.error('Payment initiation failed:', error);
      Alert.alert(
        'Payment Error',
        'Failed to initiate payment. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setIsProcessing(false);
              handlePayNow();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsProcessing(false);
            }
          }
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Socket status indicator */}
      <View style={styles.connectionStatus}>
        <MaterialCommunityIcons
          name={isSocketConnected ? 'wifi' : 'wifi-off'}
          size={18}
          color={isSocketConnected ? 'green' : 'red'}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.connectionText, { color: isSocketConnected ? 'green' : 'red' }]}>
          {isSocketConnected ? 'Connected to payment server' : 'Not connected to payment server'}
        </Text>
      </View>
      <AppHeader showBackButton={true} backRoute="index" showLanguageSwitcher={false} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Header
            onBack={() => router.back()}
            title="Payment Details"
          />

          <Card
            title="Scheme Details"
            icon="information"
          >
            <DetailRow
              label="Scheme Name"
              value={userDetails?.scheme_name || 'N/A'}
            />
            <DetailRow
              label="Amount"
              value={`₹${userDetails?.amount || '0'}`}
            />
            <DetailRow
              label="Duration"
              value={userDetails?.scheme_duration || 'N/A'}
            />
            <DetailRow
              label="Installment"
              value={userDetails?.scheme_installment || 'N/A'}
            />
          </Card>

          <Card
            title="Payment Summary"
            icon="cash-multiple"
          >
            <DetailRow
              label="Total Amount"
              value={`₹${userDetails?.scheme_total_amount || '0'}`}
            />
            <DetailRow
              label="Total Gold"
              value={`${userDetails?.scheme_total_gold || '0'} g`}
            />
          </Card>

          <Card
            title="User Details"
            icon="account"
          >
            <DetailRow
              label="Name"
              value={userDetails?.name || 'N/A'}
            />
            <DetailRow
              label="Email"
              value={userDetails?.email || 'N/A'}
            />
            <DetailRow
              label="Phone"
              value={userDetails?.phone || 'N/A'}
            />
          </Card>

          <PayButton
            onPress={handlePayNow}
            isLoading={isProcessing}
            disabled={!isSocketConnected || !userDetails}
            amount={userDetails?.amount || '0'}
          />

          {isProcessing && (
            <ProcessingStatus
              status="Processing your payment..."
              showSpinner={true}
            />
          )}
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
    backgroundColor: theme.colors.background,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: moderateScale(10),
    justifyContent: 'center',
    padding: moderateScale(8),
    backgroundColor: theme.colors.background,
    borderRadius: moderateScale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  connectionText: {
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(4),
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
}); 