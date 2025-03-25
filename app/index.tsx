import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from "firebase/auth";
import { FIREBASE_AUTH } from "@/firebaseConfig";

// Screens
import LoginScreen from './screens/LoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import MyTabs from "./screens/BottomNavigation";
import FavouritesScreen from "./screens/FavouritesScreen";
import { ActivityIndicator, View } from "react-native";
import ChatScreen from "./screens/ChatScreen";

// Define stack parameters
export type RootStackParamList = {
  Login: undefined;
  Registration: undefined;
  Home: undefined;
  Favorites: undefined;
  Chats: undefined
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // State to track loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setUser(user);
      setLoading(false); // Set loading to false once auth state is determined
    });

    return unsubscribe; // Clean up the listener
  }, []);

  // Show a loading screen until Firebase auth state is resolved
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={user ? "Home" : "Login"}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Registration" component={RegistrationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={MyTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Favorites" component={FavouritesScreen} />
      <Stack.Screen name="Chats" component={ChatScreen} />
    </Stack.Navigator>
  );
}
