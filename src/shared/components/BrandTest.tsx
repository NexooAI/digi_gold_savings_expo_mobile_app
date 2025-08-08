import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { brandConfig, brandTheme, brandAssets, isFeatureEnabled } from '../../core/config/BrandConfig';

const BrandTest: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Brand Configuration Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <Text style={styles.info}>App Name: {brandConfig.appName}</Text>
        <Text style={styles.info}>App Slug: {brandConfig.appSlug}</Text>
        <Text style={styles.info}>Version: {brandConfig.version}</Text>
        <Text style={styles.info}>Package: {brandConfig.androidPackage}</Text>
        <Text style={styles.info}>Bundle ID: {brandConfig.iosBundleId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Information</Text>
        <Text style={styles.info}>Name: {brandConfig.company.name}</Text>
        <Text style={styles.info}>Address: {brandConfig.company.address}</Text>
        <Text style={styles.info}>Mobile: {brandConfig.company.mobile}</Text>
        <Text style={styles.info}>Email: {brandConfig.company.email}</Text>
        <Text style={styles.info}>Website: {brandConfig.company.website}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        <Text style={styles.info}>Base URL: {brandConfig.baseUrl}</Text>
        <Text style={styles.info}>YouTube URL: {brandConfig.youtubeUrl}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme Colors</Text>
        <View style={[styles.colorBox, { backgroundColor: brandTheme.colors.primary }]}>
          <Text style={styles.colorText}>Primary: {brandTheme.colors.primary}</Text>
        </View>
        <View style={[styles.colorBox, { backgroundColor: brandTheme.colors.secondary }]}>
          <Text style={styles.colorText}>Secondary: {brandTheme.colors.secondary}</Text>
        </View>
        <View style={[styles.colorBox, { backgroundColor: brandTheme.colors.background }]}>
          <Text style={styles.colorText}>Background: {brandTheme.colors.background}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feature Flags</Text>
        <Text style={styles.info}>Gold Advance: {isFeatureEnabled('enableGoldAdvance') ? '✅' : '❌'}</Text>
        <Text style={styles.info}>Savings: {isFeatureEnabled('enableSavings') ? '✅' : '❌'}</Text>
        <Text style={styles.info}>Live Rates: {isFeatureEnabled('enableLiveRates') ? '✅' : '❌'}</Text>
        <Text style={styles.info}>Store Locator: {isFeatureEnabled('enableStoreLocator') ? '✅' : '❌'}</Text>
        <Text style={styles.info}>Notifications: {isFeatureEnabled('enableNotifications') ? '✅' : '❌'}</Text>
        <Text style={styles.info}>Multi Language: {isFeatureEnabled('enableMultiLanguage') ? '✅' : '❌'}</Text>
        <Text style={styles.info}>Biometric Auth: {isFeatureEnabled('enableBiometricAuth') ? '✅' : '❌'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Configuration</Text>
        <Text style={styles.info}>Gateway: {brandConfig.payment.gateway}</Text>
        <Text style={styles.info}>Currency: {brandConfig.payment.currency}</Text>
        <Text style={styles.info}>Methods: {brandConfig.payment.supportedMethods.join(', ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Media</Text>
        <Text style={styles.info}>Facebook: {brandConfig.socialMedia.facebook}</Text>
        <Text style={styles.info}>Instagram: {brandConfig.socialMedia.instagram}</Text>
        <Text style={styles.info}>YouTube: {brandConfig.socialMedia.youtube}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  info: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  colorBox: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
  },
  colorText: {
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default BrandTest; 