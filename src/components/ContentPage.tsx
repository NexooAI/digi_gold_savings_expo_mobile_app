import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useContent } from '../hooks/useContent';
import { brandTheme } from '../core/config/BrandConfig';

interface ContentPageProps {
  page: string;
  showTitle?: boolean;
  customStyles?: {
    container?: any;
    title?: any;
    body?: any;
  };
}

/**
 * Generic component to display brand-specific content
 * @param page - The page name (e.g., 'about-us', 'privacy-policy')
 * @param showTitle - Whether to show the page title (default: true)
 * @param customStyles - Custom styles for the component
 */
export const ContentPage: React.FC<ContentPageProps> = ({
  page,
  showTitle = true,
  customStyles = {}
}) => {
  const { content, loading, error, refresh } = useContent(page);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, customStyles.container]}>
        <ActivityIndicator size="large" color={brandTheme.colors.primary} />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, customStyles.container]}>
        <Text style={styles.errorText}>Error loading content</Text>
        <Text style={styles.errorDetails}>{error}</Text>
        <Text style={styles.retryText} onPress={refresh}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!content) {
    return (
      <View style={[styles.errorContainer, customStyles.container]}>
        <Text style={styles.errorText}>No content available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, customStyles.container]}
      showsVerticalScrollIndicator={false}
    >
      {showTitle && (
        <Text style={[styles.title, customStyles.title]}>
          {content.title}
        </Text>
      )}
      <Text style={[styles.body, customStyles.body]}>
        {content.body}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    textAlign: 'justify',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    color: brandTheme.colors.primary,
    textDecorationLine: 'underline',
  },
});

export default ContentPage; 