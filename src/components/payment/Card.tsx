import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface CardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  onPress?: () => void;
  iconColor?: string;
  titleColor?: string;
  backgroundColor?: string;
  showBorder?: boolean;
  elevation?: number;
  style?: object;
}

export const Card: React.FC<CardProps> = ({
  title,
  icon,
  children,
  onPress,
  iconColor = '#FFC857',
  titleColor = theme.colors.primary,
  backgroundColor = '#fff',
  showBorder = true,
  elevation = 4,
  style,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.card,
        { backgroundColor, elevation },
        showBorder && styles.cardWithBorder,
        style,
      ]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
        <Text style={[styles.cardTitle, { color: titleColor }]}>{title}</Text>
      </View>
      <View style={styles.detailsContainer}>
        {children}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardWithBorder: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  detailsContainer: {
    gap: 12,
  },
}); 