import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { FlatList } from "react-native";
interface FeatureGridProps {
  features: Array<{
    name: string;
    icon: any;
  }>;
  onFeaturePress?: (feature: string) => void;
}

const FeatureGrid = ({ features, onFeaturePress }: FeatureGridProps) => {
  return (
    <FlatList
      horizontal
      data={features}
      keyExtractor={(item, index) => index.toString()}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          className="w-32 h-32 mx-2 p-2 bg-white rounded-xl items-center shadow-md"
          onPress={() => onFeaturePress?.(item.name)}
        >
          <Image
            source={item.icon}
            className="w-14 h-14 mb-2"
            resizeMode="contain"
          />
          <Text className="text-center font-bold text-sm text-primary">
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
      contentContainerClassName="px-4"
      snapToInterval={144} // item width + margins
      decelerationRate="fast"
      className="mt-4"
    />
  );
};

export default FeatureGrid;
