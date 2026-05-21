import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { applyLanguage } from '../../i18n';
import type { Language } from '../../types';

const LANG_CONFIG: Array<{
  key: Language;
  label: string;
  activeColor: string;
  lightColor: string;
}> = [
  { key: 'en',        label: 'EN',    activeColor: '#1A73E8', lightColor: '#E8F0FE' },
  { key: 'roman-ur',  label: 'RM',    activeColor: '#F4813A', lightColor: '#FEF0E8' },
  { key: 'ur',        label: 'اردو',  activeColor: '#34A853', lightColor: '#E6F4EA' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as Language;

  return (
    <View style={styles.row}>
      {LANG_CONFIG.map(({ key, label, activeColor, lightColor }) => {
        const active = current === key;
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.circle,
              {
                backgroundColor: active ? activeColor : lightColor,
                borderColor: active ? activeColor : '#D8D8D8',
              },
            ]}
            onPress={() => applyLanguage(key)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.label,
                key === 'ur' && styles.urduLabel,
                { color: active ? '#fff' : activeColor },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const CIRCLE_SIZE = 52;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  urduLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
