import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { theme } from "@/constants/theme";

const PaymentSuccess = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = `₹${params.amount}`;

  const handleGoHome = () => {
    router.push("/(tabs)/savings");
  };

  return (
    <View style={styles.container}>
      <Image source={theme.image.success_icon} style={styles.icon} />

      <Text style={styles.title}>Payment Successful!</Text>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>Transaction ID: {params.txn_id}</Text>
        <Text style={styles.detailText}>Order ID: {params.order_id}</Text>
        <Text style={styles.detailText}>Amount Paid: {amount}</Text>
      </View>

      <Text style={styles.message}>
        Your payment has been processed successfully. Thank you!
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleGoHome}>
        <Text style={styles.buttonText}>Go to Savings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsContainer: {
    marginBottom: 20,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
  detailText: {
    fontSize: 16,
    color: "#444",
    marginVertical: 4,
    fontWeight: "bold",
  },
});

export default PaymentSuccess;
