import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons, FontAwesome, AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppHeader from "@/app/components/AppHeader";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";

const { width, height } = Dimensions.get('window');

// Define Offer type
interface Offer {
  id: number;
  title: string;
  description: string;
  details: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  image: any;
  terms: string;
}

export default function Offers() {
  const router = useRouter();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const offers: Offer[] = [
    {
      id: 1,
      title: "Festive Special",
      description: "Enjoy up to 20% off on select gold jewelry",
      details: "This exclusive offer applies to all gold jewelry items in our 'Traditional Collection'. Discount will be applied at checkout. Offer valid until December 31st.",
      icon: "festival",
      color: "#FFD700",
      image: require('../../../../../assets/images/offer.png'),
      terms: "Valid on purchases above ₹10,000. Cannot be combined with other offers."
    },
    {
      id: 2,
      title: "New Arrivals",
      description: "Flat 15% off on diamond collections",
      details: "Be the first to own our latest diamond pieces with this special discount. Includes rings, necklaces, and earrings from our 'Elegance Collection'.",
      icon: "diamond",
      color: "#40E0D0",
      image: require('../../../../../assets/images/offer.png'),
      terms: "Limited to stock on hand. Offer ends January 15th."
    },
    {
      id: 3,
      title: "Exclusive Membership",
      description: "Special offers all year round",
      details: "VIP members enjoy 10% off all purchases, early access to sales, and exclusive member-only events. Sign up today to start saving!",
      icon: "star",
      color: theme.colors.primary,
      image: require('../../../../../assets/images/offer.png'),
      terms: "Membership fee of ₹2,999/year applies. Some exclusions may apply."
    },
  ];

  const openOfferModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showBackButton={true} backRoute="home" hideMenuIcon={true} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <ImageBackground
          source={require('../../../../../assets/images/slider1.png')}
          style={styles.hero}
          imageStyle={{ borderRadius: 16 }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(123,0,6,0.7)']}
            style={styles.heroOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <FontAwesome name="tag" size={24} color="white" />
                <Text style={styles.heroBadgeText}>LIMITED TIME</Text>
              </View>
              <Text style={styles.heroTitle}>Exclusive Offers</Text>
              <Text style={styles.heroSubtitle}>
                Discover our special deals crafted just for you
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Offers List */}
        <View style={styles.offersContainer}>
          {offers.map((offer) => (
            <TouchableOpacity 
              key={offer.id} 
              style={styles.card}
              onPress={() => openOfferModal(offer)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["white", "#FFF8F8"]}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={[offer.color, darkenColor(offer.color)]}
                    style={styles.iconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <MaterialIcons name={offer.icon} size={24} color="white" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.cardTitle}>{offer.title}</Text>
                    <Text style={styles.cardDescription}>{offer.description}</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>Tap to view details</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => Alert.alert("Coming Soon", "This feature will be available soon!")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.colors.primary, "#a8000a"]}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>Become a VIP Member</Text>
            <Ionicons name="sparkles" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Offer Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Pressable style={styles.modalOverlayPress} onPress={closeModal} />
          
          {selectedOffer && (
            <Animated.View style={[styles.modalContent, { transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            }) }] }]}>
              <ImageBackground
                source={selectedOffer.image}
                style={styles.modalImage}
                imageStyle={styles.modalImageStyle}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.7)', 'transparent']}
                  style={styles.modalImageOverlay}
                >
                  <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                    <AntDesign name="close" size={24} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>{selectedOffer.title}</Text>
                </LinearGradient>
              </ImageBackground>
              
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalBadge}>
                  <MaterialIcons name={selectedOffer.icon} size={18} color="white" />
                </View>
                
                <Text style={styles.modalDescription}>{selectedOffer.details}</Text>
                
                <View style={styles.modalTerms}>
                  <Text style={styles.modalTermsTitle}>Terms & Conditions:</Text>
                  <Text style={styles.modalTermsText}>{selectedOffer.terms}</Text>
                </View>
                
                {/* <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => {
                    closeModal();
                    router.push('/shop');
                  }}
                >
                  <Text style={styles.modalButtonText}>Shop Now</Text>
                </TouchableOpacity> */}
              </ScrollView>
            </Animated.View>
          )}
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper function to darken color for gradient
const darkenColor = (color: string): string => {
  // This is a simplified version - in a real app you might want to use a library
  return color === theme.colors.primary ? '#7b0006' : 
         color === '#FFD700' ? '#FFC000' : 
         color === '#40E0D0' ? '#30C0B0' : color;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  scrollContent: {
    paddingTop: 64,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  hero: {
    height: 180,
    borderRadius: 16,
    marginBottom: 30,
    overflow: "hidden",
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heroContent: {
    maxWidth: '80%',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  heroBadgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 8,
  },
  heroTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 24,
  },
  offersContainer: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "white",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconContainer: {
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    maxWidth: '80%',
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  cardFooterText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  ctaButton: {
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: "white",
    fontWeight: "600",
    marginRight: 8,
    fontSize: 16,
  },
  spacer: {
    height: moderateScale(20),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
  },
  modalOverlayPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  modalImage: {
    height: 180,
    width: '100%',
  },
  modalImageStyle: {
    resizeMode: 'cover',
  },
  modalImageOverlay: {
    flex: 1,
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 'auto',
    marginBottom: 16,
  },
  modalBody: {
    padding: 20,
  },
  modalBadge: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTerms: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalTermsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalTermsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});