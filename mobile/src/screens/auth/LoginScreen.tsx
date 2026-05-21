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

type Nav = NativeStackNavigationProp<RootStackParams, 'Login'>;

const DEMO = Config.DEMO_MODE === 'true';

function decodeJwt(token: string): { bauserId?: number; role?: 'customer' | 'provider' } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    
    const decoded = decodeURIComponent(
      padded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

export function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState(DEMO ? 'demo@quickfix.pk' : '');
  const [password, setPassword] = useState(DEMO ? 'demo1234' : '');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.error'), t('auth.fillAll'));
      return;
    }
    try {
      setLoading(true);
      if (DEMO) {
        const { token, user } = mockLogin(email, role);
        await setAuth(token, user);
        return;
      }
      const { data } = await authApi.login(email, password);
      console.log('Login Response Data:', data);
      
      const token = (data as any)?.data?.token || data?.token;
      if (!token) {
        throw new Error('Server did not return a valid authentication token.');
      }
      
      // Decode JWT token to extract user details since the backend response doesn't provide a nested user object
      const decoded = decodeJwt(token);
      const user: User = {
        id: decoded?.bauserId?.toString() || 'user-' + Date.now(),
        email: email,
        name: email.split('@')[0] || 'User',
        role: decoded?.role || role,
      };
      
      await setAuth(token, user);
    } catch (err: any) {
      console.error('Login error:', err);
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
      const errorMessage = serverMessage || err?.message || t('auth.loginFailed');
      Alert.alert(t('auth.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandLabel}>quickfix.</Text>
          </View>
          <Text style={styles.displayHeading}>
            {'Service\nthat thinks\n'}
            <Text style={styles.displayHeadingAccent}>{'before it acts.'}</Text>
          </Text>
          <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          <LanguageSwitcher />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{t('auth.loginTitle')}</Text>

          {/* Role selector */}
          <View style={styles.roleRow}>
            {(['customer', 'provider'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.roleBtnText,
                    role === r && styles.roleBtnTextActive,
                  ]}
                >
                  {t(`auth.role.${r}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('auth.login')}</Text>
            )}
          </TouchableOpacity>

          {DEMO && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoText}>Demo Mode — tap Log In to continue</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>{t('auth.noAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text,
  },
  brandLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 0.2,
  },
  displayHeading: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  displayHeadingAccent: {
    fontSize: 36,
    fontWeight: '800',
    color: '#D94027',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  // Role selector ─────────────────────────────────────
  roleRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  roleBtnTextActive: {
    color: '#fff',
  },
  // Inputs ─────────────────────────────────────────────
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    marginBottom: Spacing.sm,
    color: Colors.text,
    fontSize: 15,
    backgroundColor: Colors.background,
  },
  // Buttons ────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  demoBadge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.warning + '30',
    borderRadius: Radius.sm,
    paddingVertical: 6,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  linkBtn: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: 4,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 14,
  },
});
