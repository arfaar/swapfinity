import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { FIREBASE_DB } from "../../firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

// Add screen component
const AddScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [whatTheyAreLookingFor, setWhatTheyAreLookingFor] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // Request media library permission
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need permission to access your photo library to select an image."
        );
      }
    };
    requestPermissions();
  }, []);

  // Function to pick an image from the gallery
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

  // Function to handle posting the item
  const handlePost = async () => {
    if (!title || !description || !whatTheyAreLookingFor || !image) {
      Alert.alert("Error", "Please fill in all fields and select an image.");
      return;
    }

    try {
      // Add item to Firestore
      await addDoc(collection(FIREBASE_DB, "items"), {
        title,
        description,
        whatTheyAreLookingFor,
        image,
        postedAt: new Date(),
      });

      // Reset form fields after posting
      setTitle("");
      setDescription("");
      setWhatTheyAreLookingFor("");
      setImage(null);

      // Navigate to dashboard (or wherever you want)
      navigation.navigate("Dashboard");
      Alert.alert("Success", "Item posted successfully!");
    } catch (error) {
      console.error("Error posting item:", error);
      Alert.alert("Error", "Failed to post item. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Title Field */}
      <Text style={styles.label}>Title:</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter title of your item"
      />

      {/* Image Picker */}
      <Text style={styles.label}>Image:</Text>
      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <Ionicons name="image-outline" size={40} color="gray" />
        )}
      </TouchableOpacity>

      {/* Description Field */}
      <Text style={styles.label}>Description:</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the item you're swapping"
      />

      {/* What They Are Looking For */}
      <Text style={styles.label}>What are you looking for?</Text>
      <TextInput
        style={styles.input}
        value={whatTheyAreLookingFor}
        onChangeText={setWhatTheyAreLookingFor}
        placeholder="What do you want in exchange?"
      />

      {/* Post Button */}
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
