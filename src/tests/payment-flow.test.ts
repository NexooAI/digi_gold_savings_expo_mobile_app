import { io } from 'socket.io-client';
import mockApi from './mockApi';

// Test configuration
const TEST_CONFIG = {
  socketUrl: 'https://api.nexoo.in',
  apiUrl: 'https://api.nexoo.in',
  testAmount: 1000,
  testUserId: 101,
  testInvestmentId: 383,
  testSchemeId: 17,
  testChitId: 25,
};

// Test data
const TEST_USER_DETAILS = {
  userId: TEST_CONFIG.testUserId,
  investmentId: TEST_CONFIG.testInvestmentId,
  schemeId: TEST_CONFIG.testSchemeId,
  chitId: TEST_CONFIG.testChitId,
  schemeName: "Gold Savings Scheme",
  schemeType: "fixed",
  paymentFrequency: "Monthly",
  totalInstallments: 11,
  currentInstallment: 1,
  accountname: "Test User",
  branchName: "Main Branch",
  accNo: "1234567890",
  email: "test@example.com",
  mobile: "9876543210",
  name: "Test User"
};

// Mock socket events
const mockSocketEvents = {
  payment_success: {
    transactionId: 'test_transaction_123',
    orderId: 'test_order_456',
    status: 'success',
    amount: TEST_CONFIG.testAmount,
  },
  payment_failure: {
    transactionId: 'test_transaction_123',
    orderId: 'test_order_456',
    status: 'failed',
    amount: TEST_CONFIG.testAmount,
    error: 'Payment failed',
  },
  payment_cancel: {
    transactionId: 'test_transaction_123',
    orderId: 'test_order_456',
    status: 'cancelled',
    amount: TEST_CONFIG.testAmount,
  },
};

// Test payment flow
async function testPaymentFlow() {
  console.log('Starting payment flow test...');

  // 1. Initialize socket connection
  const socket = io(TEST_CONFIG.socketUrl, {
    transports: ['websocket'],
    autoConnect: false,
  });

  // 2. Set up socket event listeners
  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // 3. Test payment initiation
  try {
    console.log('Testing payment initiation...');
    const payload = {
      userId: TEST_USER_DETAILS.userId,
      amount: TEST_CONFIG.testAmount,
      investmentId: TEST_USER_DETAILS.investmentId,
      schemeId: TEST_USER_DETAILS.schemeId,
      userEmail: TEST_USER_DETAILS.email,
      userMobile: TEST_USER_DETAILS.mobile,
      userName: TEST_USER_DETAILS.name,
      chitId: TEST_USER_DETAILS.chitId,
    };

    const response = await mockApi.post('/payments/initiate', payload);
    console.log('Payment initiation response:', response.data);

    if (response.data && response.data.paymentUrl) {
      console.log('Payment URL received:', response.data.paymentUrl);
      
      // 4. Connect socket
      socket.connect();

      // 5. Simulate payment success
      console.log('Simulating payment success...');
      socket.emit('payment_success', mockSocketEvents.payment_success);

      // 6. Verify payment record
      const paymentResponse = await mockApi.get(`/payments/${response.data.transactionId}`);
      console.log('Payment record:', paymentResponse.data);

      // 7. Verify investment update
      const investmentResponse = await mockApi.get(`/investments/${TEST_USER_DETAILS.investmentId}`);
      console.log('Investment record:', investmentResponse.data);

      // 8. Verify transaction record
      const transactionResponse = await mockApi.get(`/transactions/${response.data.transactionId}`);
      console.log('Transaction record:', transactionResponse.data);

    } else {
      throw new Error('Invalid payment URL received');
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    socket.disconnect();
  }
}

// Run test
testPaymentFlow().catch(console.error); 