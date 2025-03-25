import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, doc, setDoc } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const userId = FIREBASE_AUTH.currentUser?.uid;
  const navigation = useNavigation();

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
          console.log("Fetched Notifications:", notificationsData);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      }
    };
  
    fetchNotifications();
  }, [userId]);

  // Handle opening chat when clicking on a notification
  const handleOpenChat = async (notification: any) => {
    const { senderID, senderName } = notification;
    if (!senderID) return;

    try {
      const chatID = [userId, senderID].sort().join("_");
      const chatRef = doc(FIREBASE_DB, "chats", chatID);

      // Create a chat document if it doesn't exist
      await setDoc(chatRef, {
        participants: [userId, senderID],
        lastMessage: "Start chatting...",
        lastMessageTime: new Date(),
      }, { merge: true });

      // Navigate to the chat screen
      navigation.navigate("Chats", { chatID, senderID, senderName });
    } catch (error) {
      console.error("Error opening chat:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Notifications</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Chats')}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleOpenChat(item)} style={styles.itemContainer}>
            <Text style={styles.itemText}>
              {item.senderName ? `${item.senderName} wants to swap an item with you.` : "Unknown wants to swap an item with you."}
            </Text>
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

export default NotificationsScreen;
