import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { collection, getDocs, doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";

// Define item type
interface Item {
  id: string;
  title: string;
  image: string;
  description: string;
  userName?: string;
  userProfilePic?: string;
  whatTheyAreLookingFor?: string;
  isFavorited?: boolean; // New property for UI update
}

const FavoritesScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      setUserId(auth.currentUser.uid);
    }

    fetchFavorites();
  }, [userId]); // Fetch favorites when userId changes

  const fetchFavorites = async () => {
    try {
      if (!userId) return;

      // Fetch user's favorites from Firestore
      const userRef = doc(FIREBASE_DB, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userFavorites: string[] = userSnap.data().favorites || [];

        // Fetch items from Firestore
        const querySnapshot = await getDocs(collection(FIREBASE_DB, "items"));
        const itemsList: Item[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[];

        // Filter items to only include those that are in the user's favorites
        const favoritesList = itemsList.filter((item) =>
          userFavorites.includes(item.id)
        );

        setItems(favoritesList);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const handleRemoveFromFavorites = async (itemId: string) => {
    if (!userId) {
      Alert.alert("Error", "You need to be logged in to remove items.");
      return;
    }

    try {
      const userRef = doc(FIREBASE_DB, "users", userId);
      await updateDoc(userRef, {
        favorites: arrayRemove(itemId), // Removes the item from the favorites array
      });

      // Remove the item from the UI immediately after removal
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

      Alert.alert("Removed", "Item has been removed from favorites.");
    } catch (error) {
      console.error("Error removing from favorites:", error);
      Alert.alert("Error", "Failed to remove item from favorites.");
    }
  };

  const handleSwapRequest = (itemId: string) => {
    // Placeholder for swap request functionality
    Alert.alert("Swap Request Sent", `Swap request for item ${itemId} sent!`);
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
              {/* Remove from Favorites Button */}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFromFavorites(item.id)}
              >
                <Ionicons name="heart-dislike" size={20} color="white" />
                <Text style={styles.buttonText}>Remove from Favorites</Text>
              </TouchableOpacity>

              {/* Swap Request Button */}
              <TouchableOpacity
                style={styles.swapButton}
                onPress={() => handleSwapRequest(item.id)}
              >
                <Ionicons name="swap-horizontal" size={20} color="white" />
                <Text style={styles.buttonText}>Swap Request</Text>
              </TouchableOpacity>
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
    backgroundColor: "rgba(136, 181, 134, 0.7)",

  },
  postCard: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
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
    color: "#555",
    marginBottom: 5,
  },
  swapText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  highlight: {
    color: "#007bff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Ensure equal space for both buttons
    marginTop: 10,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff4757", // Red color for remove
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1, // Take equal space
    marginHorizontal: 5,
  },
  swapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff", // Blue color for swap
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1, // Take equal space
    marginHorizontal: 5,
  },
  buttonText: {
    color: "white",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default FavoritesScreen;
