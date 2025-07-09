import React, { useRef, useState, RefObject } from "react";
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Platform-specific imports
let MapView: any, Marker: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import AppHeader from "@/app/components/AppHeader";
import { theme } from "@/constants/theme";

interface Store {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

const stores: Store[] = [
  {
    id: 1,
    name: "Akila Jewellers ",
    latitude: 8.427828080550306,
    longitude: 78.02855977120382,
    address:
      "205/64A, Main Bazar, Udangudi, Thoothukudi(D), Tamil Nadu - 628203",
  },
];

const dropdownData = stores.map((store) => ({
  label: store.address,
  value: store.id.toString(),
  ...store,
}));

const queryClient = new QueryClient();

const StoreLocator = () => {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(dropdownData[0]);
  const [isFocus, setIsFocus] = useState(false);
  const insets = useSafeAreaInsets();

  const focusOnStore = (store: Store) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: store.latitude,
          longitude: store.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        800
      );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <AppHeader showBackButton={true} backRoute="home" hideMenuIcon={true} />

          <ScrollView
            contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 16 }}
          >
            <ImageBackground
              source={require("../../../../../assets/images/shop.jpg")}
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

            {Platform.OS === 'web' ? (
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderText}>Store Map</Text>
                <Text style={styles.mapPlaceholderSubtext}>
                  Interactive map would be displayed here on mobile devices
                </Text>
              </View>
            ) : (
              <MapView
                ref={mapRef as any}
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
            )}

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
    </QueryClientProvider>
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
  // Web-specific styles
  mapPlaceholder: {
    height: 500,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  mapPlaceholderSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
