import { Text, View, StyleSheet, registerCallableModule, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen'
import RegistrationScreen from './screens/RegistrationScreen'

const Stack = createNativeStackNavigator();

export default function Index() {
  return (
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options = {{headerShown: false}} />
        <Stack.Screen name="Registration" component={RegistrationScreen} options = {{headerShown: false}} />
      </Stack.Navigator>
  );
}

