import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from "react-native";
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion, arrayRemove, deleteDoc, onSnapshot, addDoc } from "firebase/firestore";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

// Define item type
interface Item {
  id: string;
  title: string;
  image: string;
  description: string;
  userId: string;
  userName?: string;
  userProfilePic?: string;
  whatTheyAreLookingFor?: string;
  isFavorited?: boolean;
  swapRequested?: boolean;
}

const DashboardScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null); // Store user name
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false); // State for modal visibility
  const [filterOption, setFilterOption] = useState<string>('all'); // Filter option (all, my posts, other posts)

  // For edit function 
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lookingFor, setLookingFor] = useState("");

  const navigation = useNavigation();
  
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      setUserId(userId);
  
      // Fetch the user's name from Firestore
      const userRef = doc(FIREBASE_DB, "users", userId); // Reference to the user's document in Firestore
      getDoc(userRef).then((userSnap) => {
        if (userSnap.exists()) {
          const userName = userSnap.data().name || "User"; // Fetch the name or default to "User"
          setUserName(userName); // Set the username in state
        }
      });
    }

    // Real-time listener for items
    const unsubscribe = onSnapshot(collection(FIREBASE_DB, "items"), (querySnapshot) => {
      let itemsList: Item[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];

      // Filter items based on selected filter option
      if (filterOption === 'myPosts' && userId) {
        itemsList = itemsList.filter(item => item.userId === userId);
      } else if (filterOption === 'otherPosts' && userId) {
        itemsList = itemsList.filter(item => item.userId !== userId);
      }

      // Fetch user's favorites from Firestore and reflect that in the items list
      if (userId) {
        const userRef = doc(FIREBASE_DB, "users", userId);
        getDoc(userRef).then((userSnap) => {
          if (userSnap.exists()) {
            const userFavorites: string[] = userSnap.data().favorites || [];
            itemsList = itemsList.map((item) => ({
              ...item,
              isFavorited: userFavorites.includes(item.id),
            }));
          }
          setItems(itemsList);
        });
      } else {
        setItems(itemsList);
      }
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [userId, filterOption]);

  // Handle Swap Request
  const handleSwapRequest = async (itemId: string) => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    console.log("userName:", userName);

     // Debugging the values before proceeding
      console.log("userId:", userId);
      console.log("itemId:", itemId);
      

    if (!userId) {
      Alert.alert("Error", "You need to be logged in to send a swap request.");
      return;
    }

    try {

      // Fetch the post document based on itemId
    const postRef = doc(FIREBASE_DB, "items", itemId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      Alert.alert("Error", "Post not found.");
      return;
    }

    // Extract the receiverID from the post
    const receiverId = postDoc.data()?.userId; // Assuming the field for the user ID in the post is `userId`
    console.log("receiverId:", receiverId);
    const receiverName = postDoc.data()?.userName; // Assuming the field for the user ID in the post is `userId`
    console.log("receiverName:", receiverName);
    

    if (!receiverId) {
      Alert.alert("Error", "Receiver ID not found.");
      return;
    }

       // Create the notification message
      const notificationMessage = ` Hi, ${userName} requests to swap an item`;

      // Get the current timestamp
      const timestamp = new Date().toISOString();

      // Save the notification in Firestore
    await addDoc(collection(FIREBASE_DB, "notifications"), {
      message: notificationMessage,
      messageStatus: "unread", // Initial status is unread
      postID: itemId,
      receiverID: receiverId,
      receiverName: receiverName,
      senderID: userId,
      senderName:userName,
      swapStatus: "pending", // Initial swap status
      timestamp: timestamp,
    });

      const itemRef = doc(FIREBASE_DB, "items", itemId);
      await updateDoc(itemRef, {
        swapRequested: true, // Mark that a swap request was sent
      });

      // Update item state locally
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, swapRequested: true } : item
        )
      );

      Alert.alert("Swap Request Sent", "The swap request has been sent to the other user.");
    } catch (error) {
      console.error("Error sending swap request:", error);
      Alert.alert("Error", "Failed to send the swap request.");
    }
  };

  // Handle Toggle Favorite functionality
  const handleToggleFavorite = async (itemId: string) => {
    if (!userId) {
      Alert.alert("Error", "You need to be logged in to favorite items.");
      return;
    }

    try {
      const userRef = doc(FIREBASE_DB, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userFavorites: string[] = userSnap.data().favorites || [];

        // If item is already favorited, remove it from favorites
        if (userFavorites.includes(itemId)) {
          await updateDoc(userRef, {
            favorites: arrayRemove(itemId),
          });

          setItems((prevItems) =>
            prevItems.map((item) =>
              item.id === itemId ? { ...item, isFavorited: false } : item
            )
          );

          Alert.alert("Removed", "Item removed from favorites.");
        } else {
          // Add item to favorites
          await updateDoc(userRef, {
            favorites: arrayUnion(itemId),
          });

          setItems((prevItems) =>
            prevItems.map((item) =>
              item.id === itemId ? { ...item, isFavorited: true } : item
            )
          );

          Alert.alert("Success", "Item added to favorites!");
        }
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      Alert.alert("Error", "Failed to update favorites.");
    }
  };

  // Handle Edit Post
   const handleEditPost = (item: Item) => {
    setSelectedItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setLookingFor(item.whatTheyAreLookingFor);
    setModalVisible(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedItem) return;
    try {
      const postRef = doc(FIREBASE_DB, "items", selectedItem.id);
      await updateDoc(postRef, {
        title,
        description,
        lookingFor,
      });
      Alert.alert("Success", "Post updated successfully!");
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating post:", error);
      Alert.alert("Error", "Failed to update the post.");
    }
  };



  // Handle Delete Post
  const handleDeletePost = async (itemId: string) => {
    Alert.alert("Confirm Deletion", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        onPress: () => console.log("Deletion canceled"),
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const itemRef = doc(FIREBASE_DB, "items", itemId);
            await deleteDoc(itemRef);
            setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
            Alert.alert("Success", "Post deleted successfully!");
          } catch (error) {
            console.error("Error deleting post:", error);
            Alert.alert("Error", "Failed to delete the post.");
          }
        },
      },
    ]);
  };

   // Navigate to Explore Screen when search bar is pressed
   const handleSearchBarPress = () => {
    navigation.navigate("Explore"); // Navigate to Explore Screen
  };

  return (
    <View style={styles.container}>
      {/* Greeting Text */}
      <Text style={styles.greeting}>Hello, {userName} 👋🏻</Text>

      {/* Search Bar and Filter Icon */}
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Search for items..."  onFocus={handleSearchBarPress}  />
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Filter Posts</Text>
            <TouchableOpacity onPress={() => { setFilterOption('all'); setFilterModalVisible(false); }} style={styles.modalOption}>
              <Text>All Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setFilterOption('myPosts'); setFilterModalVisible(false); }} style={styles.modalOption}>
              <Text>My Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setFilterOption('otherPosts'); setFilterModalVisible(false); }} style={styles.modalOption}>
              <Text>Other Users' Posts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {/* User Info */}
            <View style={styles.userInfo}>
              <Image
                source={{ uri: item.userProfilePic || "https://via.placeholder.com/50" }}
                style={styles.profilePic}
              />
              <Text style={styles.userName}>{item.userName || "Anonymous"}</Text>
            </View>

            {/* Post Title */}
            <Text style={styles.title}>{item.title}</Text>

            {/* Item Image */}
            <Image source={{ uri: item.image }} style={styles.postImage} />

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>

            {/* What user is looking for */}
            <Text style={styles.swapText}>
              Looking for: <Text style={styles.highlight}>{item.whatTheyAreLookingFor}</Text>
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {item.userId === userId ? (
                <View style={styles.editDeleteButtons}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleEditPost(item)}
                  >
                    <Ionicons name="pencil" size={20} color="white" />
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>

                  <Modal animationType="slide" transparent={true} visible={modalVisible}>
                    <View style={styles.editmodalContainer}>
                    <View style={styles.editmodalContent}>
                    <Text style={styles.label}>Title:</Text>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle} />
                    <Text style={styles.label}>Description:</Text>
                    <TextInput style={styles.input} value={description} onChangeText={setDescription} multiline />
                    <Text style={styles.label}>Looking For:</Text>
                    <TextInput style={styles.input} value={lookingFor} onChangeText={setLookingFor} />
                    <TouchableOpacity style={styles.saveChangesButton} onPress={handleSaveChanges}>
                      <Text style={styles.editbuttonText}>Save Changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                    </View>
                    </View>
                  </Modal>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleDeletePost(item.id)}
                  >
                    <Ionicons name="trash" size={20} color="white" />
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.favoriteButton, item.isFavorited ? styles.favorited : styles.notFavorited]}
                    onPress={() => handleToggleFavorite(item.id)}
                  >
                    <Ionicons
                      name={item.isFavorited ? "heart" : "heart-outline"}
                      size={20}
                      color="white"
                    />
                    <Text style={styles.buttonText}>{item.isFavorited ? "Added to favorites" : "Add to favorites"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.swapButton, item.swapRequested ? styles.swapButtonSent : null]}
                    onPress={() => handleSwapRequest(item.id)}
                    disabled={item.swapRequested} 
                  >
                    <Ionicons name="swap-horizontal" size={20} color="white" />
                    <Text style={styles.buttonText}>
                    {item.swapRequested ? "Request Sent" : "Swap Request"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
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
    backgroundColor: 'rgba(136, 181, 134, 0.7)'
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 10,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 1)'
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalCloseButton: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 10,
  },
  postCard: {
    // backgroundColor: 'rgba(226, 116, 41, 0.7)',
    backgroundColor: "rgba(75, 131, 82, 1)",
    padding: 17,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    color: "#555",
  },
  swapText: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 10,
  },
  highlight: {
    fontWeight: "bold",
    color: "blue",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  editDeleteButtons: {
    flexDirection: "row",
    gap: 10
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 20,
    width: "49%",
  },
  buttonText: {
    color: "white",
    marginLeft: 5,
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff5733",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  favorited: {
    backgroundColor: "#ff5733",
  },
  notFavorited: {
    backgroundColor: "#4CAF50",
  },
  swapButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 10,
  },
  swapButtonSent: {
    backgroundColor: "#006400",
    opacity: 0.7, 
  },
  swapButtonDisabled: {
    backgroundColor: "#ccc",
  },
  //Edit block Style
  editcontainer: { flex: 1, padding: 20 },
  editmodalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  editmodalContent: { width: "90%", backgroundColor: "white", padding: 20, borderRadius: 10 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: { borderBottomWidth: 1, padding: 10, marginBottom: 20 },
  editeditbutton: { backgroundColor: "blue", padding: 15, alignItems: "center", borderRadius: 10, marginTop: 10 },
  editbuttonText: { color: "white", fontSize: 16 },
  closeButton: { marginTop: 10, alignItems: "center" },
  closeButtonText: { color: "red", fontSize: 16 },
  postContainer: { padding: 20, backgroundColor: "#f8f8f8", borderRadius: 10, marginTop: 20 },
  postTitle: { fontSize: 18, fontWeight: "bold" },
  editButton: { marginTop: 10, backgroundColor: "green", padding: 10, borderRadius: 5, flexDirection: "row", alignItems: "center" },
  saveChangesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "green",
    padding: 10,
    borderRadius: 20,
    width: "100%",
    alignSelf: "center" 
  }
});

export default DashboardScreen;
