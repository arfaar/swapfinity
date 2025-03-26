import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';

const IndividualChats = ({ route }) => {
  const { chatID } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const userId = FIREBASE_AUTH.currentUser?.uid;

  useEffect(() => {
    const fetchMessages = async () => {
      const q = query(
        collection(FIREBASE_DB, 'chats', chatID, 'messages'),
        orderBy('time', 'asc')
      );
      const querySnapshot = await getDocs(q);
      setMessages(querySnapshot.docs.map(doc => doc.data()));
    };

    fetchMessages();
  }, []);

  const sendMessage = async () => {
    if (!text) return;

    await addDoc(collection(FIREBASE_DB, 'chats', chatID, 'messages'), {
      senderID: userId,
      message: text,
      time: new Date(),
    });

    setText('');
  };

  return (
    <View>
      <FlatList data={messages} renderItem={({ item }) => <Text>{item.message}</Text>} />
      <TextInput value={text} onChangeText={setText} placeholder="Type a message..." />
      <TouchableOpacity onPress={sendMessage}><Text>Send</Text></TouchableOpacity>
    </View>
  );
};

export default IndividualChats;
