import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  AkilaJewellersScreen, 
  DCJewellersScreen, 
  SrimuruganScreen,
  BrandConfigs 
} from './index';

export default function TestPaymentScreen() {
  const [selectedBrand, setSelectedBrand] = useState(null);
  const router = useRouter();

  const brands = [
    { name: 'AkilaJewellers', component: AkilaJewellersScreen, color: '#007AFF' },
    { name: 'DCJewellers', component: DCJewellersScreen, color: '#34C759' },
    { name: 'Srimurugan', component: SrimuruganScreen, color: '#FF9500' }
  ];

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    console.log(`Selected brand: ${brand.name}`);
    console.log(`Brand config:`, BrandConfigs[brand.name]);
  };

  const handleTestPayment = () => {
    if (!selectedBrand) {
      Alert.alert('Select Brand', 'Please select a brand first');
      return;
    }

    Alert.alert(
      'Test Payment',
      `Testing payment for ${selectedBrand.name}\n\nThis will:\n1. Call the brand's API\n2. Create a payment\n3. Open PaymentWebView\n4. Listen for payment status\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test Payment', 
          onPress: () => {
            console.log(`Starting payment test for ${selectedBrand.name}`);
            // The actual payment test will happen in the brand screen
          }
        }
      ]
    );
  };

  const renderBrandScreen = () => {
    if (!selectedBrand) return null;
    
    const BrandComponent = selectedBrand.component;
    return <BrandComponent />;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Brands Test</Text>
      <Text style={styles.subtitle}>Select a brand to test payment functionality</Text>

      <ScrollView style={styles.brandList}>
        {brands.map((brand) => (
          <TouchableOpacity
            key={brand.name}
            style={[
              styles.brandButton,
              { backgroundColor: brand.color },
              selectedBrand?.name === brand.name && styles.selectedBrand
            ]}
            onPress={() => handleBrandSelect(brand)}
          >
            <Text style={styles.brandButtonText}>{brand.name}</Text>
            {selectedBrand?.name === brand.name && (
              <Text style={styles.selectedText}>✓ Selected</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedBrand && (
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Test Payment for {selectedBrand.name}</Text>
          <Text style={styles.configInfo}>
            API: {BrandConfigs[selectedBrand.name]?.apiEndpoint}
          </Text>
          <Text style={styles.configInfo}>
            Payment URL: {BrandConfigs[selectedBrand.name]?.basePaymentUrl}
          </Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: selectedBrand.color }]}
            onPress={handleTestPayment}
          >
            <Text style={styles.testButtonText}>Test Pay Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedBrand && (
        <View style={styles.brandScreenContainer}>
          {renderBrandScreen()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666'
  },
  brandList: {
    marginBottom: 20
  },
  brandButton: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: 'center'
  },
  selectedBrand: {
    borderWidth: 3,
    borderColor: '#fff'
  },
  brandButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  selectedText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5
  },
  testSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  configInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  testButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15
  },
  testButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  brandScreenContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden'
  }
}); 