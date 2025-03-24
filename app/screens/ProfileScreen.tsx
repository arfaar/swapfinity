import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

// Reauthentication function
const reauthenticate = async (user, password) => {
  const credentials = EmailAuthProvider.credential(user.email, password);
  try {
    await reauthenticateWithCredential(user, credentials);
    console.log("User reauthenticated successfully");
  } catch (error) {
    console.error("Error during reauthentication: ", error);
    Alert.alert("Reauthentication failed", "Please enter your correct password.");
    throw error; // Propagate error to handle later
  }
};

const ProfileScreen = ({ navigation }: any) => {
  const auth = FIREBASE_AUTH;
  const user = auth.currentUser;
  const userRef = user ? doc(FIREBASE_DB, "users", user.uid) : null;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("*****");
  const [swappedItems, setSwappedItems] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<null | string>(null);

  // Fetch user data from Firestore
  useEffect(() => {
    if (userRef) {
      // Listen for changes in user data in real-time
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Fetched user data:", data);
          setUsername(data.name || "");
          setSwappedItems(data.swappedItems || 0);
          setFavoritesCount(data.favorites?.length || 0);
          setProfilePicture(data.profilePicture || null);
        } else {
          console.log("No user data found in Firestore");
        }
      });

      // Clean up the listener when the component unmounts
      return () => unsubscribe();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !userRef) {
      Alert.alert("Error", "User not found.");
      return;
    }

    try {
      // If password is being changed, first reauthenticate
      if (password && password !== "*****") {
        await reauthenticate(user, password); // Reauthentication
        await updatePassword(user, password); // Update password after reauthentication
        console.log("Password updated successfully");
      }

      // Update user info in Firestore
      await updateDoc(userRef, {
        name: username,
        swappedItems: swappedItems,
        favoritesCount: favoritesCount,
        profilePicture: profilePicture,
      });

      Alert.alert("Success", "Profile updated successfully!");
      setEditingField(null); // Close edit mode
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  // Function to change profile picture
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
      if (userRef) await updateDoc(userRef, { profilePicture: result.assets[0].uri });
    }
  };

  // Function to remove profile picture
  const removeProfilePicture = async () => {
    setProfilePicture(null); // Remove the local profile picture
    if (userRef) await updateDoc(userRef, { profilePicture: null }); // Remove the profile picture from Firestore
  };

  return (
    <View style={styles.container}>
      {/* Profile Picture */}
      <View style={styles.profileImageContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.profileImageWrapper}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={80} color="gray" />
          )}
        </TouchableOpacity>

        {/* Remove Profile Picture (Trash Bin Icon) */}
        {profilePicture && (
          <TouchableOpacity style={styles.removeButton} onPress={removeProfilePicture}>
            <Ionicons name="close-circle" size={27} />
          </TouchableOpacity>
        )}
      </View>

      {/* Editable User Info Section */}
      <View style={styles.profileCard}>
        {/* Username (Editable) */}
        <Text style={styles.label}>Username:</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            editable={editingField === "username"}
          />
          <TouchableOpacity onPress={() => setEditingField(editingField === "username" ? null : "username")}>
            <Ionicons name="pencil-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Email (Non-editable) */}
        <Text style={styles.label}>Email:</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>{email}</Text>
        </View>

        {/* Password (Editable) */}
        <Text style={styles.label}>Password:</Text>
        <View style={styles.inputContainer}>
          {editingField === "password" ? (
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          ) : (
            <Text style={styles.inputText}>*****</Text>
          )}
          <TouchableOpacity onPress={() => setEditingField(editingField === "password" ? null : "password")}>
            <Ionicons name="pencil-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>
        {editingField === "password" && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}

        {/* Save Username Button */}
        {editingField === "username" && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save Username</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Swapped Items & Favorites Count */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{swappedItems}</Text>
          <Text style={styles.statLabel}>Swapped Items</Text>
        </View>

        <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate("Favorites")}>
          <Text style={styles.statNumber}>{favoritesCount}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={() => signOut(auth)}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  profileImageContainer: { alignItems: "center", marginBottom: 20, position: "relative" },
  profileImageWrapper: { justifyContent: "center", alignItems: "center" },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  removeIcon: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#dc3545",
    padding: 5,
    borderRadius: 50,
  },
  profileCard: { backgroundColor: "#fff", padding: 15, borderRadius: 10, elevation: 4, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#ccc", paddingBottom: 5, marginBottom: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 5 },
  inputText: { flex: 1, fontSize: 16, color: "#333" },
  saveButton: { backgroundColor: "#007bff", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 10 },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  statsContainer: { flexDirection: "row", justifyContent: "space-between" },
  statBox: { flex: 1, backgroundColor: "#fff", padding: 20, borderRadius: 10, alignItems: "center", marginHorizontal: 5, elevation: 4 },
  statNumber: { fontSize: 24, fontWeight: "bold", color: "#007bff" },
  statLabel: { fontSize: 14, color: "#555", marginTop: 5 },
  logoutButton: { backgroundColor: "#dc3545", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 30 },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  removeButton: {
    position: "absolute",
    top: 70,
    right: 105,
    backgroundColor: "transparent", // No background
    padding: 5,
  },
});

export default ProfileScreen;
