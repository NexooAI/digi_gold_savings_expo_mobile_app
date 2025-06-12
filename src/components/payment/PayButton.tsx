import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';

interface PayButtonProps {
  amount: string;
  isLoading?: boolean;
  onPress: () => void;
  buttonText?: string;
  gradientColors?: string[];
  textColor?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function PayButton({
  amount,
  isLoading = false,
  onPress,
  buttonText = 'Pay Now',
  gradientColors = ['#1a237e', '#283593'],
  textColor = '#FFC857',
  icon,
  disabled = false,
}: PayButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading || disabled}
      style={[
        styles.container,
        (isLoading || disabled) && styles.disabledContainer
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#cccccc', '#999999'] : gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { color: textColor }]}>
                {buttonText}
              </Text>
              <Text style={[styles.amount, { color: textColor }]}>
                ₹{amount}
              </Text>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = ScaledSheet.create({
  container: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledContainer: {
    opacity: 0.7,
  },
  gradient: {
    padding: moderateScale(16),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  text: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  amount: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
}); 