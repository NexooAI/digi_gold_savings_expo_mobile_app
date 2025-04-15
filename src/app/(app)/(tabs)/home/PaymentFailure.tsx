import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "@/constants/theme";

const PaymentFailure = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const handleRetryPayment = () => {
    // Navigate back to payment page or wherever you want the user to retry
    router.push("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      {/* Failure Icon (replace with your own image or Lottie animation) */}
      <Image
        source={theme.image.cancel_icon} // Replace with your failure icon
        style={styles.icon}
      />
      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>
          Failed Order ID: {params.order_id}
        </Text>
        <Text style={styles.detailText}>Amount: {params.amount}</Text>
      </View>

      <Text style={styles.title}>Payment Failed</Text>
      <Text style={styles.message}>
        Something went wrong while processing your payment.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleRetryPayment}>
        <Text style={styles.buttonText}>Try Again</Text>
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
  detailsContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#b71c1c", // Red
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#b71c1c",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  detailText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
});

export default PaymentFailure;
