import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
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

  const handleAddToFavorites = async (itemId: string) => {
    if (!userId) {
      Alert.alert("Error", "You need to be logged in to favorite items.");
      return;
    }

    try {
      const userRef = doc(FIREBASE_DB, "users", userId);
      await updateDoc(userRef, {
        favorites: arrayUnion(itemId),
      });

      // Update local state to reflect UI change immediately
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, isFavorited: true } : item
        )
      );

      Alert.alert("Success", "Item added to favorites!");
    } catch (error) {
      console.error("Error adding to favorites:", error);
      Alert.alert("Error", "Failed to add item to favorites.");
    }
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
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  item.isFavorited && { backgroundColor: "green" },
                ]}
                onPress={() => handleAddToFavorites(item.id)}
              >
                <Ionicons
                  name={item.isFavorited ? "heart" : "heart-outline"}
                  size={20}
                  color="white"
                />
                <Text style={styles.buttonText}>
                  {item.isFavorited ? "Added to Favorites" : "Favorite"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.swapButton}
                onPress={() => Alert.alert("Swap Request Sent", "Feature coming soon!")}
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
    justifyContent: "space-between",
    marginTop: 10,
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff4757",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  swapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default DashboardScreen;
