import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, StyleSheet } from "react-native";

interface MpinInputProps {
  length?: number;
  onComplete: (value: string) => void;
  secureTextEntry?: boolean; // Add this prop
  inputStyle?: any;
  containerStyle?: any;
}

const MpinInput: React.FC<MpinInputProps> = ({
  length = 4,
  onComplete,
  secureTextEntry = true, // Default to hiding text
  inputStyle = {},
  containerStyle = {},
}) => {
  const [pins, setPins] = useState(Array(length).fill(""));
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handlePinChange = (text: string, index: number) => {
    const newPins = [...pins];
    newPins[index] = text;
    setPins(newPins);

    // Auto focus the next input if available
    if (text.length === 1 && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // When all pins are entered, call onComplete
    if (newPins.every((pin) => pin.length === 1)) {
      onComplete(newPins.join(""));
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {pins.map((pin, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            if (el) inputRefs.current[index] = el;
          }}
          style={[styles.input, inputStyle]}
          keyboardType="numeric"
          maxLength={1}
          secureTextEntry={secureTextEntry}
          value={pin}
          onChangeText={(text) => handlePinChange(text, index)}
          textAlign="center"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  input: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 8,
    fontSize: 24,
    color: "#ffffff",
  },
});

export default MpinInput;
