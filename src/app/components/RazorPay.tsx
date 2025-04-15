// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, Alert } from 'react-native';
// import RazorpayCheckout from 'react-native-razorpay';

// const PaymentScreen = ({ amount, currency = 'INR', onPaymentSuccess, onPaymentFailure }) => {
//   const [isProcessing, setIsProcessing] = useState(false);

//   const initiatePayment = async () => {
//     setIsProcessing(true);
    
//     const options = {
//       description: 'NexooAI Payment Method',
//       image: 'https://your-logo-url.com/logo.png', // Replace with your app logo
//       currency: currency,
//       key: 'foozOxfOc7xRidkchT99vl4v', // Replace with your actual Razorpay key
//       amount: amount * 100, // Amount in paise
//       name: 'Gold App',
//       prefill: {
//         email: 'customer@example.com', // Optional: Replace with user's email
//         contact: '9999999999', // Optional: Replace with user's phone
//       },
//       theme: { color: '#F37254' }
//     };

//     try {
//       const paymentResponse = await RazorpayCheckout.open(options);
//       onPaymentSuccess(paymentResponse);
//     } catch (error) {
//       onPaymentFailure(error);
//       Alert.alert('Payment Failed', 'Unable to complete the transaction');
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   return (
//     <View className="flex-1 justify-center items-center p-4 bg-white">
//       <View className="w-full max-w-md bg-gray-100 rounded-lg p-6 shadow-md">
//         <Text className="text-2xl font-bold text-center mb-4">Complete Payment</Text>
//         <Text className="text-lg text-center mb-6">
//           Amount to Pay: {currency} {amount}
//         </Text>
//         <TouchableOpacity 
//           onPress={initiatePayment}
//           disabled={isProcessing}
//           className={`py-3 px-6 rounded-lg ${
//             isProcessing 
//               ? 'bg-gray-400' 
//               : 'bg-green-500 hover:bg-green-600'
//           }`}
//         >
//           <Text className="text-white text-center font-bold">
//             {isProcessing ? 'Processing...' : 'Pay Now'}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// export default PaymentScreen;