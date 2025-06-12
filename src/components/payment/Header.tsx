import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface HeaderProps {
  onBack: () => void;
  title?: string;
  rightIcon?: string;
  onRightPress?: () => void;
  showBorder?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  title = 'Payment Preview',
  rightIcon,
  onRightPress,
  showBorder = true,
  backgroundColor = theme.colors.primary,
  textColor = '#FFC857',
}) => (
  <View style={[
    styles.header,
    { backgroundColor },
    showBorder && styles.headerWithBorder
  ]}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={textColor} />
    </TouchableOpacity>
    <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>
    {rightIcon && (
      <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
        <Ionicons name={rightIcon as any} size={24} color={textColor} />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.border}15`,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    flex: 1,
  },
  rightButton: {
    padding: 8,
  },
}); 