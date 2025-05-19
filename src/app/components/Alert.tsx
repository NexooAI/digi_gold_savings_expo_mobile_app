// components/Alert.tsx
import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  Clipboard,
  ToastAndroid,
  Platform,
  Alert as RNAlert,
} from "react-native";

type AlertProps = {
  visible: boolean;
  title?: string;
  message: string;
  type?: "success" | "error" | "info";
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: "default" | "cancel" | "destructive";
  }>;
  onClose: () => void;
  txn_id?: string;
  amount?: number | string;
  order_id?: string;
};
const copyToClipboard = (text: string, label: string) => {
  Clipboard.setString(text);
  if (Platform.OS === "android") {
    ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
  } else {
    RNAlert.alert("Copied", `${label} copied to clipboard`);
  }
};

const CustomAlert = ({
  visible,
  title,
  message,
  type = "info",
  buttons = [{ text: "OK", onPress: () => {} }],
  onClose,
  txn_id,
  amount,
  order_id,
}: AlertProps) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <Ionicons name="checkmark-circle" size={32} color="#00cc44" />;
      case "error":
        return <Ionicons name="close-circle" size={32} color="#ff4444" />;
      default:
        return <Ionicons name="information-circle" size={32} color="#7b0006" />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            {getIcon()}
            <Text style={styles.title}>{title || type.toUpperCase()}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>

            {(txn_id || order_id || amount) && (
              <View style={styles.paymentDetailsContainer}>
                {txn_id && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Transaction ID:</Text>
                    <Text style={styles.paymentValue}>{txn_id}</Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(txn_id, "Transaction ID")}
                      style={styles.copyButton}
                    >
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {order_id && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Order ID:</Text>
                    <Text style={styles.paymentValue}>{order_id}</Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(order_id, "Order ID")}
                      style={styles.copyButton}
                    >
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {amount !== undefined && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Amount:</Text>
                    <Text style={styles.paymentValue}>₹{amount}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  button.onPress();
                  onClose();
                }}
                style={[
                  styles.button,
                  button.style === "destructive" && styles.destructiveButton,
                  button.style === "cancel" && styles.cancelButton,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === "destructive" && styles.destructiveText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    color: "#7b0006",
  },
  content: {
    padding: 16,
  },
  message: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    padding: 16,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: {
    color: "#7b0006",
    fontSize: 16,
    fontWeight: "600",
  },
  destructiveButton: {
    backgroundColor: "#ffe6e6",
  },
  destructiveText: {
    color: "#ff4444",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  paymentDetailsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  paymentLabel: {
    flex: 2,
    fontWeight: "600",
    color: "#444",
  },
  paymentValue: {
    flex: 3,
    fontSize: 16,
    color: "#000",
  },
  copyButton: {
    flex: 1,
    backgroundColor: "#7b0006",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  copyButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default CustomAlert;
