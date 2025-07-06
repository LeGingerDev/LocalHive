import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ProfileStats = ({ stats = { groups: 3, itemsAdded: 23, searches: 47 } }) => {
  const { theme } = useTheme();
  
  const iconColor = Colors.primary;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.cardColor, borderColor: theme.border }]}>
      {/* Groups stat */}
      <View style={styles.statItem}>
        <Ionicons name="people" size={22} color={iconColor} style={styles.statIcon} />
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {stats.groups}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          Groups
        </Text>
      </View>
      
      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      
      {/* Items Added stat */}
      <View style={styles.statItem}>
        <Ionicons name="add-circle" size={22} color={iconColor} style={styles.statIcon} />
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {stats.itemsAdded}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          Items Added
        </Text>
      </View>
      
      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      
      {/* Searches stat */}
      <View style={styles.statItem}>
        <Ionicons name="search" size={22} color={iconColor} style={styles.statIcon} />
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {stats.searches}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          Searches
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  statIcon: {
    marginBottom: 8,
    opacity: 0.9,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: '70%',
    opacity: 0.6,
  },
});

export default ProfileStats; 