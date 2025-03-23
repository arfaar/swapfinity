import { Text, View, StyleSheet, registerCallableModule, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen'
import RegistrationScreen from './screens/RegistrationScreen'
import DashboardScreen from "./screens/DashboardScreen";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { FIREBASE_AUTH } from "@/firebaseConfig";
import MyTabs from "./screens/BottomNavigation";

const Stack = createNativeStackNavigator();

export default function Index() {
  const[user, setUser] = useState<User | null>(null);

  useEffect(() => {
     onAuthStateChanged(FIREBASE_AUTH, (user) => {
      console.log('user', user);
      setUser(user);
    });
  }, [])

  return (
      <Stack.Navigator initialRouteName="Login">
        {user? ( <Stack.Screen name="Home" component={MyTabs} options={{ headerShown: false }} />)
         : (<Stack.Screen name="Login" component={LoginScreen} options = {{headerShown: false}} />)}
        <Stack.Screen name="Registration" component={RegistrationScreen} options = {{headerShown: false}} />
      </Stack.Navigator>
  );
}

