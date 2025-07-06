import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const PremiumColorSwatch = () => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Premium Color Palette</Text>
      
      <View style={styles.row}>
        <ColorBox color={Colors.premium} name="Premium" />
        <ColorBox color={Colors.premiumLight} name="Premium Light" />
        <ColorBox color={Colors.premiumDark} name="Premium Dark" />
      </View>
      
      <View style={styles.row}>
        <View style={[styles.box, { backgroundColor: theme.premiumBackground, borderColor: theme.premiumBorder }]}>
          <Text style={[styles.boxText, { color: theme.premiumText }]}>Theme Background</Text>
        </View>
        <View style={styles.box}>
          <Text style={[styles.boxText, { color: theme.premiumText }]}>Premium Text</Text>
        </View>
      </View>
      
      <View style={styles.gradientContainer}>
        <LinearGradient
          colors={[Colors.premiumGradientStart, Colors.premiumGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={styles.gradientText}>Premium Gradient</Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const ColorBox = ({ color, name }) => {
  return (
    <View style={[styles.box, { backgroundColor: color }]}>
      <Text style={styles.boxText}>{name}</Text>
      <Text style={styles.colorCode}>{color}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  box: {
    flex: 1,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  boxText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  colorCode: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  gradientContainer: {
    marginTop: 8,
  },
  gradient: {
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default PremiumColorSwatch; 