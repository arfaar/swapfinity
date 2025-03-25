import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';

const ChatScreen = () => {
  const [viewMode, setViewMode] = useState<'chats' | 'notifications'>('chats');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);

  const userId = FIREBASE_AUTH.currentUser?.uid;

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (userId) {
        try {
          const q = query(
            collection(FIREBASE_DB, 'notifications'),
            where('receiverID', '==', userId), 
            orderBy('timestamp', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const notificationsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(notificationsData);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      }
    };
  
    fetchNotifications();
  }, [userId]);
  

  // Fetch Chats (You can modify this to fetch chats from Firebase as needed)
  useEffect(() => {
    const fetchChats = async () => {
      // Assuming you have a collection "chats" or need to modify this
      if (userId) {
        const q = query(
          collection(FIREBASE_DB, 'chats'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const chatsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChats(chatsData);
      }
    };

    fetchChats();
  }, [userId]);

  const handleToggleView = () => {
    setViewMode(viewMode === 'chats' ? 'notifications' : 'chats');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{viewMode === 'chats' ? 'Chats' : 'Notifications'}</Text>
        <TouchableOpacity onPress={handleToggleView}>
          <Ionicons name="swap-horizontal" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={viewMode === 'chats' ? chats : notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>
              {viewMode === 'chats' ? item.message : `${item.senderName} wants to swap an item with you.`}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  itemContainer: {
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
  itemText: {
    fontSize: 16,
  },
});

export default ChatScreen;
