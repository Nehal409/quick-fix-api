import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Config from 'react-native-config';
import { authApi } from '../../lib/api';
import { mockLogin } from '../../lib/mockAuth';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import type { RootStackParams } from '../../navigation/types';
import type { User } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParams, 'Register'>;

const DEMO = Config.DEMO_MODE === 'true';

export function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !city || !sector) {
      Alert.alert(t('auth.error'), t('auth.fillAll'));
      return;
    }
    try {
      setLoading(true);
      if (DEMO) {
        const { token, user } = mockLogin(email, role);
        await setAuth(token, { ...user, name });
        return;
      }
      const { data } = await authApi.register({ email, password, name, role, city, sector });
      const token = (data as any).data?.token ?? data.token;
      const user = (data as any).data?.user ?? data.user ?? { id: '', email, name, role };
      await setAuth(token, user as User);
    } catch (err: any) {
      console.error('REGISTER_ERROR', JSON.stringify(err?.response?.data ?? err?.message ?? err));
      console.log("registrationerror", err);
      
      Alert.alert(t('auth.error'), t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Quickfix</Text>
          <LanguageSwitcher />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t('auth.registerTitle')}</Text>

          {/* Role selector */}
          <View style={styles.roleRow}>
            {(['customer', 'provider'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                  {t(`auth.role.${r}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={t('auth.fullName')}
            placeholderTextColor={Colors.muted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            placeholderTextColor={Colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder={t('auth.city')}
              placeholderTextColor={Colors.muted}
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder={t('auth.sector')}
              placeholderTextColor={Colors.muted}
              value={sector}
              onChangeText={setSector}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('auth.register')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>{t('auth.hasAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: {
    fontSize: 36,
    fontFamily: Fonts.latin.bold,
    color: Colors.primary,
    letterSpacing: -1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.muted,
    alignItems: 'center',
  },
  roleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  roleBtnText: { color: Colors.muted, fontFamily: Fonts.latin.medium },
  roleBtnTextActive: { color: Colors.primary },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginBottom: Spacing.sm,
    color: Colors.text,
    fontFamily: Fonts.latin.regular,
    fontSize: 15,
  },
  rowInputs: { flexDirection: 'row', gap: Spacing.sm },
  halfInput: { flex: 1 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontFamily: Fonts.latin.bold, fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: Spacing.md },
  linkText: { color: Colors.primary, fontFamily: Fonts.latin.medium },
});
