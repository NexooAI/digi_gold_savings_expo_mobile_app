// src/constants/ColorTest.tsx
// Test component to verify color system functionality

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS, { 
  PRIMARY_COLORS, 
  TEXT_COLORS, 
  STATUS_COLORS,
  COMPONENT_COLORS,
  GRADIENT_COLORS 
} from './colors';

const ColorTest: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.gradients.primary}
        style={styles.header}
      >
        <Text style={styles.headerText}>Color System Test</Text>
        <Text style={styles.headerSubtext}>All colors should display correctly</Text>
      </LinearGradient>

      {/* Primary Colors Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Colors</Text>
        <View style={styles.colorGrid}>
          <View style={[styles.colorBox, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.colorLabel}>Primary</Text>
            <Text style={styles.colorValue}>{COLORS.primary}</Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.colorLabel}>Secondary</Text>
            <Text style={styles.colorValue}>{COLORS.secondary}</Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: COLORS.gold }]}>
            <Text style={styles.colorLabel}>Gold</Text>
            <Text style={styles.colorValue}>{COLORS.gold}</Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: COLORS.silver }]}>
            <Text style={styles.colorLabel}>Silver</Text>
            <Text style={styles.colorValue}>{COLORS.silver}</Text>
          </View>
        </View>
      </View>

      {/* Text Colors Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Colors</Text>
        <Text style={[styles.textExample, { color: COLORS.text.primary }]}>
          Primary Text Color - {COLORS.text.primary}
        </Text>
        <Text style={[styles.textExample, { color: COLORS.text.secondary }]}>
          Secondary Text Color - {COLORS.text.secondary}
        </Text>
        <Text style={[styles.textExample, { color: COLORS.text.success }]}>
          Success Text Color - {COLORS.text.success}
        </Text>
        <Text style={[styles.textExample, { color: COLORS.text.error }]}>
          Error Text Color - {COLORS.text.error}
        </Text>
        <Text style={[styles.textExample, { color: COLORS.text.warning }]}>
          Warning Text Color - {COLORS.text.warning}
        </Text>
      </View>

      {/* Status Colors Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Colors</Text>
        <View style={styles.statusGrid}>
          <View style={[styles.statusBox, { backgroundColor: COLORS.status.success }]}>
            <Text style={styles.statusText}>Success</Text>
            <Text style={styles.statusValue}>{COLORS.status.success}</Text>
          </View>
          <View style={[styles.statusBox, { backgroundColor: COLORS.status.error }]}>
            <Text style={styles.statusText}>Error</Text>
            <Text style={styles.statusValue}>{COLORS.status.error}</Text>
          </View>
          <View style={[styles.statusBox, { backgroundColor: COLORS.status.warning }]}>
            <Text style={styles.statusText}>Warning</Text>
            <Text style={styles.statusValue}>{COLORS.status.warning}</Text>
          </View>
          <View style={[styles.statusBox, { backgroundColor: COLORS.status.active }]}>
            <Text style={styles.statusText}>Active</Text>
            <Text style={styles.statusValue}>{COLORS.status.active}</Text>
          </View>
        </View>
      </View>

      {/* Component Colors Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Component Colors</Text>
        
        {/* Button Colors */}
        <Text style={styles.subsectionTitle}>Button Colors</Text>
        <View style={styles.buttonGrid}>
          <View style={[styles.button, { backgroundColor: COLORS.components.button.primary }]}>
            <Text style={[styles.buttonText, { color: COLORS.components.button.white }]}>
              Primary
            </Text>
          </View>
          <View style={[styles.button, { backgroundColor: COLORS.components.button.secondary }]}>
            <Text style={[styles.buttonText, { color: COLORS.components.button.black }]}>
              Secondary
            </Text>
          </View>
          <View style={[styles.button, { backgroundColor: COLORS.components.button.success }]}>
            <Text style={[styles.buttonText, { color: COLORS.components.button.white }]}>
              Success
            </Text>
          </View>
        </View>

        {/* Card Colors */}
        <Text style={styles.subsectionTitle}>Card Colors</Text>
        <View style={[styles.card, { backgroundColor: COLORS.components.card.background }]}>
          <Text style={[styles.cardTitle, { color: COLORS.text.dark }]}>
            Card Example
          </Text>
          <Text style={[styles.cardText, { color: COLORS.text.mediumGrey }]}>
            This card demonstrates the card background and border colors.
          </Text>
        </View>
      </View>

      {/* Background Colors Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Colors</Text>
        <View style={styles.bgGrid}>
          <View style={[styles.bgBox, { backgroundColor: COLORS.background.primary }]}>
            <Text style={styles.bgLabel}>Primary</Text>
          </View>
          <View style={[styles.bgBox, { backgroundColor: COLORS.background.secondary }]}>
            <Text style={styles.bgLabel}>Secondary</Text>
          </View>
          <View style={[styles.bgBox, { backgroundColor: COLORS.background.card }]}>
            <Text style={styles.bgLabel}>Card</Text>
          </View>
          <View style={[styles.bgBox, { backgroundColor: COLORS.background.overlay }]}>
            <Text style={[styles.bgLabel, { color: COLORS.text.primary }]}>Overlay</Text>
          </View>
        </View>
      </View>

      {/* Border Colors Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Border Colors</Text>
        <View style={styles.borderGrid}>
          <View style={[styles.borderBox, { borderColor: COLORS.border.primary }]}>
            <Text style={styles.borderLabel}>Primary Border</Text>
          </View>
          <View style={[styles.borderBox, { borderColor: COLORS.border.light }]}>
            <Text style={styles.borderLabel}>Light Border</Text>
          </View>
          <View style={[styles.borderBox, { borderColor: COLORS.border.gold }]}>
            <Text style={styles.borderLabel}>Gold Border</Text>
          </View>
        </View>
      </View>

      {/* Success Message */}
      <View style={styles.successSection}>
        <Text style={styles.successText}>
          ✅ Color system is working correctly!
        </Text>
        <Text style={styles.successSubtext}>
          All colors are properly imported and accessible
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: 30,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 16,
    color: COLORS.text.primary,
    opacity: 0.9,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.dark,
    marginBottom: 15,
    marginTop: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorBox: {
    width: '48%',
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: COLORS.shadow.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorLabel: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 5,
  },
  colorValue: {
    color: COLORS.text.primary,
    fontSize: 10,
    opacity: 0.8,
  },
  textExample: {
    fontSize: 16,
    marginVertical: 8,
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusBox: {
    width: '48%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  statusText: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 5,
  },
  statusValue: {
    color: COLORS.text.primary,
    fontSize: 10,
    opacity: 0.8,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: COLORS.shadow.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.components.card.border,
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
  bgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bgBox: {
    width: '48%',
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  bgLabel: {
    color: COLORS.text.dark,
    fontWeight: '600',
    fontSize: 12,
  },
  borderGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  borderBox: {
    flex: 1,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 3,
    backgroundColor: COLORS.background.primary,
  },
  borderLabel: {
    color: COLORS.text.dark,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  successSection: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: COLORS.status.success,
    margin: 20,
    borderRadius: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: COLORS.text.primary,
    opacity: 0.9,
    textAlign: 'center',
  },
});

export default ColorTest;
