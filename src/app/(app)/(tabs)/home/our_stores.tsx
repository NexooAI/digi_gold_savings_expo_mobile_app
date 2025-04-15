import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import AppHeader from "@/app/components/AppHeader";
import { theme } from "@/constants/theme";

const stores = [
  {
    id: 1,
    name: "DC Jewellers ",
    latitude: 8.427828080550306,
    longitude: 78.02855977120382,
    address:
      "205/64A, Main Bazar, Udangudi, Thoothukudi(D), Tamil Nadu - 628203",
  },
];

const StoreLocator = () => {
  const router = useRouter();
  const mapRef = useRef(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const insets = useSafeAreaInsets();

  const focusOnStore = (store) => {
    mapRef.current.animateToRegion(
      {
        latitude: store.latitude,
        longitude: store.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      800
    );
  };

  const dropdownData = stores.map((store) => ({
    label: store.address,
    value: store.id.toString(),
    ...store,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <AppHeader showBackButton={true} backRoute="index" />

        <ScrollView
          contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 16 }}
        >
          <ImageBackground
            source={theme.image.store_image}
            style={styles.imageBackground}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Our Stores</Text>
            </View>
          </ImageBackground>

          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: "#007bff" }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={dropdownData}
            search
            maxHeight={700}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? "Select Store Address" : "..."}
            searchPlaceholder="Search addresses..."
            value={selectedStore?.value}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={(item) => {
              setSelectedStore(item);
              setIsFocus(false);
              focusOnStore(item);
            }}
            renderLeftIcon={() => (
              <AntDesign
                name="enviromento"
                size={20}
                color={isFocus ? "#007bff" : "#666"}
                style={styles.icon}
              />
            )}
          />

          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: stores[0].latitude,
              longitude: stores[0].longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {stores.map((store) => (
              <Marker
                key={store.id}
                coordinate={{
                  latitude: store.latitude,
                  longitude: store.longitude,
                }}
                title={store.name}
                description={store.address}
              />
            ))}
          </MapView>

          <View style={styles.storeList}>
            {stores.map((store) => (
              <View key={store.id} style={styles.storeListItem}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeAddress}>{store.address}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  imageBackground: {
    height: 200,
    justifyContent: "flex-end",
    padding: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  headerContainer: {
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 12,
    borderRadius: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "white",
  },
  placeholderStyle: {
    color: "#666",
    fontSize: 16,
  },
  selectedTextStyle: {
    color: "#333",
    fontSize: 16,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  icon: {
    marginRight: 8,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  map: {
    height: 500,
    borderRadius: 12,
    marginBottom: 12,
  },
  storeList: {
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 2,
    padding: 16,
  },
  storeListItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: "#666",
  },
});

export default StoreLocator;
