import { View, Text } from 'react-native';
import React from 'react';
import "../global.css"

const Home = () => {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-red-500 text-3xl font-bold">Hello from NativeWind!</Text>
    </View>
  );
};

export default Home;
