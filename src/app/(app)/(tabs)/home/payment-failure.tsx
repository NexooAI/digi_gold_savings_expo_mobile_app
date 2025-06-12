import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { Header, Card, DetailRow } from '@/components';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Parse user details from params
  const userDetails = params.userDetails ? JSON.parse(params.userDetails as string) : null;

  // Format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      Alert.alert(
        'Maximum Retries Exceeded',
        'You have reached the maximum number of retry attempts. Please contact support for assistance.',
        [
          {
            text: 'Contact Support',
            onPress: () => {
              // Implement support contact functionality
            },
          },
          {
            text: 'Go to Home',
            onPress: () => router.replace('/(tabs)/home'),
            style: 'cancel',
          },
        ]
      );
      return;
    }

    try {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);

      // Navigate back to payment preview with the same details
      router.push({
        pathname: "/(tabs)/home/payment-preview",
        params: {
          amount: params.amount,
          userDetails: params.userDetails,
          isRetry: 'true',
          retryCount: String(retryCount + 1),
        },
      });
    } catch (error) {
      console.error('Error during retry:', error);
      Alert.alert(
        'Retry Failed',
        'Unable to retry payment. Please try again or contact support.',
        [
          {
            text: 'Contact Support',
            onPress: () => {
              // Implement support contact functionality
            },
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContactSupport = () => {
    // Implement support contact functionality
    Alert.alert(
      'Contact Support',
      'Our support team will contact you shortly.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/home'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        onBack={() => router.back()}
        title="Payment Failed"
        rightIcon="help-circle-outline"
        onRightPress={() => {
          // Implement help functionality
        }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="close-circle" size={80} color="#FF3B30" />
        </View>

        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.subtitle}>We couldn't process your payment</Text>

        <Card 
          title="Transaction Details" 
          icon="cash-multiple"
          iconColor="#FF3B30"
        >
          <DetailRow 
            label="Transaction ID" 
            value={userDetails?.transactionId || 'N/A'} 
          />
          <DetailRow 
            label="Order ID" 
            value={userDetails?.orderId || 'N/A'} 
          />
          <DetailRow 
            label="Amount" 
            value={String(params.amount)} 
            isAmount 
          />
          <DetailRow 
            label="Failed Date" 
            value={formatDate(new Date().toISOString())} 
          />
          <DetailRow 
            label="Scheme Name" 
            value={userDetails?.schemeName || 'N/A'} 
          />
          <DetailRow 
            label="Error Message" 
            value={params.errorMessage || 'Payment processing failed'} 
            error
          />
        </Card>

        {retryCount > 0 && (
          <View style={styles.retryInfo}>
            <MaterialCommunityIcons name="information" size={20} color="#FFC857" />
            <Text style={styles.retryInfoText}>
              Retry attempt {retryCount} of {MAX_RETRIES}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={handleRetry}
          disabled={isRetrying || retryCount >= MAX_RETRIES}
        >
          {isRetrying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>
                {retryCount >= MAX_RETRIES ? 'Max Retries Reached' : 'Retry Payment'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.homeButton]}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <MaterialCommunityIcons name="home" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.supportButton]}
          onPress={handleContactSupport}
        >
          <MaterialCommunityIcons name="headset" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
  },
  homeButton: {
    backgroundColor: '#666',
  },
  supportButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  supportButtonText: {
    color: theme.colors.primary,
  },
  buttonIcon: {
    marginRight: 8,
  },
  retryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: 16,
  },
  retryInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FFC857',
    fontWeight: '500',
  },
  footer: {
    width: '100%',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
}); 