import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
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

  // Handle deleting a notification
  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await deleteDoc(doc(FIREBASE_DB, "notifications", notificationId));
              setNotifications(notifications.filter(n => n.id !== notificationId));
            } catch (error) {
              console.error("Error deleting notification:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Notifications {notifications.length > 0 && `(${notifications.length})`}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Chats')}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity onPress={() => handleOpenChat(item)} style={styles.textContainer}>
              <Text style={styles.itemText}>
                {item.senderName ? `${item.senderName} wants to swap an item with you.` : "Unknown wants to swap an item with you."}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteNotification(item.id)}>
              <Ionicons name="close" size={20} color="red" />
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
  },
});

export default NotificationsScreen;
