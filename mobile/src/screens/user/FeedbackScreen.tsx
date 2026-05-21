import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'Feedback'>;

const FEEDBACK_TAGS = ['On time', 'Tidy', 'Explained well', 'Fair price', 'Skilled', 'Friendly'];
const CHECKLIST = [
  'Diagnosed cooling fault',
  'Replaced capacitor',
  'Refilled R-410A refrigerant',
  'Test ran 30 min · temp stable at 22°C',
  'Photo evidence uploaded',
];

export function FeedbackScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['On time', 'Tidy', 'Explained well']);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job complete</Text>
        <View style={styles.paidBadge}>
          <Text style={styles.paidText}>Paid · cash</Text>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
             <View style={styles.successIcon}>
               <Text style={styles.checkIcon}>✓</Text>
             </View>
             <View>
               <Text style={styles.summaryTitle}>AC repaired</Text>
               <Text style={styles.summarySub}>2 hr 14 min - Rs. 3,260 charged</Text>
             </View>
          </View>
          
          <View style={styles.providerRow}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>B</Text>
            </View>
            <View>
              <Text style={styles.providerName}>Bilal AC Repair</Text>
              <Text style={styles.providerTime}>Today · 10:14 AM → 12:28 PM</Text>
            </View>
          </View>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.sectionTitle}>HOW WAS IT?</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={[styles.star, s <= rating ? styles.starActive : styles.starInactive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>Excellent - 5 / 5</Text>
          </View>

          <View style={styles.tagsContainer}>
            {FEEDBACK_TAGS.map(tag => (
              <TouchableOpacity 
                key={tag} 
                style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.notesBox}>
            <Text style={styles.label}>OPTIONAL NOTES</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                placeholder="Tell us what stood out..." 
                style={styles.input}
                multiline
              />
              <Text style={styles.micIcon}>🎙️</Text>
            </View>
          </View>
        </View>

        <View style={styles.checklistSection}>
          <Text style={styles.sectionTitle}>COMPLETION CHECKLIST</Text>
          {CHECKLIST.map((item, i) => (
             <View key={i} style={styles.checkRow}>
                <View style={styles.checkBox}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
                <Text style={styles.checkText}>{item}</Text>
             </View>
          ))}
          <TouchableOpacity style={styles.photoRow}>
             <Text style={styles.photoIcon}>🖼️</Text>
             <Text style={styles.photoText}>Photo evidence uploaded</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.stickyFooter}>
        <TouchableOpacity 
          style={styles.reportBtn}
          onPress={() => navigation.navigate('Dispute', { bookingId })}
        >
          <Text style={styles.reportIcon}>🚩</Text>
          <Text style={styles.reportText}>Report issue</Text>
        </TouchableOpacity>
        <TouchableOpacity 
           style={styles.submitBtn}
           onPress={() => navigation.navigate('UserTabs')}
        >
          <Text style={styles.submitText}>Submit feedback</Text>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
    marginLeft: 8,
  },
  paidBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  container: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F8F9FA',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: Radius.card,
    marginBottom: 16,
  },
  successIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: Fonts.latin.bold,
    color: '#2E7D32',
  },
  summarySub: {
    fontSize: 12,
    color: '#2E7D32',
    opacity: 0.8,
    marginTop: 2,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  providerName: {
    fontSize: 15,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  providerTime: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  feedbackSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 8,
    borderBottomColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 20,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  star: {
    fontSize: 32,
  },
  starActive: {
    color: '#F4B400',
  },
  starInactive: {
    color: '#E0E0E0',
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F4',
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  tagActive: {
    backgroundColor: '#202124',
    borderColor: '#202124',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  notesBox: {
    marginTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  micIcon: {
    fontSize: 18,
    marginLeft: 10,
  },
  checklistSection: {
    padding: 16,
    paddingBottom: 100,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkMark: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: 'bold',
  },
  checkText: {
    fontSize: 14,
    color: Colors.text,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  photoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  photoText: {
    fontSize: 13,
    color: Colors.muted,
    textDecorationLine: 'underline',
  },
  stickyFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  reportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F3F4',
    paddingVertical: 14,
    borderRadius: Radius.sm,
    gap: 8,
  },
  reportIcon: {
    fontSize: 14,
  },
  reportText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  submitBtn: {
    flex: 1.5,
    backgroundColor: Colors.text,
    paddingVertical: 14,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
