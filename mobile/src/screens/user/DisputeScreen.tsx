import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'Dispute'>;

const DISPUTE_REASONS = [
  { id: '1', label: 'Service was Incomplete', sub: 'Issue not fully resolved' },
  { id: '2', label: 'Price disagreement', sub: 'Charged more than quoted' },
  { id: '3', label: 'Property damage', sub: 'Provider damaged something' },
  { id: '4', label: 'No-show / very late', sub: "Provider didn't arrive on time" },
  { id: '5', label: 'Quality issue', sub: 'Work was poor' },
  { id: '6', label: 'Something else', sub: '' },
];

export function DisputeScreen({ navigation }: Props) {
  const [selectedReason, setSelectedReason] = useState('1');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Raise a dispute</Text>
          <Text style={styles.headerSub}>QF-2086 · Bilal AC Repair</Text>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🛈</Text>
          <Text style={styles.infoText}>
            We hold provider payout for 24 hours after dispute. Most cases resolve in {'<'} 6 hours.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHAT WENT WRONG?</Text>
          {DISPUTE_REASONS.map(reason => (
            <TouchableOpacity 
              key={reason.id} 
              style={[styles.reasonItem, selectedReason === reason.id && styles.reasonActive]}
              onPress={() => setSelectedReason(reason.id)}
            >
              <View style={styles.radio}>
                {selectedReason === reason.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.flex1}>
                <Text style={styles.reasonLabel}>{reason.label}</Text>
                {reason.sub ? <Text style={styles.reasonSub}>{reason.sub}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TELL US MORE</Text>
          <View style={styles.textareaWrapper}>
            <TextInput 
              style={styles.textarea}
              placeholder="Tell us about your issue..."
              multiline
              numberOfLines={4}
            />
            <Text style={styles.charCount}>72 / 500 CHARS</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EVIDENCE · OPTIONAL</Text>
          <View style={styles.evidenceContainer}>
            <TouchableOpacity style={styles.evidencePlaceholder}>
              <Text style={styles.evidenceText}>PHOTO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.evidencePlaceholder}>
              <Text style={styles.evidenceText}>VIDEO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
         <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.submitText}>Submit for review</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.muted,
  },
  container: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F0',
    margin: 20,
    padding: 16,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FFD8D6',
  },
  infoIcon: {
    fontSize: 16,
    color: '#D94027',
    marginRight: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#D94027',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: Radius.sm,
    marginBottom: 8,
  },
  reasonActive: {
    borderColor: '#D94027',
    backgroundColor: '#FFF2F0',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D94027',
  },
  flex1: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 14,
    fontFamily: Fonts.latin.medium,
    color: Colors.text,
  },
  reasonSub: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  textareaWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: Radius.sm,
    padding: 12,
  },
  textarea: {
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: Colors.muted,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  evidenceContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  evidencePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: Radius.sm,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderStyle: 'dashed',
  },
  evidenceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#CCC',
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  addIcon: {
    fontSize: 24,
    color: Colors.muted,
  },
  addText: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 4,
  },
  footer: {
     padding: 20,
     borderTopWidth: 1,
     borderTopColor: '#F0F0F0',
  },
  submitBtn: {
     backgroundColor: Colors.text,
     paddingVertical: 14,
     borderRadius: Radius.sm,
     alignItems: 'center',
  },
  submitText: {
     color: '#FFFFFF',
     fontSize: 15,
     fontWeight: '700',
  },
});
