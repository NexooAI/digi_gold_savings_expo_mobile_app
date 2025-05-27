import { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoPlayerProps {
  videoUrl: string;
}

const VideoPlayer = ({ videoUrl }: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenVideo = async () => {
    try {
      setIsLoading(true);
      const supported = await Linking.canOpenURL(videoUrl);
      if (supported) {
        await Linking.openURL(videoUrl);
      } else {
        console.error("Don't know how to open URI: " + videoUrl);
      }
    } catch (error) {
      console.error('Error opening video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.playButton} 
        onPress={handleOpenVideo}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <Ionicons name="play-circle" size={64} color="#fff" />
            <Text style={styles.playText}>Play Video</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    minHeight: 300,
  },
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  playText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
});

export default VideoPlayer;