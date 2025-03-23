import { ActivityIndicator, StyleSheet, TextInput, Text, View, Button, TouchableOpacity } from 'react-native'
import React, {useState} from 'react'
import { FIREBASE_AUTH } from '../../firebaseConfig'
import {signInWithEmailAndPassword} from 'firebase/auth';
import {createUserWithEmailAndPassword} from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  //Adding the variables to be handled
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  //For navigation to Registration Screen - React Hook for navigation! 
  const navigation = useNavigation();

  //Firebase authentication instance
  const auth = FIREBASE_AUTH;

  //A function to validate all the fields to check if they are filled or not 
  const validateFields = () => {
    if (!email || !password) {
      alert('Error - Please fill all fields');
      return false;
    }
    return true;
  };

  //A function to handle sign in 
  const signIn = async () => {
    if (!validateFields()) return;
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log(response);
      alert('Signed In');
    } catch (error: any) {
      alert('Sign in failed:' + error.message)
    }finally{
      setLoading(false);
    }
  }

  return (
    <View style = {styles.container}>
      <TextInput value = {email} style = {styles.input} placeholder='Email' autoCapitalize='none' onChangeText={(text) => setEmail(text)}></TextInput>
      <TextInput secureTextEntry = {true} value = {password} style = {styles.input} placeholder='Password' autoCapitalize='none' onChangeText={(text) => setPassword(text)}></TextInput>

      {loading? (
        <ActivityIndicator size='large' color = '0000ff'/>

      ) : (
        <>
        <View style={styles.buttonContainer}>
          <Button title="Login" onPress = {signIn}/>
          </View>
          <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
            <Text style = {styles.textButton}> 
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 2,
    borderRadius: 4,
    padding: 10,
  }, 
  buttonContainer: {
    marginVertical: 5,  
  },
  textButton: {
    color: 'blue', 
    marginTop: 10,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
})

export default LoginScreen