import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import SubscriptionModal from '../modals/SubscriptionModal';
import { LinearGradient } from 'expo-linear-gradient';

const ProSubscriptionCard = ({ daysLeft = 5, onUpgrade }) => {
  const { theme, isDarkMode } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  
  // Start animations when component mounts
  useEffect(() => {
    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
    
    // Glow effect animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ])
    ).start();
    
    // Subtle icon rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  
  // Interpolate the rotation value
  const spin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Interpolate the glow opacity
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.0, 0.3]
  });
  
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
      <Animated.View 
        style={[
          styles.container,
          { 
            backgroundColor: theme.premiumBackground,
            borderColor: theme.premiumBorder,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        {/* Glow effect */}
        <Animated.View 
          style={[
            styles.glowEffect, 
            { 
              backgroundColor: Colors.premium,
              opacity: glowOpacity 
            }
          ]} 
        />
        
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
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="flash" size={28} color="#fff" />
              </Animated.View>
            </LinearGradient>
          </View>
        </View>
        
        <LinearGradient
          colors={[Colors.premiumGradientStart, Colors.premiumGradientEnd]}
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
      </Animated.View>
      
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
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
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