import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/app/components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function GoldAdvanceScreen() {
  const router = useRouter();

  const advanceOptions = [
    {
      percentage: '5%',
      days: 30,
      color: '#FF6B6B', // Red corner
      minPayment: '5%',
    },
    {
      percentage: '10%',
      days: 60,
      color: '#4ECB71', // Green corner
      minPayment: '10%',
    },
    {
      percentage: '20%',
      days: 90,
      color: '#FFD93D', // Yellow corner
      minPayment: '20%',
    },
    {
      percentage: '30%',
      days: 120,
      color: '#4A90E2', // Blue corner
      minPayment: '30%',
    },
  ];

  const handleEnquire = (option: typeof advanceOptions[0]) => {
    // Handle enquiry logic here
    Alert.alert(
      'Under Maintenance',
      'This feature is currently under maintenance. Please check back later.',
      [{ text: 'OK' }],
    );
    console.log('Enquiring about:', option);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.headerWrapper}>
        <AppHeader showBackButton={false} backRoute="index" />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Book your gold in advance and secure today's rate
        </Text>

        <View style={styles.cardsContainer}>
          {advanceOptions.map((option, index) => (
            <View key={index} style={styles.cardWrapper}>
              <LinearGradient
                colors={['#fffbe6', '#f7e9c4']}
                style={styles.cardHeader}
              >
                <View style={[styles.cornerTag, { backgroundColor: option.color }]}>
                  <Text style={styles.cornerText}>
                    <Ionicons name="calendar" size={12} color="#fff" /> {option.days} DAYS
                  </Text>
                </View>
                <View style={styles.iconRow}>
                  <Ionicons name="diamond" size={28} color="#C69749" style={{ marginRight: 8 }} />
                  <Text style={styles.percentageText}>{option.percentage}</Text>
                </View>
              </LinearGradient>

              <View style={styles.cardBody}>
                <Text style={styles.cardText}>
                  <Ionicons name="wallet" size={16} color="#C69749" /> Pay Minimum {option.minPayment}
                </Text>
                <Text style={styles.cardText}>
                  <Ionicons name="time" size={16} color="#C69749" /> Get {option.days} days of advance period
                </Text>
                <Text style={styles.rateText}>
                  Avail the rate of Gold at the time of booking or at the purchase, whichever is less
                </Text>

                <TouchableOpacity
                  style={styles.enquireButton}
                  onPress={() => handleEnquire(option)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#C69749', '#E7B872']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonText}>ENQUIRE NOW</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 100, // Ensure content appears below the header
    paddingBottom: 180,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  cardsContainer: {
    gap: 20,
  },
  cardWrapper: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#C69749',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E7B872',
    marginBottom: 18,
  },
  cardHeader: {
    padding: 16,
    position: 'relative',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cornerTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    zIndex: 1,
    elevation: 2,
  },
  cornerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#C69749',
    textAlign: 'center',
    fontFamily: 'serif',
    textShadowColor: '#E7B872',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardBody: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  cardText: {
    fontSize: 16,
    color: '#2C1810',
    marginBottom: 8,
    textAlign: 'center',
  },
  rateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  enquireButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
}); 