import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient"; // For gradient background
import AppHeader from "@/app/components/AppHeader";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import api from "../../../services/api";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  status: string;
};

type Scheme = {
  chitId: string | number | (string | number)[];
  investmentId: string;
  id: string;
  schemeName: string;
  metalType: string; // "gold" or "silver"
  savingType: string; // "weight" or "amount"
  status?: string; // e.g., "ACTIVE" or "INACTIVE"
  totalPaid: number;
  monthsPaid: number;
  emiAmount: number;
  maturityDate: string; // parsed date string
  goldWeight: number;
  accountHolder: string; // accountName
  accNo: string; // accountNo
  schemeCode: string;
  noOfIns: string;
  transactions: Transaction[];
  joiningDate: string; // parsed date string
  schemesData: any;
  chitData: any;
};

export default function SavingsScreen() {
  const router = useRouter();
  const { language, user } = useGlobalStore();

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user, router]);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7b0006" />
      </SafeAreaView>
    );
  }

  const [savings, setSavings] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Increased bottomPadding multiplier from 0.1 to 0.2
  const bottomPadding = height * 0.1 + bottom;
  // Fetch user investment data
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`user_investments/${user.id}`);
      const investments = response.data.investments || [];
      // Transform each investment into your Scheme structure
      const transformedSavings: Scheme[] = investments.map((item: any) => {
        const schemeObj = item.scheme || {};
        const chit = item.chits || {};
        // Parse dates
        const doj = item.start_date
          ? new Date(item.start_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "N/A";

        const dom = item.end_date
          ? new Date(item.end_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "N/A";

        return {
          id: item.investmentId,
          // Prefer scheme name from scheme object if available
          schemeName:
            schemeObj.schemeName || item.schemeName || "Unknown Scheme",
          // New fields: metalType and savingType (default to gold & weight if missing)
          metalType: schemeObj.type ? schemeObj.type.toLowerCase() : "gold",
          savingType: schemeObj.schemeType
            ? schemeObj.schemeType.toLowerCase()
            : "weight",
          status: item.status,
          totalPaid: parseFloat(item.total_paid) || 0,
          // Replace with item.monthsPaid if available; here using item.lastInstallment for demo
          monthsPaid: item.lastInstallment || 0,
          emiAmount: parseFloat(chit.amount) || 0,
          maturityDate: dom,
          goldWeight: parseFloat(item.totalgoldweight) || 0,
          accountHolder: item.accountName || "",
          accNo: item.accountNo || "",
          joiningDate: doj,
          schemeCode: schemeObj.schemeId ? schemeObj.schemeId.toString() : "",
          noOfIns: chit.noOfInstallments,
          schemesData: schemeObj,
          chitData: chit,
          transactions: [],
        };
      });
      setSavings(transformedSavings);
    } catch (err: any) {
      console.error("Error fetching data:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const translations = useMemo(
    () => ({
      yourGoldPortfolio: t("yourGoldPortfolio"),
      totalInvested: t("totalInvested"),
      activeSavingsPlans: t("activeSavingsPlans"),
      monthsPaid: t("monthsPaid"),
      monthlyEMI: t("monthlyEMI"),
      monthsRemaining: t("monthsRemaining"),
      maturesOn: t("maturesOn"),
      noActiveSchemes: t("noActiveSavingsSchemesFound"),
      gold: t("gold"),
    }),
    [language]
  );

  const totalInvested = savings.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalGold = savings.reduce((acc, curr) => acc + curr.goldWeight, 0);

  // Enhanced Scheme Card Component
  const EnhancedSchemeCard = ({ item }: { item: Scheme }) => {
    // Use metalType from scheme to determine background
    const bgColor = ["#5e4c14 ", "#863339"]; // Default black gradient
    const bgColors =
      item.metalType === "gold"
        ? ["#e1c875", "#d6b240"]
        : ["#f0ebeb", "#cccccc"]; // silver gradient if not gold
    const handleNavigation = (item) => {
      if (!item) return;
      router.push({
        pathname: "/savings/SavingsDetail",
        params: {
          schemeName: item.schemeName || "",
          totalPaid: item.totalPaid?.toString() || "0",
          monthsPaid: item.monthsPaid?.toString() || "0",
          emiAmount: item.emiAmount?.toString() || "0",
          maturityDate: item.maturityDate || "",
          goldWeight: item.goldWeight?.toString() || "0.00",
          accountHolder: item.accountHolder || "N/A",
          accNo: item.accNo || "N/A",
          schemeCode: item.schemeCode || "",
          id: item.id || "",
          noOfIns: item.noOfIns || 0,
          chitId: item?.chitData?.chitId || "",
          schemesData: item.schemesData || {},
          transactions: JSON.stringify(item.transactions || []),
        },
      });
    };

    return (
      <LinearGradient
        colors={[bgColors[0], bgColors[1]]}
        style={styles.cardContainer}
      >
        {/* Top Row: Scheme Name & Status */}
        <View style={styles.topRow}>
          <LinearGradient
            colors={[bgColor[1], bgColors[1]]}
            style={styles.titleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.schemeTitle}>{item.schemeName}</Text>
          </LinearGradient>
        </View>

        {/* Rest of the content */}
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>
              Account Holder
            </Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              {item.accountHolder}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>A/C No</Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              {item.accNo}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>
              Metal Type
            </Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              {item.metalType.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Update all other rows similarly */}
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>
              Amount Paid
            </Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              ₹{item.totalPaid.toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>
              Months Paid
            </Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              {item.monthsPaid} / {item.noOfIns}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>
              Installment
            </Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              ₹{item.emiAmount}
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>DOJ</Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              {item.joiningDate}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>Maturity</Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              {item.maturityDate}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>
              Total Weight
            </Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              {item.goldWeight.toFixed(2)} / g
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>
              Saving Type
            </Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              {item.savingType === "weight" ? "Weight" : "Amount"}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>
              Scheme Code
            </Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>
              {item.schemeCode}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: bgColor[0] }]}>Branch</Text>
            <Text style={[styles.value, { color: bgColor[1] }]}>--</Text>
          </View>
        </View>
        {/* <TouchableOpacity
          style={styles.payButton}
          onPress={() =>
            router.push({
              pathname: "/savings/SavingsDetail",
              params: {
                // allInsversData: JSON.stringify(item),
                schemeName: item.schemeName || "",
                totalPaid: item.totalPaid?.toString() || "0",
                monthsPaid: item.monthsPaid?.toString() || "0",
                emiAmount: item.emiAmount?.toString() || "0",
                maturityDate: item.maturityDate || "",
                goldWeight: item.goldWeight?.toString() || "0.00",
                accountHolder: item.accountHolder || "N/A",
                accNo: item.accNo || "N/A",
                schemeCode: item.schemeCode || "",
                id: item.id || "",
                noOfIns: item.noOfIns,
                chitId: item?.chitData?.chitId,
                schemesData: item.schemesData || {},
                transactions: JSON.stringify(item.transactions || []),
              },
            })
          }
        >
          <Text style={styles.payButtonText}>More Details</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => handleNavigation(item)}
        >
          <Text style={styles.payButtonText}>More Details</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  };

  const ListHeader = () => (
    <View className="pb-4">
      <View className="bg-white/90 p-4 rounded-xl mb-4">
        <Text className="text-xl font-bold text-[#7b0006]">
          {translations.yourGoldPortfolio}
        </Text>
        <View className="flex-row justify-between mt-3">
          <View className="flex-row items-center">
            <Ionicons name="cash-outline" size={20} color="#7b0006" />
            <Text className="ml-2 text-gray-600">
              {translations.totalInvested}: ₹{totalInvested.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="cube-outline" size={20} color="#7b0006" />
            <Text className="ml-2 text-gray-600">
              {totalGold.toFixed(2)} {translations.gold}
            </Text>
          </View>
        </View>
      </View>
      <Text className="text-lg text-center font-bold text-white mb-4">
        {translations.activeSavingsPlans}
      </Text>
    </View>
  );

  const EmptyState = () => (
    <View className="items-center justify-center p-8">
      <Image
        source={theme.image.no_data}
        className="w-64 h-64 mb-4"
        resizeMode="contain"
      />
      <Text className="text-white mt-4 text-center text-lg">
        {translations.noActiveSchemes}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7b0006" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500">Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ImageBackground
        source={theme.image.savings_bg}
        className="flex-1"
        imageStyle={{
          width: "100%",
          height: "100%",
          opacity: 0.95,
        }}
        blurRadius={1}
      >
        <View className="absolute top-0 left-0 right-0 z-10 px-4">
          <AppHeader showBackButton={false} backRoute="index" />
        </View>

        <FlatList
          data={savings}
          keyExtractor={(item, index) =>
            item.id && item.id !== "" ? item.id : index.toString()
          }
          renderItem={({ item }) => <EnhancedSchemeCard item={item} />}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={{
            paddingTop: 100,
            paddingHorizontal: 16,
            paddingBottom: bottomPadding,
          }}
          showsVerticalScrollIndicator={false}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: moderateScale(80),
  },
  cardContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    backgroundColor: "#fff", // White background for a debit card look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    color: "#bbb",
    marginRight: 4,
  },
  activeDot: {
    color: "#00cc44",
  },
  statusText: {
    fontSize: 8,
    color: "#000", // Black text
  },
  name: {
    fontSize: 20,
    color: "#000", // Black text
    marginBottom: 2,
  },
  accountNo: {
    fontSize: 20,
    color: "#000", // Black text
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoColumn: {
    flex: 1,
  },
  payButton: {
    backgroundColor: "#7b0006",
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "flex-end",
    borderRadius: 6,
    marginTop: 8,
  },
  payButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
  },
  titleGradient: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  schemeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    textShadowColor: "rgba(232, 91, 91, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
