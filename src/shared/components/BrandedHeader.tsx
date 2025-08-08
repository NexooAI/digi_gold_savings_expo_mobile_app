import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { brandConfig, brandTheme, brandAssets } from '../../core/config/BrandConfig';

interface BrandedHeaderProps {
  title?: string;
  showLogo?: boolean;
  showCompanyInfo?: boolean;
}

const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  title,
  showLogo = true,
  showCompanyInfo = false,
}) => {
  const companyInfo = brandConfig.company;
  const colors = brandTheme.colors;
  const logo = brandAssets.icons.transparentLogo;

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
      )}
      
      {title && (
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
      )}
      
      {showCompanyInfo && (
        <View style={styles.companyInfo}>
          <Text style={[styles.companyName, { color: colors.textPrimary }]}>
            {companyInfo.name}
          </Text>
          <Text style={[styles.companyAddress, { color: colors.textLight }]}>
            {companyInfo.address}
          </Text>
          <Text style={[styles.companyContact, { color: colors.textLight }]}>
            {companyInfo.mobile} | {companyInfo.email}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  companyInfo: {
    alignItems: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 2,
  },
  companyContact: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default BrandedHeader; 