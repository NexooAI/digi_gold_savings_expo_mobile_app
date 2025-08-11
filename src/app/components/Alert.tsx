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
import { theme } from "../../constants/theme";

type AlertProps = {
  visible: boolean;
  title?: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
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
        return <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />;
      case "error":
        return <Ionicons name="close-circle" size={32} color={theme.colors.error} />;
      case "warning":
        return <Ionicons name="warning" size={32} color={theme.colors.warning} />;
      case "info":
        return <Ionicons name="information-circle" size={32} color={theme.colors.info} />;
      default:
        return <Ionicons name="information-circle" size={32} color={theme.colors.info} />;
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
                    button.style === "destructive" && styles.destructiveButtonText,
                    button.style === "cancel" && styles.cancelButtonText,
                    button.style === "default" && styles.defaultButtonText,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    minWidth: 300,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.textDark,
    textAlign: "center",
    marginTop: 10,
  },
  content: {
    padding: 16,
  },
  message: {
    fontSize: 16,
    color: theme.colors.textDarkGrey,
    lineHeight: 24,
  },
  paymentDetailsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentLabel: {
    flex: 2,
    fontWeight: "600",
    color: theme.colors.textMediumGrey,
  },
  paymentValue: {
    flex: 3,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  copyButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  copyButtonText: {
    color: theme.colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  defaultButton: {
    backgroundColor: theme.colors.primary,
  },
  destructiveButton: {
    backgroundColor: theme.colors.error,
  },
  cancelButton: {
    backgroundColor: theme.colors.textLightGrey,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  defaultButtonText: {
    color: theme.colors.white,
  },
  destructiveButtonText: {
    color: theme.colors.white,
  },
  cancelButtonText: {
    color: theme.colors.textDark,
  },
});

export default CustomAlert;
