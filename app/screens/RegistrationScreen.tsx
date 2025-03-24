import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View, Button, Text, TouchableOpacity, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../firebaseConfig';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../index'; 

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Registration'>;

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;

  const signUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(FIREBASE_DB, 'users', response.user.uid), {
        name,
        email,
        swappeditems: 0,
        favourites: [],
        profilePicture: null,
      });

      Alert.alert('Success', 'Account Created! Please sign in.');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput value={name} style={styles.input} placeholder="Name" onChangeText={setName} />
      <TextInput value={email} style={styles.input} placeholder="Email" autoCapitalize="none" onChangeText={setEmail} />
      <TextInput secureTextEntry value={password} style={styles.input} placeholder="Password" autoCapitalize="none" onChangeText={setPassword} />

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
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
