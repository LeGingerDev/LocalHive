import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const PersonalCode = ({ code = 'HIVE-SJ47' }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  
  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Add me on Local Hive with my personal code: ${code}`,
        title: 'My Local Hive Personal Code',
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };
  
  return (
    <View style={[styles.container, { 
      backgroundColor: theme.cardColor, 
      borderColor: theme.border 
    }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Your Personal Code</Text>
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.codeContainer, { backgroundColor: theme.surfaceColor }]}>
        <Text style={[styles.code, { color: theme.text }]}>{code}</Text>
        <Text style={[styles.codeDescription, { color: theme.textSecondary }]}>
          Others can use this code to add you to groups
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.copyButton, { backgroundColor: theme.hover }]}
        onPress={handleCopyCode}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={copied ? "checkmark" : "copy-outline"} 
          size={20} 
          color={Colors.primary} 
          style={styles.copyIcon}
        />
        <Text style={styles.copyText}>
          {copied ? "Copied!" : "Copy Code"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  shareButton: {
    padding: 4,
  },
  shareText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  codeContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  copyIcon: {
    marginRight: 8,
  },
  copyText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PersonalCode; 