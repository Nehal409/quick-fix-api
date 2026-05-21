import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme';
import { useAuthStore } from '../../store/authStore';

export function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.name ?? 'User'}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 12 },
  name: { fontSize: 20, fontWeight: '600', color: Colors.text },
  email: { fontSize: 14, color: Colors.muted },
  logoutBtn: { marginTop: 24, backgroundColor: Colors.danger, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '600' },
});
