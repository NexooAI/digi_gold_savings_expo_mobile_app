import React, { useState, useEffect, useRef, useMemo, useCallback} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
  PanResponder,
  ScrollView,
  ImageBackground,
  Image,
  Alert,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { rgbaColor } from "react-native-reanimated/lib/typescript/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const TAB_WIDTH = width / 4;

interface Scheme {
  SCHEMEID: number;
  SCHEMENAME: string;
  DESCRIPTION: string;
  BENEFITS?: string[];
  SCHEMETYPE: string;
  SLOGAN?: string;
  IMAGE?: string;
  ICON?: string;
  DURATION_MONTHS?: number;
  FIXED?: string;
  ACTIVE: string;
  chits: Array<{
    CHITID: number;
    AMOUNT: string;
    NOINS?: number;
    TOTALMEMBERS?: number;
    PAYMENT_FREQUENCY?: string;
    ACTIVE?: string;
    REGNO?: string;
    PAYMENT_FREQUENCY_ID?: string;
  }>;
  branch?: Array<{
    branchId: number;
    branchName: string;
    branchAddress: string;
    branchCity: string;
    branchState: string;
    branchPhone: string;
  }>;
  relevantChits?: Array<{
    CHITID: number;
    AMOUNT: number;
  }>;
}

// Default scheme category if not specified
const DEFAULT_SCHEME_TYPE = "Monthly";

export default function SchemeList() {
  const [activeTab, setActiveTab] = useState<string>("");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const router = useRouter();
  const { language } = useGlobalStore();
  const underlineAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [tabLayouts, setTabLayouts] = useState<{
    [key: string]: { x: number; width: number };
  }>({});
  
  // Dynamic tabs based on available schemes
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  
  // Pan responder state
  const [currentPanResponder, setCurrentPanResponder] = useState<ReturnType<typeof PanResponder.create> | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [descModalVisible, setDescModalVisible] = useState(false);
  const [descModalText, setDescModalText] = useState("");

  // Function to determine available tab types from schemes data
  const getAvailableTabTypes = useCallback((schemesData: Scheme[]): string[] => {
    if (!schemesData || schemesData.length === 0) return [];
    
    const tabTypes = new Set<string>();
    
    schemesData.forEach((scheme) => {
      if (scheme.ACTIVE === "Y" && scheme.chits && scheme.chits.length > 0) {
        scheme.chits.forEach((chit) => {
          if (chit.PAYMENT_FREQUENCY && chit.ACTIVE === "Y") {
            tabTypes.add(chit.PAYMENT_FREQUENCY);
          }
        });
      }
    });
    
    // Convert to array and sort for consistent order
    return Array.from(tabTypes).sort((a, b) => {
      const order = { "Daily": 1, "Weekly": 2, "Monthly": 3, "Flexi": 4 };
      return (order[a as keyof typeof order] || 999) - (order[b as keyof typeof order] || 999);
    });
  }, []);

  // Memoize the filtered schemes to prevent unnecessary recalculations
  const filteredSchemes = useMemo(() => {
    if (!allSchemes.length || !activeTab) return [];

    // Create buckets for each frequency
    const buckets: { [key: string]: any[] } = {};

    // Process all schemes and their chits
    allSchemes.forEach((scheme: Scheme) => {
      if (scheme.ACTIVE !== "Y") return;

      // Get the relevant chits for the current frequency
      const relevantChits =
        scheme.chits?.filter(
          (chit) =>
            (chit.PAYMENT_FREQUENCY || "").toLowerCase() ===
            activeTab.toLowerCase()
        ) || [];

      if (relevantChits.length > 0) {
        if (!buckets[activeTab.toLowerCase()]) {
          buckets[activeTab.toLowerCase()] = [];
        }
        
        buckets[activeTab.toLowerCase()].push({
          SCHEMEID: scheme.SCHEMEID,
          SCHEMENAME: scheme.SCHEMENAME,
          DESCRIPTION:
            scheme.DESCRIPTION || t('schemes.defaultDescription'),
          BENEFITS: scheme.BENEFITS || [
            "Competitive rates",
            "Flexible payments",
            "Zero making charges",
            "Free locker facility",
          ],
          SCHEMETYPE: activeTab === "Flexi" ? "Flexi" : "Fixed",
          ACTIVE: scheme.ACTIVE,
          chits: relevantChits,
          relevantChits: relevantChits.map((chit) => ({
            CHITID: chit.CHITID,
            AMOUNT: parseFloat(chit.AMOUNT),
          })),
        });
      }
    });

    return buckets[activeTab.toLowerCase()] || [];
  }, [activeTab, allSchemes]);

  // Update schemes when filteredSchemes changes
  useEffect(() => {
    setSchemes(filteredSchemes);
  }, [filteredSchemes]);

  // Fetch all schemes only once on mount
  useEffect(() => {
    let isMounted = true;

    const fetchAllSchemes = async () => {
      if (!isMounted) return;

      setLoading(true);
      try {
        const response = await api.get(`/schemes`);
        if (isMounted) {
          if (response.data?.data) {
            //console.log('Fetched schemes:', response.data.data);
            setAllSchemes(response.data.data);
          } else {
            console.warn("No schemes data in response");
            setAllSchemes([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching schemes:", error);
          Alert.alert(
            t('schemes.error'),
            t('schemes.failedToFetchSchemes')
          );
          setAllSchemes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllSchemes();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means it runs once on mount

  // Update available tabs and set default active tab when schemes data changes
  useEffect(() => {
    const tabs = getAvailableTabTypes(allSchemes);
    setAvailableTabs(tabs);
    
    // Set the first available tab as active, or empty string if no tabs
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0]);
    } else if (tabs.length === 0) {
      setActiveTab("");
    }
  }, [allSchemes, getAvailableTabTypes, activeTab]);

  // Recreate pan responder when available tabs change
  useEffect(() => {
    if (availableTabs.length > 1) {
      // Recreate pan responder for multiple tabs
      const newPanResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 20;
        },
        onPanResponderRelease: (_, gestureState) => {
          const currentIndex = availableTabs.indexOf(activeTab);

          // Swipe right to left (next tab)
          if (gestureState.dx < -50 && currentIndex < availableTabs.length - 1) {
            handleTabPress(availableTabs[currentIndex + 1]);
          }
          // Swipe left to right (previous tab)
          else if (gestureState.dx > 50 && currentIndex > 0) {
            handleTabPress(availableTabs[currentIndex - 1]);
          }
        },
      });
      
      // Update the pan responder state
      setCurrentPanResponder(newPanResponder);
    } else {
      setCurrentPanResponder(null);
    }
  }, [availableTabs, activeTab]);

  useEffect(() => {
    if (!activeTab || availableTabs.length === 0) return;
    
    // Animate the slide transition when active tab changes
    const currentTabIndex = availableTabs.indexOf(activeTab);
    if (currentTabIndex >= 0) {
      Animated.timing(slideAnim, {
        toValue: currentTabIndex * -width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [activeTab, availableTabs, slideAnim, width]);
  useFocusEffect(
    useCallback(() => {
      useGlobalStore.getState().setHeaderConfig({
        showBackButton: true,
        showMenu: false,
        showLanguageSwitcher: false,
        title: t('schemes.title'),
        backRoute: "/(app)/(tabs)/home",
      });
      return () => useGlobalStore.getState().resetHeaderConfig();
    }, ['Schemes'])
  );

  const handleJoinScheme = async (item: Scheme) => {
    try {
      //console.log('Storing scheme data:', item);

      // Store the complete scheme data
      const schemeDataToStore = {
        schemeId: item.SCHEMEID,
        name: item.SCHEMENAME,
        description: item.DESCRIPTION,
        type: activeTab, // Use the active tab as the type
        chits:
          item.chits.filter((chit) => chit.PAYMENT_FREQUENCY === activeTab) ||
          [],
        schemeType:
          activeTab.toLowerCase() === "flexi" ? "flexi" : "fixed",
        activeTab: activeTab,
        benefits: item.BENEFITS,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        "@current_scheme_data",
        JSON.stringify(schemeDataToStore)
      );

      //console.log('Scheme data stored successfully');

      // Navigate with only the scheme ID
      router.push({
        pathname: "/home/join_savings",
        params: {
          schemeId: item.SCHEMEID.toString(),
        },
      });
    } catch (error) {
      console.error("Error storing scheme data:", error);
      Alert.alert(t('schemes.error'), t('schemes.failedToLoadSchemeData'));
    }
  };

  const handleTabPress = (title: string) => {
    setActiveTab(title);
    if (tabLayouts[title]) {
      Animated.spring(underlineAnim, {
        toValue: tabLayouts[title].x,
        useNativeDriver: true,
      }).start();
    }

    // Scroll to the corresponding section
    const newIndex = availableTabs.indexOf(title);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const getTabColor = (title: string) => {
    // Default color for any tab type
    return "#FFC857";
  };

  const getTabBackground = (title: string): string => {
    return `${theme.colors.primary}15`; // 15% opacity of primary color
  };

  const getCardGradient = (title: string): [string, string, ...string[]] => {
    switch (title) {
      case "Daily":
        return ["rgba(56,0,0,0.6)", "rgba(56,0,0,0.8)"];
      case "Weekly":
        return ["rgba(0,48,44,0.6)", "rgba(0,48,44,0.8)"];
      case "Monthly":
        return ["rgba(44,0,66,0.6)", "rgba(44,0,66,0.8)"];
      case "Flexi":
        return ["rgba(61,40,0,0.6)", "rgba(61,40,0,0.8)"];
      default:
        return ["rgba(21,0,44,0.6)", "rgba(21,0,44,0.8)"];
    }
  };

  // Simplified image function - using one image per scheme type
  const getCardImage = (item: Scheme) => {
    // First check if the scheme has its own image
    if (item.IMAGE && item.IMAGE.startsWith("/uploads/")) {
      // This could be a relative path that needs to be prepended with base URL
      // For now, we'll fallback to our local images
      return getDefaultImageByType(item.SCHEMETYPE || DEFAULT_SCHEME_TYPE);
    }

    return getDefaultImageByType(item.SCHEMETYPE || DEFAULT_SCHEME_TYPE);
  };

  const getDefaultImageByType = (type: string) => {
    switch (type) {
      case "Daily":
        return require("../../../../../assets/images/scheme2.jpg");
      case "Weekly":
        return require("../../../../../assets/images/scheme2.jpg");
      case "Monthly":
        return require("../../../../../assets/images/scheme3.jpg");
      case "Flexi":
        return require("../../../../../assets/images/scheme4.jpg");
      default:
        return require("../../../../../assets/images/scheme1.jpg");
    }
  };

  const getTabIcon = (title: string) => {
    switch (title) {
      case "Daily":
        return "today-outline";
      case "Weekly":
        return "calendar-outline";
      case "Monthly":
        return "moon-outline";
      case "Flexi":
        return "options-outline";
      default:
        return "grid-outline";
    }
  };

  const renderTab = (title: string) => {
    const isActive = activeTab === title;
    const tabColor = getTabColor(title);
    const tabBackground = isActive ? getTabBackground(title) : "transparent";

    return (
      <View
        key={title}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          setTabLayouts((prev) => ({ ...prev, [title]: { x, width } }));
        }}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          onPress={() => handleTabPress(title)}
          style={[styles.tab, { backgroundColor: tabBackground }]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={getTabIcon(title)}
            size={18}
            color={isActive ? tabColor : "#888"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              isActive && styles.activeTabText,
              isActive && { color: tabColor },
            ]}
          >
            {title}
          </Text>
          {isActive && (
            <View
              style={[styles.activeTabIndicator, { backgroundColor: tabColor }]}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const handleToggleExpand = (schemeId: number) => {
    setExpandedCard((prev) => (prev === schemeId ? null : schemeId));
  };

  // Helper to get first 4 lines of a string
  const getShortDescription = (desc: string) => {
    if (!desc) return "";
    const lines = desc.split(/\r?\n/);
    if (lines.length <= 4) return desc;
    return lines.slice(0, 4).join("\n") + "...";
  };

  const renderSchemeItem = ({ item }: { item: Scheme }) => {
    const scaleValue = new Animated.Value(1);
    const tabColor = getTabColor(activeTab);
    const gradientColors = getCardGradient(activeTab);
    //console.log(item);
    return (
      <Animated.View
        style={[
          styles.schemeCard,
          {
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        <View style={styles.cardTouchable}>
          <ImageBackground
            source={getCardImage(item)}
            style={styles.cardBackground}
            imageStyle={styles.backgroundImage}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerTopRow}>
                  <View style={styles.schemeNameContainer}>
                    <Text
                      style={[
                        styles.schemeName,
                        activeTab === "Flexi" && styles.flexiSchemeName,
                      ]}
                    >
                      {item.SCHEMENAME}
                    </Text>
                    {item.SLOGAN && (
                      <Text style={styles.slogan}>{item.SLOGAN}</Text>
                    )}
                  </View>
                  <View style={styles.typePill}>
                    <Text
                      style={[
                        styles.typeText,
                        activeTab === "Flexi" && styles.flexiTypeText,
                      ]}
                    >
                      {activeTab === "Flexi" ? "Flexi" : "Fixed"}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.cardContent}>
            <Text style={styles.schemeDescription} numberOfLines={4} ellipsizeMode="tail">
              {getShortDescription(item.DESCRIPTION)}
            </Text>
            {item.DESCRIPTION && item.DESCRIPTION.split(/\r?\n/).length > 4 && (
              <TouchableOpacity
                style={styles.readMoreBtn}
                onPress={() => {
                  setDescModalText(item.DESCRIPTION);
                  setDescModalVisible(true);
                }}
              >
                <Text style={styles.readMoreText}>{t('schemes.readMore')}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider} />

            <View style={styles.benefitsHeaderRow}>
              <Text style={styles.benefitsTitle}>{t('schemes.keyBenefits')}</Text>
              <TouchableOpacity
                onPress={() => handleToggleExpand(item.SCHEMEID)}
              >
                <Ionicons
                  name={
                    expandedCard === item.SCHEMEID
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
            {expandedCard === item.SCHEMEID && (
              <View style={styles.benefitsContainer}>
                {item.BENEFITS?.map((benefit, index) => (
                  <View
                    style={styles.benefitItem}
                    key={`benefit-${item.SCHEMEID}-${index}`}
                  >
                    <View
                      style={[
                        styles.checkmarkCircle,
                        { backgroundColor: tabColor },
                      ]}
                    >
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>{t('schemes.availablePlans')}:</Text>
              <View style={styles.amountChipsContainer}>
                <Text style={[styles.amountChipText, { color: "#850111" }]}>
                  {t('schemes.amountRange')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleJoinScheme(item)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#850111", "#850111"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinButton}
              >
                <Text style={styles.joinButtonText}>{t('schemes.joinNow')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const TabSlider = () => (
    availableTabs.length > 1 ? (
      <View style={styles.tabSliderContainer}>
        <View style={styles.tabSliderTrack}>
          {availableTabs.map((tab) => (
            <View
              key={`slider-${tab}`}
              style={[
                styles.tabSliderDot,
                activeTab === tab && { backgroundColor: getTabColor(tab) },
              ]}
            />
          ))}
        </View>
      </View>
    ) : null
  );

  return (
    <View style={styles.container} {...(currentPanResponder?.panHandlers || {})}>
      <View style={styles.mainBackground}>
        {/* Only show tabs if there are available schemes */}
        {availableTabs.length > 0 && (
          <View style={styles.tabsContainer}>
            {availableTabs.map((tab) => renderTab(tab))}
          </View>
        )}

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={getTabColor(activeTab || "Monthly")} />
              <Text
                style={[styles.loadingText, { color: getTabColor(activeTab || "Monthly") }]}
              >
                {activeTab ? t('schemes.loading').replace('{category}', activeTab) : t('schemes.loading').replace('{category}', 'schemes')}
              </Text>
            </View>
          ) : availableTabs.length === 0 ? (
            // Show message when no schemes exist
            <View style={styles.emptyContainer}>
              <Ionicons name="sad-outline" size={40} color="#777" />
              <Text style={styles.emptyMessage}>
                {t('schemes.noSchemesAvailable').replace('{category}', 'any')}
              </Text>
            </View>
          ) : !activeTab ? (
            // Show message when no active tab is set
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="#777" />
              <Text style={styles.emptyMessage}>
                {t('schemes.noSchemesAvailable').replace('{category}', 'selected category')}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={schemes}
              renderItem={renderSchemeItem}
              keyExtractor={(item) => item.SCHEMEID.toString()}
              contentContainerStyle={[
                styles.listContainer,
                schemes.length === 0 && styles.emptyListContainer,
              ]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="sad-outline" size={40} color="#777" />
                  <Text style={styles.emptyMessage}>
                    {t('schemes.noSchemesAvailable').replace('{category}', activeTab)}
                  </Text>
                </View>
              }
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={10}
            />
          )}
        </View>

        {/* Only show floating hint if there are tabs */}
        {availableTabs.length > 1 && (
          <View style={styles.floatingHint}>
            <Ionicons name="swap-horizontal" size={16} color="#fff" />
            <Text style={styles.floatingHintText}>{t('schemes.swipeHint')}</Text>
          </View>
        )}
      </View>
      <Modal
        visible={descModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDescModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('schemes.description')}</Text>
              <TouchableOpacity onPress={() => setDescModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fullDescriptionText}>{descModalText}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.border}15`,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 16,
    flex: 1,
    color: "#FFC857",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary,
    position: "relative",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.border}15`,
  },
  tab: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginHorizontal: 4,
    flexDirection: "row",
    position: "relative",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  tabIcon: {
    marginRight: 6,
    color: "#FFC857",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "capitalize",
  },
  activeTabText: {
    fontWeight: "700",
    color: "#FFC857",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -8,
    height: 4,
    width: 30,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "#FFC857",
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.textPrimary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  schemeCard: {
    borderRadius: 16,
    marginBottom: 24,
    marginHorizontal: 2,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
        overflow: "hidden",
      },
    }),
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: `${theme.colors.border}15`,
  },
  cardTouchable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardBackground: {
    width: "100%",
    height: 100,
  },
  backgroundImage: {
    opacity: 0.85,
  },
  cardGradient: {
    flex: 1,
    padding: 10,
    justifyContent: "flex-start",
    paddingBottom: 12,
  },
  cardHeader: {
    flexDirection: "column",
    position: "relative",
    padding: 0,
    margin: 0,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  schemeNameContainer: {
    flex: 1,
    paddingRight: 70,
  },
  cardContent: {
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  flexiSchemeName: {
    fontSize: 16,
    letterSpacing: 0.3,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  slogan: {
    fontSize: 11,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.8)",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  typePill: {
    position: "absolute",
    top: -4,
    right: -4,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary}30`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    zIndex: 1,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  flexiTypeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  schemeDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: `${theme.colors.border}15`,
    marginVertical: 16,
  },
  benefitsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#850111",
  },
  benefitsContainer: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkmarkCircle: {
    width: 18,
    height: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  benefitText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
  amountContainer: {
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#850111",
    marginBottom: 10,
  },
  amountChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amountChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#850111",
  },
  joinButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
    flex: 1,
    minHeight: 300,
  },
  emptyMessage: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  tabSliderContainer: {
    marginLeft: "auto",
    paddingRight: 8,
  },
  tabSliderTrack: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: 3,
    position: "relative",
  },
  tabSliderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 3,
  },
  floatingHint: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  floatingHintText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: "70%",
    backgroundColor: "#f5f5f5",
  },
  fullDescriptionText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  readMoreBtn: {
    alignSelf: "flex-start",
    marginBottom: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  readMoreText: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
