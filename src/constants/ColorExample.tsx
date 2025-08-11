// src/constants/ColorExample.tsx
// Example component demonstrating the centralized color system

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS, { 
  PRIMARY_COLORS, 
  TEXT_COLORS, 
  STATUS_COLORS,
  COMPONENT_COLORS,
  GRADIENT_COLORS 
} from './colors';

const ColorExample: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header with primary colors */}
      <LinearGradient
        colors={GRADIENT_COLORS.primary}
        style={styles.header}
      >
        <Text style={styles.headerText}>Color System Demo</Text>
      </LinearGradient>

      {/* Primary colors section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Colors</Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorBox, { backgroundColor: PRIMARY_COLORS.primary }]}>
            <Text style={styles.colorLabel}>Primary</Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: PRIMARY_COLORS.secondary }]}>
            <Text style={styles.colorLabel}>Secondary</Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: PRIMARY_COLORS.gold }]}>
            <Text style={styles.colorLabel}>Gold</Text>
          </View>
        </View>
      </View>

      {/* Text colors section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Colors</Text>
        <Text style={[styles.textExample, { color: TEXT_COLORS.primary }]}>
          Primary Text Color
        </Text>
        <Text style={[styles.textExample, { color: TEXT_COLORS.secondary }]}>
          Secondary Text Color
        </Text>
        <Text style={[styles.textExample, { color: TEXT_COLORS.success }]}>
          Success Text Color
        </Text>
        <Text style={[styles.textExample, { color: TEXT_COLORS.error }]}>
          Error Text Color
        </Text>
      </View>

      {/* Status colors section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Colors</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBox, { backgroundColor: STATUS_COLORS.success }]}>
            <Text style={styles.statusText}>Success</Text>
          </View>
          <View style={[styles.statusBox, { backgroundColor: STATUS_COLORS.error }]}>
            <Text style={styles.statusText}>Error</Text>
          </View>
          <View style={[styles.statusBox, { backgroundColor: STATUS_COLORS.warning }]}>
            <Text style={styles.statusText}>Warning</Text>
          </View>
        </View>
      </View>

      {/* Component colors section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Component Colors</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: COMPONENT_COLORS.button.primary }]}
        >
          <Text style={[styles.buttonText, { color: COMPONENT_COLORS.button.white }]}>
            Primary Button
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: COMPONENT_COLORS.button.secondary }]}
        >
          <Text style={[styles.buttonText, { color: COMPONENT_COLORS.button.black }]}>
            Secondary Button
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card example */}
      <View style={[styles.card, { backgroundColor: COMPONENT_COLORS.card.background }]}>
        <Text style={[styles.cardTitle, { color: TEXT_COLORS.dark }]}>
          Card Example
        </Text>
        <Text style={[styles.cardText, { color: TEXT_COLORS.mediumGrey }]}>
          This card demonstrates the card background and border colors from the centralized system.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 15,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorLabel: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  textExample: {
    fontSize: 16,
    marginVertical: 5,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusBox: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: COLORS.shadow.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COMPONENT_COLORS.card.border,
    shadowColor: COLORS.shadow.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ColorExample;
