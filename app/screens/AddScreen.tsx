import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Picker } from '@react-native-picker/picker';

const AddScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [whatTheyAreLookingFor, setWhatTheyAreLookingFor] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [userName, setUserName] = useState("Anonymous");
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Define categories
  const categories = ["Books", "Small Appliances", "Toys", "Accessories", "Others"];
  const [category, setCategory] = useState(categories[0]); // Default category

  const auth = getAuth(); // Get Firebase Auth instance

  // Check for logged-in user and fetch their details
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid); // Save user ID
        const userRef = doc(FIREBASE_DB, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.name || "Anonymous");
          setUserProfilePic(userData.profilePicture || null);
        }
      } else {
        setUserId(null);
        setUserName("Anon");
        setUserProfilePic(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!title || !description || !whatTheyAreLookingFor || !image || !userId) {
      Alert.alert("Error", "Please fill in all fields, select an image, and ensure you're logged in.");
      return;
    }

    try {
      await addDoc(collection(FIREBASE_DB, "items"), {
        title,
        description,
        whatTheyAreLookingFor,
        image,
        category,
        postedAt: new Date(),
        userId, // Store user ID
        userName, // Store user's name
        userProfilePic, // Store user's profile picture
      });

      setTitle("");
      setDescription("");
      setWhatTheyAreLookingFor("");
      setImage(null);

      navigation.navigate("Dashboard");
      Alert.alert("Success", "Item posted successfully!");
    } catch (error) {
      console.error("Error posting item:", error);
      Alert.alert("Error", "Failed to post item. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title:</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter title" />

      <Text style={styles.label}>Category:</Text>
      <View style={styles.pickerContainer}>
      <Picker
        selectedValue={category}
        onValueChange={(itemValue) => setCategory(itemValue)}
      >
        {categories.map((cat, index) => (
        <Picker.Item key={index} label={cat} value={cat} />
        ))}
      </Picker>
      </View>

      <Text style={styles.label}>Image:</Text>
      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {image ? <Image source={{ uri: image }} style={styles.imagePreview} /> : <Ionicons name="image-outline" size={40} color="gray" />}
      </TouchableOpacity>

      <Text style={styles.label}>Description:</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Describe your item" />

      <Text style={styles.label}>What are you looking for?</Text>
      <TextInput style={styles.input} value={whatTheyAreLookingFor} onChangeText={setWhatTheyAreLookingFor} placeholder="Desired swap item" />

      <TouchableOpacity style={styles.postButton} onPress={handlePost}>
        <Text style={styles.postButtonText}>Post Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    paddingVertical: 5,
    marginBottom: 15,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: "#ccc",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderRadius: 8,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  postButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  postButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default AddScreen;
