import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from "react-native";
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion, arrayRemove, deleteDoc, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";

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
}

const DashboardScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null); // Store user name
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false); // State for modal visibility
  const [filterOption, setFilterOption] = useState<string>('all'); // Filter option (all, my posts, other posts)

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

  const handleEditPost = (itemId: string) => {
    Alert.alert("Edit Post", "Navigate to edit screen (not implemented).");
  };

  return (
    <View style={styles.container}>
      {/* Greeting Text */}
      <Text style={styles.greeting}>Hello, {userName}</Text>

      {/* Search Bar and Filter Icon */}
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Search for items..." />
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
                    onPress={() => handleEditPost(item.id)}
                  >
                    <Ionicons name="pencil" size={20} color="white" />
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>

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
                    style={styles.swapButton}
                    onPress={() => Alert.alert("Swap Request Sent", "Feature coming soon!")}
                  >
                    <Ionicons name="swap-horizontal" size={20} color="white" />
                    <Text style={styles.buttonText}>Swap Request</Text>
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
    backgroundColor: "#f5f5f5",
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: "#ccc",
  },
  swapButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 10,
  },
});

export default DashboardScreen;
