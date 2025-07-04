import { StyleSheet, Text, Image } from "react-native"; // Remove View since you're using ThemedView
import { Link } from "expo-router";
import ThemedView from "../components/ThemedView";
// Remove the duplicate import

const index = () => {
  return (
    <ThemedView style={styles.container}>
      <Image
        source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
        style={styles.image}
      />
      <Text style={styles.title}>This worked?</Text>
      <Text style={styles.subtitle}>Yes it did!</Text>

      <Link href="/about" style={styles.linkButton}>
        About Page
      </Link>
      <Link href="/contact" style={styles.linkButton}>
        Contact Page
      </Link>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    marginTop: 10,
  },
  image: {
    // lowercase convention
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  linkButton: {
    // camelCase convention
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
});

export default index;
