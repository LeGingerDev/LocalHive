import { StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/Colors";

const Contact = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Contact Page</Text>
      <Link
        href="/"
        style={[styles.LinkButton, { backgroundColor: Colors.primary }]}
      >
        Home Page
      </Link>
    </View>
  );
};

export default Contact;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  LinkButton: {
    padding: 10,
    borderRadius: 5,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
});
