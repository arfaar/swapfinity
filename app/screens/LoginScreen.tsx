import { ActivityIndicator, StyleSheet, TextInput, Text, View, Button, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { FIREBASE_AUTH } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';


const LoginScreen = () => {
  // State variables to handle user inputs and loading state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Navigation hook to move between screens
  const navigation = useNavigation();

  // Firebase authentication instance
  const auth = FIREBASE_AUTH;

  // Validate email format
  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  // A function to validate all the fields to check if they are filled or not
  const validateFields = () => {
    let valid = true;

    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    if (!email || !validateEmail(email)) {
      setEmailError('Please enter a valid email');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password cannot be empty');
      valid = false;
    }

    return valid;
  };

  // Handle user sign in
  const signIn = async () => {
    if (!validateFields()) return;

    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log(response);
      // After successful login, navigate to the Dashboard screen
      navigation.navigate('Home');
    } catch (error: any) {
      alert('Sign in failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Email Input */}
      <TextInput
        value={email}
        style={[styles.input, emailError ? styles.inputError : null]}
        placeholder="Email"
        autoCapitalize="none"
        onChangeText={(text) => setEmail(text)}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      {/* Password Input */}
      <TextInput
        secureTextEntry={true}
        value={password}
        style={[styles.input, passwordError ? styles.inputError : null]}
        placeholder="Password"
        autoCapitalize="none"
        onChangeText={(text) => setPassword(text)}
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      {/* Loading Indicator or Login Button */}
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <Button title="Login" onPress={signIn} disabled={loading} />
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
              <Text style={styles.textButton}>
                Don't have an account? Sign Up
              </Text>
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
  inputError: {
    borderColor: 'red',
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default LoginScreen;
