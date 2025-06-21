# API Logging System Guide

This guide explains how to use the comprehensive API logging system implemented in the React Native app to track all API endpoints being triggered.

## Overview

The API logging system automatically tracks all API requests, responses, and errors across different services in the app. It provides detailed logging with timestamps, response times, status codes, and error information.

## Features

- ✅ **Automatic Logging**: All API calls are automatically logged
- 📊 **Performance Metrics**: Response times and success rates
- 🔍 **Error Tracking**: Detailed error information and stack traces
- 📈 **Analytics**: Endpoint usage statistics and performance analysis
- 📤 **Export Capability**: Export logs as JSON for debugging
- 🎯 **Service Separation**: Separate logging for different API services

## Services Covered

1. **Main API Service** (`src/services/api.ts`)
2. **API Service** (`src/services/api.service.ts`)
3. **Payment Service** (`src/services/payment.service.ts`)

## How It Works

### Automatic Logging

The system automatically logs:
- **Requests**: Method, URL, headers, request data, timestamp
- **Responses**: Status code, response data, duration, timestamp
- **Errors**: Error message, status code, response data, duration

### Console Output

All API calls are logged to the console with emojis for easy identification:

```
🚀 API REQUEST: { method: 'GET', url: '/home', data: {...} }
✅ API RESPONSE: { status: 200, duration: '150ms', data: {...} }
❌ API ERROR: { status: 404, duration: '45ms', error: {...} }
```

## Usage

### Basic Usage

```typescript
import { 
  logApiSummary, 
  logRecentApiCalls, 
  getApiLogs, 
  apiLogManager 
} from '@/utils/apiLogger';

// Print API summary to console
logApiSummary();

// Print recent API calls
logRecentApiCalls(10);

// Get all API logs
const allLogs = getApiLogs();
```

### Advanced Usage

```typescript
import { apiLogManager } from '@/utils/apiLogger';

// Get logs by service
const mainLogs = apiLogManager.getLogsByService('main');
const paymentLogs = apiLogManager.getLogsByService('payment');

// Get logs by endpoint
const homeLogs = apiLogManager.getLogsByEndpoint('/home');

// Get logs by time range
const recentLogs = apiLogManager.getLogsByTimeRange(
  new Date(Date.now() - 3600000), // 1 hour ago
  new Date() // now
);

// Get failed logs only
const failedLogs = apiLogManager.getFailedLogs();

// Get successful logs only
const successfulLogs = apiLogManager.getSuccessfulLogs();
```

### Performance Analysis

```typescript
// Get API summary with statistics
const summary = apiLogManager.getApiSummary();
console.log(`Total Requests: ${summary.totalRequests}`);
console.log(`Success Rate: ${((summary.successful / summary.totalRequests) * 100).toFixed(2)}%`);
console.log(`Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);

// Get slowest endpoints
const slowestEndpoints = apiLogManager.getSlowestEndpoints(5);
slowestEndpoints.forEach(endpoint => {
  console.log(`${endpoint.endpoint}: ${endpoint.avgTime.toFixed(2)}ms avg`);
});

// Get error-prone endpoints
const errorProneEndpoints = apiLogManager.getErrorProneEndpoints(5);
errorProneEndpoints.forEach(endpoint => {
  console.log(`${endpoint.endpoint}: ${endpoint.errorRate.toFixed(2)}% error rate`);
});
```

### Export and Debugging

```typescript
// Export all logs as JSON
const exportedLogs = apiLogManager.exportLogs();
console.log('Exported logs:', exportedLogs);

// Clear all logs
apiLogManager.clearAllLogs();

// Start performance monitoring (logs every 30 seconds)
const monitoringInterval = apiLogManager.startPerformanceMonitoring(30000);

// Stop monitoring
clearInterval(monitoringInterval);
```

## Available Functions

### Utility Functions

| Function | Description |
|----------|-------------|
| `logApiSummary()` | Print API summary to console |
| `logRecentApiCalls(limit?)` | Print recent API calls (default: 10) |
| `clearApiLogs()` | Clear all API logs |
| `exportApiLogs()` | Export logs as JSON string |
| `getApiLogs()` | Get all API logs |
| `getFailedApiLogs()` | Get failed API logs only |
| `getSlowestEndpoints(limit?)` | Get slowest endpoints (default: 5) |
| `getErrorProneEndpoints(limit?)` | Get error-prone endpoints (default: 5) |

### ApiLogManager Methods

| Method | Description |
|--------|-------------|
| `getAllLogs()` | Get all logs from all services |
| `getLogsByService(service)` | Get logs for specific service |
| `getLogsByEndpoint(endpoint)` | Get logs for specific endpoint |
| `getLogsByTimeRange(start, end)` | Get logs within time range |
| `getFailedLogs()` | Get failed requests only |
| `getSuccessfulLogs()` | Get successful requests only |
| `getApiSummary()` | Get comprehensive API summary |
| `clearAllLogs()` | Clear all logs |
| `exportLogs()` | Export logs as JSON |
| `printSummary()` | Print summary to console |
| `printRecentLogs(limit)` | Print recent logs to console |
| `startPerformanceMonitoring(interval)` | Start real-time monitoring |
| `getSlowestEndpoints(limit)` | Get slowest endpoints |
| `getErrorProneEndpoints(limit)` | Get error-prone endpoints |

## Log Entry Structure

```typescript
interface ApiLogEntry {
  timestamp: string;        // ISO timestamp
  method: string;          // HTTP method (GET, POST, etc.)
  url: string;             // API endpoint URL
  status?: number;         // HTTP status code
  duration?: number;       // Response time in milliseconds
  requestData?: any;       // Request payload
  responseData?: any;      // Response data
  error?: any;             // Error information
  service?: string;        // Service name (main, apiService, payment)
  operation?: string;      // Operation name (for payment service)
}
```

## API Summary Structure

```typescript
interface ApiSummary {
  totalRequests: number;                                    // Total API requests
  successful: number;                                       // Successful requests
  failed: number;                                          // Failed requests
  averageResponseTime: number;                             // Average response time
  endpoints: Record<string, {                              // Per-endpoint statistics
    count: number;                                         // Request count
    avgTime: number;                                       // Average response time
    errors: number;                                        // Error count
  }>;
  services: Record<string, {                               // Per-service statistics
    count: number;                                         // Request count
    avgTime: number;                                       // Average response time
    errors: number;                                        // Error count
  }>;
}
```

## Debug Button

A debug button has been added to the home screen (temporarily) that demonstrates the API logging functionality:

```typescript
// Located in src/app/(app)/(tabs)/home/index.tsx
const demonstrateApiLogging = useCallback(() => {
  // Shows API summary in alert
  // Logs detailed information to console
}, []);
```

**Note**: Remove this debug button before production deployment.

## Console Output Examples

### API Summary
```
📊 API LOGS SUMMARY
==================
Total Requests: 25
Successful: 23
Failed: 2
Success Rate: 92.00%
Average Response Time: 245.67ms

📈 BY SERVICE:
  main: 15 requests, 1 errors, 234.50ms avg
  apiService: 8 requests, 1 errors, 267.25ms avg
  payment: 2 requests, 0 errors, 189.00ms avg

🔗 TOP ENDPOINTS:
  /home: 5 requests, 0 errors, 156.20ms avg
  /schemes: 3 requests, 1 errors, 345.67ms avg
  /rates/current: 2 requests, 0 errors, 89.50ms avg
```

### Recent Logs
```
📋 RECENT 5 API LOGS:
==================
1. ✅ GET /home (main)
   Status: 200 | Duration: 156ms | Time: 2024-01-15T10:30:45.123Z

2. ✅ GET /schemes (main)
   Status: 200 | Duration: 234ms | Time: 2024-01-15T10:30:44.987Z

3. ❌ POST /payments/initiate (payment)
   Status: 422 | Duration: 89ms | Time: 2024-01-15T10:30:44.756Z
   Error: Validation failed
```

## Best Practices

1. **Development**: Use console logging for debugging
2. **Testing**: Export logs for analysis
3. **Production**: Disable detailed logging or use remote logging service
4. **Performance**: Clear logs periodically to prevent memory issues
5. **Security**: Be careful with sensitive data in logs

## Troubleshooting

### No Logs Appearing
- Check if API services are properly imported
- Verify interceptors are working
- Check console for any errors

### Memory Issues
- Clear logs periodically using `clearApiLogs()`
- Limit the number of logs stored
- Use time-based filtering for large datasets

### Performance Impact
- The logging system has minimal performance impact
- Logs are stored in memory only
- Consider disabling in production for maximum performance

## Production Considerations

1. **Remove Debug Button**: Remove the debug button from the home screen
2. **Disable Console Logging**: Comment out console.log statements in production
3. **Remote Logging**: Consider sending logs to a remote service for production monitoring
4. **Log Rotation**: Implement log rotation to prevent memory issues
5. **Privacy**: Ensure no sensitive data is logged

## Integration with External Services

The logging system can be easily extended to send logs to external services:

```typescript
// Example: Send logs to external service
const sendLogsToExternalService = async () => {
  const logs = apiLogManager.exportLogs();
  await fetch('https://your-logging-service.com/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: logs
  });
};
```

This comprehensive API logging system provides full visibility into all API interactions in your React Native app, making debugging and performance monitoring much easier. 