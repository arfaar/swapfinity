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
      <Text>Hello User! </Text>
      <Button onPress = {() => FIREBASE_AUTH.signOut()} title="Logout"></Button>
    </View>
  )
}

export default DashboardScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
})