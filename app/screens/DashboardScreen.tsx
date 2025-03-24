import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";

// Define item type
interface Item {
  id: string;
  title: string;
  image: string;
  description: string;
  userId: string; // Add userId field to identify who posted
  userName?: string;
  userProfilePic?: string;
  whatTheyAreLookingFor?: string;
  isFavorited?: boolean; // New property for UI update
}

const DashboardScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      setUserId(auth.currentUser.uid);
    }

    fetchItems();
  }, [userId]); // Fetch items when userId changes

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(FIREBASE_DB, "items"));
      let itemsList: Item[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];

      // Fetch user's favorites from Firestore
      if (userId) {
        const userRef = doc(FIREBASE_DB, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userFavorites: string[] = userSnap.data().favorites || [];
          itemsList = itemsList.map((item) => ({
            ...item,
            isFavorited: userFavorites.includes(item.id),
          }));
        }
      }

      setItems(itemsList);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

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

  const handleDeletePost = async (itemId: string) => {
    // Show confirmation dialog
    Alert.alert(
      "Confirm Deletion", // Title of the alert
      "Are you sure you want to delete this post?", // Message
      [
        {
          text: "Cancel", // Cancel button
          onPress: () => console.log("Deletion canceled"), // Do nothing on cancel
          style: "cancel", // Style for the cancel button
        },
        {
          text: "Delete", // Confirm delete button
          onPress: async () => {
            try {
              // Perform delete operation (assuming Firestore)
              const itemRef = doc(FIREBASE_DB, "items", itemId);
              await deleteDoc(itemRef); // Deleting the post from Firestore
  
              // Update local state or navigate if needed
              setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
              Alert.alert("Success", "Post deleted successfully!"); // Confirmation message after deletion
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete the post.");
            }
          },
        },
      ],
      { cancelable: true } // The alert box can be dismissed by tapping outside it
    );
  };
  
  const handleEditPost = (itemId: string) => {
    // Navigate to the edit screen or open an edit modal (not implemented here)
    Alert.alert("Edit Post", "Navigate to edit screen (not implemented).");
  };

  return (
    <View style={styles.container}>
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
                // Show edit and delete buttons only for the user's own posts
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 10,
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  swapText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  highlight: {
    fontWeight: "bold",
    color: "#007bff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  favoriteButton: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  favorited: {
    backgroundColor: "green",
  },
  notFavorited: {
    backgroundColor: "red",
  },
  swapButton: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1, // Makes the buttons take full width
    marginHorizontal: 5, // Tiny margin between buttons
    justifyContent: "center", // Center the content inside the button
  },
  editDeleteButtons: {
    flexDirection: "row",
    justifyContent: "center", // Center buttons horizontally
    alignItems: "center",
    width: "100%", // Ensure the buttons take full width
  },
  buttonText: {
    color: "white",
    marginLeft: 5,
    fontSize: 14,
  },
});

export default DashboardScreen;
