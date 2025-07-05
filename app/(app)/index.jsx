import { StyleSheet, Text, Image, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import ThemedView from "../../components/ThemedView";
import CustomAlert from "../../components/CustomAlert";
import { useCustomAlert } from "../../hooks/useCustomAlert";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  // Mock data for demonstration
  const recentActivity = [
    { id: 1, title: "Local Farmers Market", description: "New event this weekend", type: "event" },
    { id: 2, title: "Community Garden Tips", description: "Shared by Sarah J.", type: "post" },
    { id: 3, title: "Neighborhood Watch", description: "Important updates", type: "group" },
  ];
  
  const forYou = [
    { id: 1, title: "Tech Meetup", description: "Connect with local developers", type: "event" },
    { id: 2, title: "Book Exchange", description: "Share your favorite reads", type: "group" },
    { id: 3, title: "Home Cooking", description: "Recipe sharing group", type: "group" },
  ];
  
  const renderCard = (item) => {
    const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
    const subTextColor = theme === 'dark' ? '#aaa' : '#666';
    const cardBg = theme === 'dark' ? '#2a2a2a' : '#fff';
    
    return (
      <View key={item.id} style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>{item.title}</Text>
        <Text style={[styles.cardDescription, { color: subTextColor }]}>{item.description}</Text>
        <View style={styles.cardTag}>
          <Text style={styles.cardTagText}>{item.type}</Text>
        </View>
      </View>
    );
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme === 'dark' ? '#fff' : '#333' }]}>
            Welcome, {user?.email?.split('@')[0] || 'User'}
          </Text>
          <Image
            source={require("../../assets/local-hive-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>Recent Activity</Text>
          <View style={styles.cardsContainer}>
            {recentActivity.map(renderCard)}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>For You</Text>
          <View style={styles.cardsContainer}>
            {forYou.map(renderCard)}
          </View>
        </View>
      </ScrollView>
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20, // Add padding at bottom for the tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  logo: {
    width: 40,
    height: 40,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardTag: {
    backgroundColor: Colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  cardTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
}); 