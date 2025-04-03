import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, Image, StyleSheet, Alert } from "react-native";
import { FIREBASE_DB } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
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
}

const ExploreScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [categoryCounts, setCategoryCounts] = useState({});

  const navigation = useNavigation();

  useEffect(() => {
    const fetchItems = async () => {
      const itemsSnapshot = await getDocs(collection(FIREBASE_DB, "items"));
      const itemsList: Item[] = itemsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];

      setItems(itemsList);
    };

    fetchItems();
  }, []);

  //Categorize the different items
  useEffect(() => {
    const fetchCategories = async () => {
      const querySnapshot = await getDocs(collection(FIREBASE_DB, "items"));
      const counts = { Books: 0, "Small Appliances": 0, Toys: 0, Accessories: 0, Others: 0 };
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (counts[data.category] !== undefined) {
          counts[data.category]++;
        }
      });
  
      setCategoryCounts(counts);
    };
  
    fetchCategories();
  }, []);

  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems([]); // Show nothing if the search query is empty
    } else {
      const filtered = items.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for items..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {filteredItems.length === 0 ? (
        // <Text style={styles.noMatchesText}>No matches found :(</Text>
        <View style={styles.categoryContainer}>
          {Object.keys(categoryCounts).map((cat) => (
            <View key={cat} style={styles.categoryItem}>
            <Text>{cat} ({categoryCounts[cat]})</Text>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredItems}
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
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 10,
    marginBottom: 20,
  },
  noMatchesText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 20,
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
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 10,
  },
  categoryItem: {
    backgroundColor: "#007bff", // Blue background
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    margin: 5,
    alignItems: "center",
  },
  categoryText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ExploreScreen;
