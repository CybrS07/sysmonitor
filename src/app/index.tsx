import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppTabs from '@/components/app-tabs';

export default function IndexPage() {
  return (
    <View style={styles.container}>
      <AppTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F11',
  },
});