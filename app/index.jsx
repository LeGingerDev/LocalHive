import { StyleSheet, Text, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import ThemedView from "../components/ThemedView";
import { Colors } from "../constants/Colors";

const index = () => {
  const router = useRouter();
  
  return (
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
    </ThemedView>
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
});

export default index;
