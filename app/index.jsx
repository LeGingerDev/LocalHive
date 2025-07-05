import { StyleSheet, Text, Image, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import ThemedView from "../components/ThemedView";
import ProtectedRoute from "../components/ProtectedRoute";
import CustomAlert from "../components/CustomAlert";
import { useCustomAlert } from "../hooks/useCustomAlert";
import { Colors } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";

const Index = () => {
  const router = useRouter();
  const { signOut, rememberMe } = useAuth();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const handleSignOut = async () => {
    // If Remember Me is disabled, show a confirmation message
    if (!rememberMe) {
      showAlert(
        'Sign Out',
        'Since "Remember Me" is disabled, you will need to sign in again when you restart the app.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel'
          },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: async () => {
              await signOut();
              router.replace('/landing');
            }
          }
        ]
      );
    } else {
      await signOut();
      router.replace('/landing');
    }
  };
  
  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        <Image
          source={require("../assets/local-hive-logo.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome to Local Hive</Text>
        <Text style={styles.subtitle}>Your local knowledge sharing platform</Text>

        <Link href="/landing" style={styles.linkButton}>
          Go to Landing Page
        </Link>
        
        <Link href="/profile" style={[styles.linkButton, { marginTop: 12, backgroundColor: Colors.primaryLight }]}>
          View Profile
        </Link>
        
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: Colors.secondary }]} 
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
        
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      </ThemedView>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    marginTop: 10,
    textAlign: "center",
    marginBottom: 30,
  },
  image: {
    width: 120,
    height: 120,
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 25,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "500",
  },
  signOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
  },
  signOutButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default Index;
