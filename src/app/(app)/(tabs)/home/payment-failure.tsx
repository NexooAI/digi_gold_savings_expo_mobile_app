import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { t } from '@/i18n';

export default function PaymentFailure() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [iconAnim] = useState(new Animated.Value(0));
  
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
      Animated.timing(iconAnim, {
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

  const handleRetry = ()=>{
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => router.back());
  }
  const iconScale = iconAnim.interpolate({
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
            styles.iconWrapper,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Animated.View style={[
              styles.iconInner,
              { transform: [{ scale: iconScale }] }
            ]}>
              <Ionicons name="close-circle" size={100} color={theme.colors.error} />
            </Animated.View>
          </Animated.View>
        </View>
        
        <Text style={styles.title}>{t('paymentFailed')}</Text>
        <Text style={styles.message}>{params.message || t('paymentFailedMessage')}</Text>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{t('paymentDetails')}</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="receipt-outline" size={20} color={theme.colors.error} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t('transactionId')}</Text>
              <Text style={styles.detailValue}>{params.txnId}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.error} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t('orderId')}</Text>
              <Text style={styles.detailValue}>{params.orderId}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="wallet-outline" size={20} color={theme.colors.error} />
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
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonHalf, styles.buttonRetry]}
            onPress={handleRetry}
            activeOpacity={0.9}
          >
            <Ionicons name="refresh" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.buttonText}>{t('retry')}</Text>
          </TouchableOpacity>
          <View style={{width: 16}} />
          <TouchableOpacity 
            style={[styles.button, styles.buttonHalf, styles.buttonHome]}
            onPress={handleHomePress}
            activeOpacity={0.9}
          >
            <Ionicons name="home" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.buttonText}>{t('backToHome')}</Text>
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
  iconWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.error,
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
    backgroundColor: '#fde8e8',
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
    color: theme.colors.error,
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
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.error,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: theme.colors.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonHalf: {
    flex: 1,
    minWidth: 0,
  },
  buttonRetry: {
    flex: 1,
  },
  buttonHome: {
    flex: 1.3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
}); 