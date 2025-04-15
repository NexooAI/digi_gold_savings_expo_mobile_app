// components/Alert.tsx
import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

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
};

const CustomAlert = ({
  visible,
  title,
  message,
  type = "info",
  buttons = [{ text: "OK", onPress: () => {} }],
  onClose,
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
});

export default CustomAlert;
