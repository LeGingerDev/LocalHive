import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const SubscriptionModal = ({ visible, onClose, onStartTrial }) => {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        
        <View style={[styles.modalContainer, { backgroundColor: theme.cardColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: '#fff' }]}>Local Hive Pro</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="flash" size={24} color="#fff" />
            </View>
          </View>
          
          {/* Main content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.text }]}>Unlock AI-Powered Search</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Get instant, intelligent answers to all your local questions
            </Text>
            
            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>$4.99<Text style={styles.pricePeriod}>/month</Text></Text>
              <Text style={[styles.cancelText, { color: theme.textTertiary }]}>Cancel anytime</Text>
            </View>
            
            {/* Features */}
            <View style={styles.featuresContainer}>
              <FeatureItem 
                icon="search" 
                title="AI-Powered Smart Search" 
                description="Ask in natural language, get perfect results"
              />
              <FeatureItem 
                icon="infinite" 
                title="Unlimited Searches" 
                description="No limits on AI-powered queries"
              />
              <FeatureItem 
                icon="compass" 
                title="Smart Recommendations" 
                description="Get personalized suggestions based on your location"
              />
              <FeatureItem 
                icon="help-buoy" 
                title="Priority Support" 
                description="Get help faster when you need it"
              />
              <FeatureItem 
                icon="analytics" 
                title="Advanced Analytics" 
                description="Get insights about your group's knowledge"
              />
              <FeatureItem 
                icon="star" 
                title="Early Access to New Features" 
                description="Be the first to try new capabilities"
              />
            </View>
          </View>
          
          {/* Action button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onStartTrial}>
              <Text style={styles.actionButtonText}>Start 7-Day Free Trial</Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: theme.textTertiary }]}>
              Free for 7 days, then $4.99/month. Cancel anytime.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const FeatureItem = ({ icon, title, description }) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(103, 114, 229, 0.15)' }]}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginLeft: -24, // Offset the back button to center the title
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  priceContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  pricePeriod: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  cancelText: {
    fontSize: 12,
    marginTop: 4,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionContainer: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  termsText: {
    fontSize: 11,
    marginTop: 8,
  },
});

export default SubscriptionModal; 