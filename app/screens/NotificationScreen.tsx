import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, doc, setDoc, deleteDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
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
          
           // Log the notifications data to see if receiverName exists
          console.log(notificationsData);

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

  const [disabledButtons, setDisabledButtons] = useState<{ [key: string]: boolean }>({});

  // Handle approve or reject action
  const handleSwapResponse = async (notification: any, response: 'approved' | 'rejected') => {
    const { senderID, senderName, receiverID, receiverName, postID } = notification;
  
    try {
       // Disable buttons for this notification
      setDisabledButtons(prevState => ({ ...prevState, [notification.id]: true }));

      // Fetch the item details from the 'items' collection
      const itemRef = doc(FIREBASE_DB, "items", postID);
      const itemSnap = await getDoc(itemRef);
      const itemData = itemSnap.exists() ? itemSnap.data() : null;
      const itemTitle = itemData ? itemData.title : "No Item"; 

    
      const notificationRef = doc(FIREBASE_DB, 'notifications', notification.id);
      await updateDoc(notificationRef, {
        swapStatus: response,
        messageStatus: 'read',  // Marking John's notification as read
      });
  
      // Notify Mary (sender) about the response
      const message = response === 'approved' 
        ? `YAY! ${receiverName} has accepted your request. Chat for more details.` 
        : `Sorry, ${receiverName} has rejected your request.`;
  
      const senderNotificationRef = collection(FIREBASE_DB, 'notifications');
      await setDoc(doc(senderNotificationRef), {
        senderID: receiverID, // Swap sender & receiver so Mary gets the message
        senderName: receiverName,
        receiverID: senderID, // Send the response to Mary
        receiverName: senderName,
        swapStatus: response,
        messageStatus: 'unread',
        postID,
        itemTitle,
        timestamp: new Date(),
        message,
      });
  
      // Provide feedback to John
      Alert.alert('Swap Response', `You have ${response} the request.`);
    } catch (error) {
      console.error("Error updating notification:", error);
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

    {/* Swap Requests */}
    <Text style={styles.sectionTitle}>Swap Requests</Text>
    <FlatList
      data={notifications.filter((item) => item.swapStatus === 'pending')}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <TouchableOpacity style={styles.textContainer}>
            <Text style={styles.itemText}>
              {item.senderName
                ? `${item.senderName} wants to swap with you.`
                : "User wants to swap an item with you."}
            </Text>
          </TouchableOpacity>

          {/* Approve/Reject Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.acceptButton, disabledButtons[item.id] && styles.disabledButton]}
              onPress={() => handleSwapResponse(item, 'approved')}
              disabled={disabledButtons[item.id]}
            >
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.rejectButton, disabledButtons[item.id] && styles.disabledButton]}
              onPress={() => handleSwapResponse(item, 'rejected')}
              disabled={disabledButtons[item.id]}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />

    {/* General Notifications */}
    <Text style={styles.sectionTitle}>Other Notifications</Text>
    <FlatList
      data={notifications.filter((item) => item.swapStatus !== 'pending')}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <TouchableOpacity onPress={() => handleOpenChat(item)} style={styles.textContainer}>
            <Text style={styles.itemText}>{item.message || "New notification"}</Text>
          </TouchableOpacity>
          {/* Delete Button */}
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  rejectButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc', // Greyed out effect
    opacity: 0.4
  },
});

export default NotificationsScreen;
