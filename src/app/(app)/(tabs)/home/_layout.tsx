import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="productsdetails"
        options={{ title: "Product Details", headerShown: false }}
      />
      <Stack.Screen
        name="join_savings"
        options={{ title: "Join Schemes", headerShown: false }}
      />
      <Stack.Screen
        name="kyc"
        options={{ title: "Know your customer", headerShown: false }}
      />
      <Stack.Screen
        name="policies/termsAndConditionsPolicies"
        options={{
          title: "Terms & Conditions",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="policies/ourPolicies"
        options={{
          title: "Our Policies",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="policies/privacyPolicy"
        options={{
          title: "Our Policies",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(storeInfo)/about_us"
        options={{ title: "About US", headerShown: false }}
      />
      <Stack.Screen
        name="faq"
        options={{ title: "FAQ", headerShown: false }}
      />
      {/* <Stack.Screen
        name="storeLocator"
        options={{ title: "Store Locator", headerShown: false }}
      /> */}
      <Stack.Screen
        name="(storeInfo)/contact_us"
        options={{ title: "Contact US", headerShown: false }}
      />
      <Stack.Screen
        name="offers"
        options={{ title: "Our Offers", headerShown: false }}
      />
      {/* <Stack.Screen
        name="StoreLocator"
        options={{ title: "Store Locator", headerShown: false }}
      /> */}
      <Stack.Screen
        name="our_stores"
        options={{ title: "Our Stores", headerShown: false }}
      />
      <Stack.Screen
        name="refer_earn"
        options={{ title: "Refer & Earn", headerShown: false }}
      />
      <Stack.Screen
        name="payment"
        options={{ title: "Payment Process", headerShown: false }}
      />
      <Stack.Screen
        name="PaymentWebView"
        options={{ title: "Payment Process", headerShown: false }}
      />
      <Stack.Screen
        name="PaymentSuccess"
        options={{ title: "Payment Success", headerShown: false }}
      />
      <Stack.Screen
        name="PaymentFailure"
        options={{ title: "Payment Failure", headerShown: false }}
      />
    </Stack>
  );
}
