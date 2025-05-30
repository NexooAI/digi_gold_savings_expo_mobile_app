import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator, LogBox } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from 'react-native-size-matters';
import { theme } from '@/constants/theme';
import { rates } from '@/services/api';

const { width } = Dimensions.get('window');

// Type definitions
interface RateData {
  date: string;
  time: string;
  price: number;
}

interface RateHistoryResponse {
  status: string;
  data: {
    gold: RateData[];
    silver: RateData[];
  };
}

// Dummy data structure
const dummyData: RateHistoryResponse = {
  "status": "success",
  "data": {
    "gold": [
      { "date": "01-03-2025", "time": "5:43 AM", "price": 84212 },
      { "date": "28-03-2025", "time": "5:43 AM", "price": 89028 },
      { "date": "31-03-2025", "time": "5:43 AM", "price": 90134 },
      { "date": "21-05-2025", "time": "5:43 AM", "price": 93000 },
      { "date": "28-05-2025", "time": "5:43 AM", "price": 98000 },
      { "date": "29-05-2025", "time": "5:43 AM", "price": 97404 }
    ],
    "silver": [
      { "date": "01-03-2025", "time": "5:43 AM", "price": 97000 },
      { "date": "28-03-2025", "time": "5:43 AM", "price": 114000 },
      { "date": "31-03-2025", "time": "5:43 AM", "price": 113000 },
      { "date": "26-04-2025", "time": "5:43 AM", "price": 112000 },
      { "date": "30-04-2025", "time": "5:43 AM", "price": 111000 },
      { "date": "22-05-2025", "time": "5:43 AM", "price": 98492 },
      { "date": "29-05-2025", "time": "5:43 AM", "price": 99900 }
    ]
  }
};

// Helper function to filter data based on period
const filterDataByPeriod = (data: RateData[], period: '1D' | '1W' | '1M' | '1Y'): RateData[] => {
  const now = new Date();
  const filteredData: RateData[] = [];

  data.forEach(item => {
    const itemDate = new Date(item.date.split('-').reverse().join('-'));
    const diffTime = Math.abs(now.getTime() - itemDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (period) {
      case '1D':
        if (diffDays <= 1) filteredData.push(item);
        break;
      case '1W':
        if (diffDays <= 7) filteredData.push(item);
        break;
      case '1M':
        if (diffDays <= 30) filteredData.push(item);
        break;
      case '1Y':
        if (diffDays <= 365) filteredData.push(item);
        break;
    }
  });

  // Sort by date
  return filteredData.sort((a, b) => {
    const dateA = new Date(a.date.split('-').reverse().join('-'));
    const dateB = new Date(b.date.split('-').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });
};

export default function LiveRates() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Safely handle params - ensure we have a valid metalType even if params are corrupted
  const getInitialType = (): 'Gold' | 'Silver' => {
    try {
      const typeParam = params.type;
      if (typeof typeParam === 'string') {
        const normalizedType = typeParam.trim();
        if (normalizedType === 'Gold' || normalizedType === 'Silver') {
          return normalizedType as 'Gold' | 'Silver';
        }
      }
      return 'Gold'; // Default fallback
    } catch (e) {
      console.error('Error parsing type parameter:', e);
      return 'Gold';
    }
  };
  
  // State variables
  const [metalType, setMetalType] = useState<'Gold' | 'Silver'>(getInitialType());
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '1W' | '1M' | '1Y'>('1W');
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { data: number[] }[];
  }>({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartStatistics, setChartStatistics] = useState({
    high: 0,
    low: 0,
    change: 0
  });

  // Periods for the filter buttons
  const periods: { label: string; value: '1D' | '1W' | '1M' | '1Y' }[] = [
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '1Y', value: '1Y' },
  ];

  // Ignore specific warnings related to charts and navigation
  useEffect(() => {
    LogBox.ignoreLogs([
      'ViewManagerResolver',
      'RCTRNSVGRect',
      'Failed prop type',
      'UIFrameGuarded',
      'RNSVG',
      'NativeEventEmitter'
    ]);
    
    // Force immediate render to avoid chart initialization issues
    setChartLoading(true);
    setTimeout(() => {
      setChartLoading(false);
    }, 500);
  }, []);
  
  // Effect to fetch rate history when period or metal type changes
  useEffect(() => {
    fetchRateHistory();
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Cancel any pending state updates
      setChartData({
        labels: [],
        datasets: [{ data: [] }]
      });
    };
  }, [selectedPeriod, metalType]);

  // Function to fetch rate history
  const fetchRateHistory = async () => {
    setChartLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await rates.getRateHistory();
      const response = { data: dummyData };
      
      if (response.data?.data) {
        const metalData = response.data.data[metalType.toLowerCase() as keyof typeof response.data.data];
        if (metalData && metalData.length > 0) {
          // Filter data based on selected period
          const filteredData = filterDataByPeriod(metalData, selectedPeriod);
          
          // Format data for chart
          const formattedData = {
            labels: filteredData.map(item => item.date),
            datasets: [{
              data: filteredData.map(item => item.price)
            }]
          };
          
          // Calculate statistics
          const prices = filteredData.map(item => item.price);
          const high = Math.max(...prices);
          const low = Math.min(...prices);
          const change = ((prices[prices.length - 1] - prices[0]) / prices[0] * 100).toFixed(2);
          
          setChartData(formattedData);
          setChartStatistics({
            high,
            low,
            change: parseFloat(change)
          });
          
          // Set current rate
          setCurrentRate(prices[prices.length - 1]);
        }
      }
    } catch (error) {
      console.error('Error fetching rate history:', error);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };
  
  // Function to handle metal type change
  const handleMetalTypeChange = (newType: 'Gold' | 'Silver') => {
    setMetalType(newType);
  };

  // Generate mock historical price data with realistic patterns
  const generateMockData = useCallback((period: '1D' | '1W' | '1M' | '1Y'): { labels: string[], datasets: { data: number[] }[] } => {
    try {
    // Number of data points based on selected period
    const numberOfPoints = {
      '1D': 24,  // Hourly for a day
      '1W': 7,   // Daily for a week
      '1M': 30,  // Daily for a month
      '1Y': 12   // Monthly for a year
    }[period];

    // Base prices and parameters based on metal type
    const config = {
      Gold: {
        basePrice: 7200,      // Starting price in INR
        variance: 150,        // Random variance magnitude
        volatility: 0.03,     // Volatility factor (0.03 = 3%)
        trendFactor: 0.002,   // Small upward trend
        minPrice: 6800,       // Floor price
        maxPrice: 7600        // Ceiling price
      },
      Silver: {
        basePrice: 98,        // Starting price in INR
        variance: 4,          // Random variance magnitude
        volatility: 0.04,     // Volatility factor (0.04 = 4%)
        trendFactor: 0.001,   // Small upward trend
        minPrice: 90,         // Floor price
        maxPrice: 110         // Ceiling price
      }
    }[metalType];

    // Random seed to ensure same pattern across renders for the same parameters
    const seed = metalType + period + '2025';
    const seededRandom = () => {
      const x = Math.sin(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) * 10000;
      return x - Math.floor(x);
    };

    // Generate data with realistic patterns
    let lastValue = config.basePrice;
    const data = [];
    
    // Create a small sine wave pattern for natural looking price movements
    for (let i = 0; i < numberOfPoints; i++) {
      // Apply random walk with the following components:
      // 1. Small random noise
      const noise = (seededRandom() * 2 - 1) * config.variance * config.volatility;
      
      // 2. Trend component (slightly upward for both gold and silver)
      const trend = config.basePrice * config.trendFactor * i;
      
      // 3. Cyclical component (sine wave pattern)
      const cycle = Math.sin(i / (numberOfPoints / 3)) * (config.variance / 3);
      
      // 4. Occasional price jumps (for realism)
      const jump = (i % Math.floor(numberOfPoints / 3) === 0) ? 
                    (seededRandom() > 0.7 ? config.variance * 0.8 : 0) : 0;
      
      // Combine all components
      lastValue = lastValue + noise + cycle + (i > 0 ? trend/numberOfPoints : 0) + jump;
      
      // Ensure prices stay within reasonable bounds
      lastValue = Math.max(config.minPrice, Math.min(config.maxPrice, lastValue));
      
      // Round to 2 decimal places
      data.push(parseFloat(lastValue.toFixed(2)));
    }

    // Generate appropriate date labels based on selected period
    const today = new Date();
    const labels = Array.from({ length: numberOfPoints }, (_, i) => {
      const date = new Date(today);
      switch (period) {
        case '1D': 
          date.setHours(date.getHours() - (numberOfPoints - i - 1));
          return `${date.getHours()}:00`;
          
        case '1W': 
          date.setDate(date.getDate() - (numberOfPoints - i - 1));
          return `${date.getDate()}/${date.getMonth() + 1}`;
          
        case '1M': 
          date.setDate(date.getDate() - (numberOfPoints - i - 1));
          // Format as DD/MM
          return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          
        case '1Y': 
          date.setMonth(date.getMonth() - (numberOfPoints - i - 1));
          return `${date.toLocaleString('default', { month: 'short' })}`;
          
        default: 
          return '';
      }
    });

    // Add simulated high and low data points for statistics display
    const highPrice = Math.max(...data);
    const lowPrice = Math.min(...data);
    const startPrice = data[0];
    const endPrice = data[data.length - 1];
    const percentChange = ((endPrice - startPrice) / startPrice * 100).toFixed(2);
    
    // Update statistics without using setTimeout to prevent memory leaks
    setChartStatistics({
      high: highPrice,
      low: lowPrice,
      change: parseFloat(percentChange)
    });
    
    return {
      labels,
      datasets: [{ data }]
    };
    } catch (error) {
      console.error('Error generating chart data:', error);
      // Return empty data on error
      return {
        labels: period === '1D' ? ['00:00', '23:00'] : period === '1Y' ? ['Jan', 'Dec'] : ['1', '7'],
        datasets: [{ data: [0, 0] }]
      };
    }
  }, [metalType]);

  const formatPrice = (price: number | null) => {
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
          <Text style={styles.headerTitle}>{metalType} Rate History</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Metal Type Selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, metalType === 'Gold' && styles.typeButtonActive]}
              onPress={() => handleMetalTypeChange('Gold')}
            >
              <Text style={[styles.typeButtonText, metalType === 'Gold' && styles.typeButtonTextActive]}>Gold</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, metalType === 'Silver' && styles.typeButtonActive]}
              onPress={() => handleMetalTypeChange('Silver')}
            >
              <Text style={[styles.typeButtonText, metalType === 'Silver' && styles.typeButtonTextActive]}>Silver</Text>
            </TouchableOpacity>
          </View>

          {/* Current Rate Card */}
          <View style={styles.rateCard}>
            <Text style={styles.rateLabel}>Current {metalType} Rate</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#D4AF37" />
            ) : (
              <>
                <Text style={styles.rateValue}>{formatPrice(currentRate)}</Text>
                <Text style={styles.rateUnit}>per gram</Text>
              </>
            )}
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

          {/* Chart Section */}
          <View style={styles.chartContainer}>
            {chartLoading ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={styles.chartLoadingText}>Loading chart data...</Text>
              </View>
            ) : (
              <View style={styles.chartWrapper}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>{metalType} Price Trend</Text>
                  <Text style={styles.chartSubtitle}>{selectedPeriod} view</Text>
                </View>
                
                {chartData.labels.length > 0 && (
                  <View style={styles.customChart}>
                    {/* Y-axis labels */}
                    <View style={styles.yAxisLabels}>
                      <Text style={styles.axisLabel}>₹{chartStatistics.high.toFixed(0)}</Text>
                      <Text style={styles.axisLabel}>₹{((chartStatistics.high + chartStatistics.low) / 2).toFixed(0)}</Text>
                      <Text style={styles.axisLabel}>₹{chartStatistics.low.toFixed(0)}</Text>
                    </View>
                    
                    {/* Bars */}
                    <View style={styles.barsContainer}>
                      {chartData.datasets[0].data.map((value, index) => {
                        const percentage = (value - chartStatistics.low) / (chartStatistics.high - chartStatistics.low);
                        return (
                          <View key={index} style={styles.barWrapper}>
                            <Text style={styles.barValue}>₹{value.toFixed(2)}</Text>
                            <View style={styles.barContainer}>
                              <LinearGradient
                                colors={metalType === 'Gold' ? 
                                  ['rgba(212, 175, 55, 0.8)', 'rgba(212, 175, 55, 0.3)'] : 
                                  ['rgba(192, 192, 192, 0.8)', 'rgba(192, 192, 192, 0.3)']}
                                style={[styles.bar, { height: `${percentage * 100}%` }]}
                                start={{ x: 0, y: 1 }}
                                end={{ x: 0, y: 0 }}
                              />
                            </View>
                            <Text style={styles.barLabel}>{chartData.labels[index]}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
          
          {/* Chart Description */}
          <View style={styles.chartDescription}>
            <Text style={styles.chartDescriptionText}>
              {selectedPeriod === '1D' ? 'Hourly' : 
               selectedPeriod === '1W' ? 'Daily' : 
               selectedPeriod === '1M' ? 'Daily' : 'Monthly'} price changes for {metalType.toLowerCase()}
            </Text>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{selectedPeriod} High</Text>
              <Text style={styles.statValue}>{formatPrice(chartStatistics.high)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{selectedPeriod} Low</Text>
              <Text style={styles.statValue}>{formatPrice(chartStatistics.low)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{selectedPeriod} Change</Text>
              <Text 
                style={[styles.statValue, { 
                  color: chartStatistics.change >= 0 ? '#4CAF50' : '#FF5252' 
                }]}
              >
                {chartStatistics.change >= 0 ? '+' : ''}{chartStatistics.change}%
              </Text>
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
    paddingHorizontal: moderateScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(16),
    padding: moderateScale(8),
  },
  periodButton: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: moderateScale(60),
    alignItems: 'center',
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
    minHeight: moderateScale(300),
  },
  chartWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    flex: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  chartTitle: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  chartSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(12),
  },
  customChart: {
    flexDirection: 'row',
    height: moderateScale(220),
    marginBottom: moderateScale(10),
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: moderateScale(8),
    height: '100%',
    width: moderateScale(60),
  },
  axisLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(10),
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(4),
  },
  barWrapper: {
    alignItems: 'center',
    width: moderateScale(30),
    height: '100%',
    justifyContent: 'space-between',
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginVertical: moderateScale(4),
  },
  bar: {
    width: moderateScale(22),
    borderRadius: moderateScale(4),
  },
  barValue: {
    color: '#fff',
    fontSize: moderateScale(10),
    textAlign: 'center',
    marginBottom: moderateScale(4),
  },
  barLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(10),
    textAlign: 'center',
    marginTop: moderateScale(4),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginTop: moderateScale(10),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: moderateScale(20),
  },
  typeButton: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: moderateScale(8),
    minWidth: moderateScale(100),
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#D4AF37',
  },
  typeButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  chartLoading: {
    height: moderateScale(220),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    color: '#fff',
    marginTop: moderateScale(8),
  },
  chartDescription: {
    alignItems: 'center',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(16),
  },
  chartDescriptionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(12),
  },
});