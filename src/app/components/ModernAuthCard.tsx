import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface ModernAuthCardProps {
  activeTab: 'login' | 'register';
  onTabChange: (tab: 'login' | 'register') => void;
  children?: React.ReactNode;
}

const ModernAuthCard: React.FC<ModernAuthCardProps> = ({ activeTab, onTabChange, children }) => {
  return (
    <View style={styles.card}>
      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => onTabChange('login')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>Login</Text>
          {activeTab === 'login' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <View style={styles.tabDivider} />
        <TouchableOpacity onPress={() => onTabChange('register')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>Register</Text>
          {activeTab === 'register' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>
      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default ModernAuthCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f1a2a',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 370,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    marginTop: 40,
    borderColor: '#1e3a5f',
    borderWidth: 2,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 8,
  },
  tabText: {
    fontSize: 18,
    color: '#a0b4cc',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffd700',
    fontWeight: '700',
  },
  tabUnderline: {
    height: 3,
    backgroundColor: '#ffd700',
    borderRadius: 2,
    marginTop: 4,
    width: 40,
    alignSelf: 'center',
  },
  tabDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2a4a7a',
    marginHorizontal: 8,
  },
  content: {
    marginTop: 8,
  },
  cardTitle: {
    color: '#1a2a39',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardSubtitle: {
    color: '#4A4A4A',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    opacity: 0.85,
  },
  cardLink: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
}); 