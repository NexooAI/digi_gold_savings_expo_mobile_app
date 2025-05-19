import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from 'react-native-size-matters';
import { theme } from '@/constants/theme';
import { rates } from '@/app/services/api';

const { width } = Dimensions.get('window');

export default function LiveRates() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState('1W'); // 1D, 1W, 1M, 1Y
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [currentRate, setCurrentRate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Periods for the filter buttons
  const periods = [
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '1Y', value: '1Y' },
  ];

  useEffect(() => {
    fetchRateHistory();
  }, [selectedPeriod]);

  const fetchRateHistory = async () => {
    setLoading(true);
    try {
      // Here you would normally fetch historical data based on the period
      // For now, we'll generate mock data
      const mockData = generateMockData(selectedPeriod);
      setChartData(mockData);
      
      // Fetch current rate
      const response = await rates.getLiveRates();
      if (response.data?.data) {
        setCurrentRate(type === 'Gold' ? 
          response.data.data.gold_rate : 
          response.data.data.silver_rate
        );
      }
    } catch (error) {
      console.error('Error fetching rate history:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (period) => {
    const numberOfPoints = {
      '1D': 24,
      '1W': 7,
      '1M': 30,
      '1Y': 12
    }[period];

    const basePrice = type === 'Gold' ? 7000 : 100;
    const variance = type === 'Gold' ? 200 : 5;

    const data = Array.from({ length: numberOfPoints }, () => 
      basePrice + (Math.random() - 0.5) * variance
    );

    const labels = Array.from({ length: numberOfPoints }, (_, i) => {
      switch (period) {
        case '1D': return `${i}h`;
        case '1W': return `D${i + 1}`;
        case '1M': return `${i + 1}`;
        case '1Y': return `M${i + 1}`;
        default: return '';
      }
    });

    return {
      labels,
      datasets: [{ data }]
    };
  };

  const formatPrice = (price) => {
    return `₹${typeof price === 'number' ? price.toFixed(2) : price}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#5a000b', '#2e0406']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{type} Rate History</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Current Rate Card */}
          <View style={styles.rateCard}>
            <Text style={styles.rateLabel}>Current {type} Rate</Text>
            <Text style={styles.rateValue}>{formatPrice(currentRate)}</Text>
            <Text style={styles.rateUnit}>per gram</Text>
          </View>

          {/* Period Filter */}
          <View style={styles.periodFilter}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.value && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.value)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={width - 32}
              height={220}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: 6,
                  strokeWidth: 2,
                  stroke: '#D4AF37'
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>24h High</Text>
              <Text style={styles.statValue}>{formatPrice(currentRate * 1.05)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>24h Low</Text>
              <Text style={styles.statValue}>{formatPrice(currentRate * 0.95)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>24h Change</Text>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>+2.5%</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: moderateScale(40),
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    color: '#fff',
    fontSize: moderateScale(20),
    fontWeight: '600',
    marginLeft: moderateScale(16),
  },
  content: {
    flex: 1,
    padding: moderateScale(16),
  },
  rateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  rateLabel: {
    color: '#fff',
    fontSize: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  rateValue: {
    color: '#D4AF37',
    fontSize: moderateScale(32),
    fontWeight: 'bold',
    marginBottom: moderateScale(4),
  },
  rateUnit: {
    color: '#888',
    fontSize: moderateScale(14),
  },
  periodFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(20),
  },
  periodButton: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  periodButtonActive: {
    backgroundColor: '#D4AF37',
  },
  periodButtonText: {
    color: '#fff',
    fontSize: moderateScale(14),
  },
  periodButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },
  chart: {
    borderRadius: moderateScale(16),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#888',
    fontSize: moderateScale(14),
    marginBottom: moderateScale(4),
  },
  statValue: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
}); 