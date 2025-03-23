import { ActivityIndicator, StyleSheet, TextInput, View, Button } from 'react-native'
import React, {useState} from 'react'
import { FIREBASE_AUTH } from '../../firebaseConfig'
import {signInWithEmailAndPassword} from 'firebase/auth';
import {createUserWithEmailAndPassword} from 'firebase/auth';

const LoginScreen = () => {
  //Adding the variables to be handled
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  //Firebase authentication instance
  const auth = FIREBASE_AUTH;

  //A function to handle sign in 
  const signIn = async () => {
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

  //A funtion to handle sign up
  const signUp = async () => {
    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      console.log(response)
      alert('Check your emails!');
    } catch (error: any) {
      alert('Sign up failed:' + error.message)
    } finally {
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
          <Button title="Login" onPress = {signIn}/>
          <Button title="Create an Account" onPress = {signUp}/>
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
    borderWidth: 4,
    borderRadius: 4,
    padding: 10,
  }
})

export default LoginScreen