import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { t } from '@/i18n';

export default function PaymentSuccess() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [checkmarkAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Initial animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true
        })
      ]),
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true
      })
    ]).start();

    // Infinite pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  const handleHomePress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => router.replace('/(tabs)/home'));
  };
  const handleSavingsPress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => router.replace('/(tabs)/savings'));
  };
  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[
        styles.content, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.iconContainer}>
          <Animated.View style={[
            styles.checkmarkContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Animated.View style={[
              styles.checkmarkInner,
              { transform: [{ scale: checkmarkScale }] }
            ]}>
              <Ionicons name="checkmark-circle" size={100} color="#16c72e" />
            </Animated.View>
          </Animated.View>
        </View>
        
        <Text style={styles.title}>{t('paymentSuccessful')}</Text>
        <Text style={styles.message}>{t('paymentSuccessMessage')}</Text>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{t('paymentDetails')}</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t('transactionId')}</Text>
              <Text style={styles.detailValue}>{params.txnId}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t('orderId')}</Text>
              <Text style={styles.detailValue}>{params.orderId}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="wallet-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t('amount')}</Text>
              <Text style={[styles.detailValue, styles.amountValue]}>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(Number(params.amount) || 0)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleHomePress}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>{t('backToHome')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleSavingsPress}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>{t('backToSavings')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  message: {
    fontSize: 17,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: '85%',
    fontFamily: 'Inter_400Regular',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#3d5afe',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
    fontFamily: 'Inter_400Regular',
  },
  detailValue: {
    fontSize: 16,
    color: '#1a202c',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  amountValue: {
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#edf2f7',
    marginVertical: 4,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});