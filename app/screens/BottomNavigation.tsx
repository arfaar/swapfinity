import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from './DashboardScreen';
import ExploreScreen from './ExploreScreen';
import AddScreen from './AddScreen';
import ChatScreen from './ChatScreen';
import ProfileScreen from './ProfileScreen'
import React from 'react';
import { Ionicons } from 'react-native-vector-icons'

const Tab = createBottomTabNavigator();

//The different tabs in the bottom navigation - active one is green and the inactive ones are black. 
export default function MyTabs() {
  return (
    <Tab.Navigator initialRouteName="Dashboard"
    screenOptions={{
      tabBarActiveTintColor: 'green',
      tabBarInactiveTintColor: 'black',
    }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ color, size }) => ( <Ionicons name="home" color={color} size={size} />)}} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarIcon: ({ color, size }) => ( <Ionicons name="search" color={color} size={size} />)}} />
      <Tab.Screen name="Add" component={AddScreen} options={{ tabBarIcon: ({ color, size }) => ( <Ionicons name="add-circle" color={color} size={size} />)}}/>
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarIcon: ({ color, size }) => ( <Ionicons name="chatbubble" color={color} size={size} />)}} />
      <Tab.Screen name="Profile"component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => ( <Ionicons name="person" color={color} size={size} />)}}/>
    </Tab.Navigator>
  );
}