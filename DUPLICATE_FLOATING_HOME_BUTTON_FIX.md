# Duplicate Floating Home Button Issue - FIXED

## Problem Description

Some pages in the app were showing **duplicate floating home buttons** due to improper usage of the `AppLayoutWrapper` component.

## Root Cause

The issue was caused by **multiple `AppLayoutWrapper` components** being used in the same component:

1. **Loading state**: One `AppLayoutWrapper` for loading
2. **Error state**: Another `AppLayoutWrapper` for error handling  
3. **Main content**: A third `AppLayoutWrapper` for the actual content

Each `AppLayoutWrapper` renders its own `FloatingHomeButton`, causing duplicates to appear on the screen.

## Affected Files

The following files had this issue and have been fixed:

- `src/app/(app)/(tabs)/home/policies/termsAndConditionsPolicies.tsx`
- `src/app/(app)/(tabs)/home/policies/privacyPolicy.tsx`

## Solution

**Refactor the component to use only ONE `AppLayoutWrapper`** and handle different states (loading, error, content) within it using conditional rendering.

### Before (Problematic Code)
```tsx
// ❌ WRONG - Multiple AppLayoutWrapper components
if (loading) {
  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <LoadingComponent />
    </AppLayoutWrapper>
  );
}

if (error) {
  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <ErrorComponent />
    </AppLayoutWrapper>
  );
}

return (
  <AppLayoutWrapper showHeader={false} showBottomBar={false}>
    <MainContent />
  </AppLayoutWrapper>
);
```

### After (Fixed Code)
```tsx
// ✅ CORRECT - Single AppLayoutWrapper with conditional content
const renderLoadingState = () => <LoadingComponent />;
const renderErrorState = () => <ErrorComponent />;
const renderMainContent = () => <MainContent />;

return (
  <AppLayoutWrapper showHeader={false} showBottomBar={false}>
    {loading ? renderLoadingState() : error ? renderErrorState() : renderMainContent()}
  </AppLayoutWrapper>
);
```

## Benefits of the Fix

1. **No more duplicate floating home buttons**
2. **Cleaner component structure**
3. **Better performance** (single wrapper instead of multiple)
4. **Consistent behavior** across all states
5. **Easier maintenance**

## How FloatingHomeButton Works

The `FloatingHomeButton` is automatically rendered by `AppLayoutWrapper` when:
- `showBottomBar={false}` (bottom tabs are hidden)
- The current route is in the `HIDE_TABS_ROUTES` array (from `src/config/navigation.ts`)

The button appears only on pages where the bottom navigation is hidden, providing users with a quick way to return to the home screen.

## Prevention

To avoid this issue in the future:

1. **Always use only ONE `AppLayoutWrapper` per component**
2. **Use conditional rendering for different states** instead of multiple returns
3. **Keep the wrapper at the top level** and render content conditionally inside it

## Testing

After the fix, verify that:
- ✅ Only one floating home button appears on policy pages
- ✅ The button functions correctly (navigates to home)
- ✅ Loading, error, and content states all work properly
- ✅ No visual glitches or overlapping elements
