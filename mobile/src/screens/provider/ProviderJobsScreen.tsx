import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Radius, Fonts } from '../../theme';

const ACCENT = '#C1440E';
const CREAM = '#F5F0EB';

const WEEK_DAYS = [
  { short: 'MON', num: 19, dots: 2 },
  { short: 'TUE', num: 20, dots: 1 },
  { short: 'WED', num: 21, dots: 4, active: true },
  { short: 'THU', num: 22, dots: 3 },
  { short: 'FRI', num: 23, dots: 1 },
  { short: 'SAT', num: 24, dots: 2 },
  { short: 'SUN', num: 25, dots: 1 },
];

type Job = {
  id: string;
  hour: number;
  duration: number;
  title: string;
  customer: string;
  location: string;
  tag: string;
  code?: string;
  variant: 'dark' | 'active' | 'suggested' | 'default';
};

const JOBS: Job[] = [
  {
    id: '1', hour: 9, duration: 1,
    title: 'AC service', customer: 'Saira A.',
    location: 'F-11', tag: 'routine',
    variant: 'dark',
  },
  {
    id: '2', hour: 10, duration: 2,
    title: 'AC repair', customer: 'Hassan I.',
    location: 'G-13/3 · inverter', tag: 'IN PROGRESS',
    code: 'QF-2086', variant: 'active',
  },
  {
    id: '3', hour: 14, duration: 1,
    title: 'AI: open slot · high demand', customer: '',
    location: '', tag: 'SUGGESTED',
    variant: 'suggested',
  },
  {
    id: '4', hour: 16, duration: 2,
    title: 'AC install', customer: 'Mehdi K.',
    location: 'I-8 · complex', tag: '',
    code: 'QF-2091', variant: 'default',
  },
];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const HOUR_H = 72;

function fmt12(h: number) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12} ${suffix}`;
}

export function ProviderJobsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(21);
  const [accepted, setAccepted] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Today · Wed Aug 21</Text>
          <Text style={styles.headerSub}>4 jobs · Rs. 11,400 expected</Text>
        </View>
        <TouchableOpacity style={styles.calBtn}>
          <Text style={styles.calIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* Week strip */}
      <View style={styles.weekStrip}>
        {WEEK_DAYS.map((d) => (
          <TouchableOpacity
            key={d.num}
            style={[styles.dayCol, d.num === selectedDay && styles.dayColActive]}
            onPress={() => setSelectedDay(d.num)}
          >
            <Text style={[styles.dayShort, d.num === selectedDay && styles.dayShortActive]}>{d.short}</Text>
            <Text style={[styles.dayNum, d.num === selectedDay && styles.dayNumActive]}>{d.num}</Text>
            <View style={styles.dotsRow}>
              {Array.from({ length: Math.min(d.dots, 4) }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, d.num === selectedDay && styles.dotActive]}
                />
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <View style={styles.timeline}>
          {/* Hour labels + blocks */}
          {HOURS.map((hour) => {
            const job = JOBS.find(j => j.hour === hour);
            return (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourLabel}>{fmt12(hour)}</Text>
                <View style={styles.hourLine} />
                {job && <JobBlock job={job} accepted={accepted} onAccept={() => setAccepted(true)} />}
              </View>
            );
          })}
        </View>

        {/* AI footer note */}
        <View style={styles.aiFooter}>
          <Text style={styles.aiFooterIcon}>🚗</Text>
          <Text style={styles.aiFooterText}>
            22 min travel buffer between G-13 and I-8 · scheduling engine{' '}
            <Text style={styles.aiFooterTick}>✓</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function JobBlock({ job, accepted, onAccept }: { job: Job; accepted: boolean; onAccept: () => void }) {
  const height = job.duration * HOUR_H - 8;

  if (job.variant === 'suggested' && accepted) return null;

  return (
    <View style={[
      styles.jobBlock,
      { height },
      job.variant === 'dark' && styles.jobDark,
      job.variant === 'active' && styles.jobActive,
      job.variant === 'suggested' && styles.jobSuggested,
      job.variant === 'default' && styles.jobDefault,
    ]}>
      {job.variant === 'suggested' && (
        <Text style={styles.suggestedTag}>✦ SUGGESTED</Text>
      )}
      {job.variant === 'active' && (
        <View style={styles.activeTag}>
          <View style={styles.activeDot} />
          <Text style={styles.activeTagText}>IN PROGRESS</Text>
        </View>
      )}

      <Text style={[
        styles.jobTitle,
        (job.variant === 'dark' || job.variant === 'active') && styles.jobTitleLight,
        job.variant === 'suggested' && styles.jobTitleSuggested,
      ]}>
        {job.title}{job.customer ? ` · ${job.customer}` : ''}
      </Text>

      {(job.location || job.tag) && (
        <Text style={[
          styles.jobMeta,
          (job.variant === 'dark' || job.variant === 'active') && styles.jobMetaLight,
        ]}>
          {[job.location, job.tag].filter(Boolean).join(' · ')}
        </Text>
      )}
      {job.code && (
        <Text style={[styles.jobCode, job.variant === 'active' && styles.jobCodeLight]}>
          {job.code}
        </Text>
      )}

      {job.variant === 'suggested' && (
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: CREAM,
  },
  headerTitle: { fontSize: 18, fontFamily: Fonts.latin.bold, color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  calBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  calIcon: { fontSize: 20 },

  weekStrip: {
    flexDirection: 'row',
    backgroundColor: CREAM,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D8',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  dayColActive: { backgroundColor: '#1A1A1A' },
  dayShort: { fontSize: 9, fontWeight: '700', color: '#999', letterSpacing: 0.5 },
  dayShortActive: { color: '#fff' },
  dayNum: { fontSize: 16, fontFamily: Fonts.latin.bold, color: '#1A1A1A', marginVertical: 2 },
  dayNumActive: { color: '#fff' },
  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: ACCENT },
  dotActive: { backgroundColor: '#fff' },

  timeline: { paddingTop: 8, paddingHorizontal: Spacing.lg },
  hourRow: {
    height: HOUR_H,
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  hourLabel: {
    width: 44,
    fontSize: 11,
    color: '#AAA',
    paddingTop: 2,
    fontWeight: '500',
  },
  hourLine: {
    position: 'absolute',
    left: 44,
    right: 0,
    top: 10,
    height: 1,
    backgroundColor: '#E8E0D8',
  },

  jobBlock: {
    position: 'absolute',
    left: 52,
    right: 0,
    top: 4,
    borderRadius: 10,
    padding: 12,
    overflow: 'hidden',
  },
  jobDark: { backgroundColor: '#1A1A1A' },
  jobActive: { backgroundColor: ACCENT },
  jobSuggested: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderStyle: 'dashed',
  },
  jobDefault: { backgroundColor: '#EDE8E2' },

  suggestedTag: { fontSize: 9, fontWeight: '800', color: ACCENT, letterSpacing: 0.8, marginBottom: 4 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  activeTagText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },

  jobTitle: { fontSize: 14, fontFamily: Fonts.latin.bold, color: '#1A1A1A' },
  jobTitleLight: { color: '#fff' },
  jobTitleSuggested: { color: ACCENT, fontStyle: 'italic' },
  jobMeta: { fontSize: 11, color: '#666', marginTop: 2 },
  jobMetaLight: { color: 'rgba(255,255,255,0.75)' },
  jobCode: { fontSize: 10, color: '#999', marginTop: 2 },
  jobCodeLight: { color: 'rgba(255,255,255,0.5)' },

  acceptBtn: {
    marginTop: 8,
    backgroundColor: ACCENT,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  aiFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: Spacing.lg,
    marginTop: 16,
    backgroundColor: '#EDE8E2',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  aiFooterIcon: { fontSize: 14 },
  aiFooterText: { flex: 1, fontSize: 12, color: '#666', lineHeight: 17 },
  aiFooterTick: { color: '#2E7D32', fontWeight: '700' },
});
