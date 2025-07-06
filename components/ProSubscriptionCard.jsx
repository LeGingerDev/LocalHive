import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import SubscriptionModal from '../modals/SubscriptionModal';
import { LinearGradient } from 'expo-linear-gradient';

const ProSubscriptionCard = ({ daysLeft = 5, onUpgrade }) => {
  const { theme, isDarkMode } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  
  const handleOpenModal = () => {
    setModalVisible(true);
  };
  
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  
  const handleStartTrial = () => {
    setModalVisible(false);
    // Call the parent component's onUpgrade handler if provided
    if (onUpgrade) {
      onUpgrade();
    }
  };
  
  return (
    <>
      <View style={[
        styles.container, 
        { 
          backgroundColor: theme.premiumBackground,
          borderColor: theme.premiumBorder,
        }
      ]}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.premiumText }]}>Local Hive Pro</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              AI-powered search & premium features
            </Text>
            <Text style={[styles.trialText, { color: theme.textTertiary }]}>
              Free Trial • {daysLeft} days left
            </Text>
          </View>
          
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[Colors.premiumLight, Colors.premiumDark]}
              style={styles.iconBackground}
            >
              <Ionicons name="flash" size={28} color="#fff" />
            </LinearGradient>
          </View>
        </View>
        
        <LinearGradient
          colors={[Colors.premiumLight, Colors.premiumDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.upgradeButton}
        >
          <TouchableOpacity 
            style={styles.upgradeButtonTouchable}
            onPress={handleOpenModal}
            activeOpacity={0.8}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
      
      <SubscriptionModal 
        visible={modalVisible}
        onClose={handleCloseModal}
        onStartTrial={handleStartTrial}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  trialText: {
    fontSize: 14,
  },
  iconContainer: {
    marginLeft: 12,
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButton: {
    borderRadius: 30,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  upgradeButtonTouchable: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default ProSubscriptionCard; 