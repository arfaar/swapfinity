import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const ChatsScreen = () => {
  const [chats, setChats] = useState<any[]>([]);
  const userId = FIREBASE_AUTH.currentUser?.uid;
  const navigation = useNavigation();

  useEffect(() => {
    const fetchChats = async () => {
      if (!userId) return;

      try {
        const q = query(
          collection(FIREBASE_DB, 'chats'),
          where('participants', 'array-contains', userId)
        );

        const querySnapshot = await getDocs(q);
        const chatData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const chat = { id: docSnap.id, ...docSnap.data() };
            const otherUserId = chat.participants.find((id: string) => id !== userId);
            
            // Fetch sender details
            const userDoc = await getDoc(doc(FIREBASE_DB, 'users', otherUserId));
            const senderData = userDoc.exists() ? userDoc.data() : { name: "Unknown", profilePic: null };

            return { ...chat, senderName: senderData.name, profilePicture: senderData.profilePicture };
          })
        );

        setChats(chatData);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Chats</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigation.navigate('IndividualChats', { chatID: item.id, senderName: item.senderName })} 
            style={styles.chatItem}
          >
            <Image 
              source={item.profilePicture ? { uri: item.profilePicture } : require('../../assets/images/default-profile-pic.jpg')} 
              style={styles.profileImage} 
            />
            <View style={styles.chatTextContainer}>
              <Text style={styles.chatName}>{item.senderName}</Text>
              <Text style={styles.lastMessage}>{item.lastMessage || "Hi, I want to swap the item."}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "rgba(136, 181, 134, 0.7)",
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  chatTextContainer: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
});

export default ChatsScreen;
