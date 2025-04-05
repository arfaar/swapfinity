import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons';

const IndividualChats = ({ route, navigation }) => {
  const { chatID } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const userId = FIREBASE_AUTH.currentUser?.uid;
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    const q = query(collection(FIREBASE_DB, 'chats', chatID, 'messages'), orderBy('time', 'asc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const messagesData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const uniqueUserIds = [...new Set(messagesData.map((msg) => msg.senderID))];
      const profilePromises = uniqueUserIds.map(async (id) => {
        if (!userProfiles[id]) {
          const userDoc = await getDoc(doc(FIREBASE_DB, 'users', id));
          return { id, ...userDoc.data() };
        }
        return null;
      });

      const profileResults = await Promise.all(profilePromises);
      const updatedProfiles = profileResults.reduce((acc, profile) => {
        if (profile) acc[profile.id] = { name: profile.name, photoURL: profile.photoURL };
        return acc;
      }, {});

      setUserProfiles((prevProfiles) => ({ ...prevProfiles, ...updatedProfiles }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [chatID]);

  // Set the header title to the username of the other person in the chat
  useLayoutEffect(() => {
    if (userProfiles) {
      const otherUserProfile = Object.values(userProfiles).find((profile) => profile.id !== userId);
      if (otherUserProfile) {
        navigation.setOptions({
          title: otherUserProfile.name || 'Chat',
        });
      }
    }
  }, [userProfiles, userId, navigation]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(FIREBASE_DB, 'chats', chatID, 'messages'), {
      senderID: userId,
      message: text.trim(),
      time: new Date(),
    });

    setText('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={item.senderID === userId ? styles.senderContainer : styles.receiverContainer}>
            {item.senderID !== userId && userProfiles[item.senderID] && (
              <Image source={{ uri: userProfiles[item.senderID].photoURL }} style={styles.profileImage} />
            )}
            <View style={styles.messageWrapper}>
              <Text style={styles.userName}>
                {item.senderID === userId ? 'You' : userProfiles[item.senderID]?.name || 'Unknown'}
              </Text>
              <View style={[styles.messageContainer, item.senderID === userId ? styles.sender : styles.receiver]}>
                <Text style={styles.messageText}>{item.message}</Text>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Icon name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(136, 181, 134, 0.7)",
    paddingHorizontal: 5, 
    paddingBottom: 10,
  },
  senderContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 8,
    marginRight: 5, // space for the sender
  },
  receiverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  profileImage: {
    width: 10,
    height: 10,

    marginRight: 8,
  },
  messageWrapper: {
    maxWidth: '75%',
  },
  userName: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 2,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
  },
  sender: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 132, 255, 0.6)',
  },
  receiver: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
  },
  messageText: {
    fontSize: 16,
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(136, 181, 134, 0.7)",
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    height: 45,
  },
  sendButton: {
    backgroundColor: '#0084ff',
    padding: 12,
    borderRadius: 25,
    marginLeft: 10,
  },
});

export default IndividualChats;
