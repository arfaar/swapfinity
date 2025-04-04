import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, Image, StyleSheet, Alert, TouchableOpacity } from "react-native";
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
  category?: string;
}

const ExploreScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const navigation = useNavigation();

  const handlePress = (item: Item) => {
    navigation.navigate('Dashboard');
  };

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

  useEffect(() => {
  if (selectedCategory) {
    setFilteredItems(items.filter(item => item.category === selectedCategory));
  } else {
    setFilteredItems(items);
  }
}, [selectedCategory, items]); // Runs whenever category or items change

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

    <View style={styles.categoryContainer}>
      {Object.keys(categoryCounts).map((cat) => (
      <TouchableOpacity 
        key={cat} 
        style={[styles.categoryItem, selectedCategory === cat && { backgroundColor: "#0056b3" }]} 
        onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
        >
        <Text style={styles.categoryText}>{cat} ({categoryCounts[cat]})</Text>
      </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePress(item)}>
          <View style={styles.postCard}>
      
            <View style={styles.userInfo}>
              <Image
                source={{ uri: item.userProfilePic || "https://via.placeholder.com/50" }}
                style={styles.profilePic}
              />
              <Text style={styles.userName}>{item.userName || "Anonymous"}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>

            <Image source={{ uri: item.image }} style={styles.postImage} />

            <Text style={styles.description}>{item.description}</Text>

            <Text style={styles.swapText}>
              Looking for: <Text style={styles.highlight}>{item.whatTheyAreLookingFor}</Text>
            </Text>
          </View>
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
    backgroundColor: 'rgba(136, 181, 134, 0.7)'
  },
  searchInput: {
    height: 40,
    borderColor: "white",
    borderWidth: 2,
    borderRadius: 20,
    paddingLeft: 10,
    marginBottom: 20,
      backgroundColor: 'white'
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
    backgroundColor: "#E27429",
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
