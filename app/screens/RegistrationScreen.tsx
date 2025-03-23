import { ActivityIndicator, StyleSheet, TextInput, View, Button, Text, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../firebaseConfig'; // Import Firestore
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore'; // Import setDoc and doc for Firestore operations
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const auth = FIREBASE_AUTH;

  // A function to validate all the fields to check if they are filled or not 
  const validateFields = () => {
    if (!email || !password || !name) {
      alert('Please fill in all the fields');
      return false;
    }
    return true;
  };

  // A function to handle registration
  const signUp = async () => {
    if (!validateFields()) return;
    setLoading(true);
    try {
      // Step 1: Create user in Firebase Authentication
      const response = await createUserWithEmailAndPassword(auth, email, password);
      const user = response.user; // Firebase user object

      // Step 2: Save user data to Firestore
      const userRef = doc(FIREBASE_DB, "users", user.uid);  // Reference to Firestore document (use UID as document ID)
      await setDoc(userRef, {
        name: name,
        email: email,
        swappeditems: 0,
        favourites: [], 
        profilePicture: null,  // Placeholder for profile picture, can be updated later
      });

      console.log('Account Created and Data Saved in Firestore!');
      alert('Account Created! Please sign in.');
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput value={name} style={styles.input} placeholder="Name" onChangeText={(text) => setName(text)} />
      <TextInput value={email} style={styles.input} placeholder="Email" autoCapitalize="none" onChangeText={(text) => setEmail(text)} />
      <TextInput secureTextEntry value={password} style={styles.input} placeholder="Password" autoCapitalize="none" onChangeText={(text) => setPassword(text)} />

      {loading ? (
        <ActivityIndicator size="large" color="0000ff" />
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <Button title="Register" onPress={signUp} />
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.textButton}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

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
});

export default RegisterScreen;
