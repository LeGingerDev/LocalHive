import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import SubscriptionModal from '../modals/SubscriptionModal';

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
          backgroundColor: isDarkMode ? 'rgba(103, 114, 229, 0.15)' : 'rgba(240, 242, 255, 0.9)',
          borderColor: theme.border,
        }
      ]}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Local Hive Pro</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              AI-powered search & premium features
            </Text>
            <Text style={[styles.trialText, { color: theme.textTertiary }]}>
              Free Trial • {daysLeft} days left
            </Text>
          </View>
          
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="flash" size={28} color="#fff" />
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={handleOpenModal}
          activeOpacity={0.8}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </TouchableOpacity>
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
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: '#7c4dff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default ProSubscriptionCard; 