import { Button, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import type { NavigationProp } from '@react-navigation/native';
import { FIREBASE_APP, FIREBASE_AUTH } from '@/firebaseConfig';

interface RouterProps {
    navigation: NavigationProp<any, any>;
}

const DashboardScreen = ({navigation}: RouterProps) => {
  return (
    <View style={styles.container}>
      <Text>Hello User! Putting text here to test</Text>
      <Button onPress = {() => FIREBASE_AUTH.signOut()} title="Logout"></Button>
    </View>
  )
}

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ExploreScreen from './ExploreScreen';

const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
    </Tab.Navigator>
  );
}

export default DashboardScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
})