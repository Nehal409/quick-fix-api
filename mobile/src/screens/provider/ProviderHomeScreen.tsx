import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts } from '../../theme';

const ACCENT = '#C1440E';
const CREAM = '#F5F0EB';
const CARD_BG = '#FFFFFF';

const DAYS = [
  { label: 'M', val: 0 }, { label: 'T', val: 1 }, { label: 'W', val: 2, active: true },
  { label: 'T', val: 3 }, { label: 'F', val: 4 }, { label: 'S', val: 5 }, { label: 'S', val: 6 },
];

const EARNINGS_BARS = [
  { key: 'mon', day: 'M', h: 0.72, active: false },
  { key: 'tue', day: 'T', h: 0.55, active: false },
  { key: 'wed', day: 'W', h: 0.88, active: true },
  { key: 'thu', day: 'T', h: 0.3, active: false },
  { key: 'fri', day: 'F', h: 0.2, active: false },
  { key: 'sat', day: 'S', h: 0.15, active: false },
  { key: 'sun', day: 'S', h: 0.1, active: false },
];

function StatCard({ title, value, sub, icon, accent }: { title: string; value: string; sub: string; icon: string; accent?: boolean }) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
      {accent && <View style={styles.statBar}><View style={[styles.statBarFill, { width: '80%' }]} /></View>}
      {!accent && title === 'ON-TIME' && <View style={styles.statBar}><View style={[styles.statBarFill, { width: '96%', backgroundColor: '#2E7D32' }]} /></View>}
    </View>
  );
}

export function ProviderHomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Insights</Text>
          <Text style={styles.headerSub}>Week of Aug 19</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⇅</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Earnings card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>EARNINGS THIS WEEK</Text>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsValue}>Rs.  21,840</Text>
            <View style={styles.earningsBadge}>
              <Text style={styles.earningsBadgeText}>→ +18% vs last</Text>
            </View>
          </View>
          <Text style={styles.earningsProjected}>Projected by end of week · Rs. 32,000</Text>

          {/* Bar chart */}
          <View style={styles.chart}>
            {EARNINGS_BARS.map((b) => (
              <View key={b.key} style={styles.chartCol}>
                <View style={styles.chartTrack}>
                  <View style={[
                    styles.chartBar,
                    { height: `${b.h * 100}%` },
                    b.active && styles.chartBarActive,
                  ]} />
                </View>
                <Text style={[styles.chartLabel, b.active && styles.chartLabelActive]}>{b.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stat grid */}
        <View style={styles.statGrid}>
          <StatCard title="JOBS TODAY" value="4" sub="of 5 planned" icon="📦" accent />
          <StatCard title="ON-TIME" value="96%" sub="last 30 jobs" icon="🕐" />
        </View>
        <View style={styles.statGrid}>
          <StatCard title="RATING" value="4.6 ★★★★☆" sub="from 88 reviews" icon="" />
          <StatCard title="CANCEL RATE" value="1.2%" sub="below 5% target" icon="" />
        </View>

        {/* Busiest hours */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BUSIEST HOURS · FORECAST</Text>
        </View>
        <View style={styles.forecastCard}>
          <View style={styles.forecastChart}>
            {['8','9','10','11','12','1','2','3','4','5','6','7'].map((h, i) => (
              <View key={h} style={styles.forecastCol}>
                <View style={[
                  styles.forecastBar,
                  { height: [20,35,55,60,50,30,70,65,40,25,15,10][i] },
                ]} />
                <Text style={styles.forecastLabel}>{h}</Text>
              </View>
            ))}
          </View>
          <View style={styles.aiSuggestion}>
            <Text style={styles.aiDot}>✦</Text>
            <Text style={styles.aiText}>
              Open <Text style={styles.aiHighlight}>4–6 PM slot</Text> tomorrow — agent expects +3 requests
            </Text>
          </View>
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: 24, fontFamily: Fonts.latin.bold, color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  filterBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { fontSize: 20, color: '#1A1A1A' },

  earningsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: CARD_BG,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  earningsLabel: { fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 8 },
  earningsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  earningsValue: { fontSize: 32, fontFamily: Fonts.latin.bold, color: '#1A1A1A' },
  earningsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  earningsBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  earningsProjected: { fontSize: 12, color: '#999', marginTop: 4, marginBottom: 20 },

  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 6 },
  chartCol: { flex: 1, alignItems: 'center' },
  chartTrack: { width: '100%', height: 48, justifyContent: 'flex-end' },
  chartBar: { width: '100%', backgroundColor: '#E0E0E0', borderRadius: 3 },
  chartBarActive: { backgroundColor: ACCENT },
  chartLabel: { fontSize: 9, color: '#999', marginTop: 4, fontWeight: '600' },
  chartLabelActive: { color: ACCENT, fontWeight: '800' },

  statGrid: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginTop: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: Radius.card,
    padding: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  statCardAccent: {},
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statTitle: { fontSize: 9, fontWeight: '800', color: '#999', letterSpacing: 0.8 },
  statIcon: { fontSize: 16 },
  statValue: { fontSize: 22, fontFamily: Fonts.latin.bold, color: '#1A1A1A', marginTop: 2 },
  statValueAccent: { color: '#1A1A1A' },
  statSub: { fontSize: 11, color: '#999', marginTop: 2 },
  statBar: { height: 3, backgroundColor: '#F0F0F0', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  statBarFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },

  sectionHeader: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#999', letterSpacing: 1 },

  forecastCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: CARD_BG,
    borderRadius: Radius.card,
    padding: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  forecastChart: { flexDirection: 'row', alignItems: 'flex-end', height: 64, gap: 4, marginBottom: 16 },
  forecastCol: { flex: 1, alignItems: 'center' },
  forecastBar: { width: '60%', backgroundColor: '#E8E0D8', borderRadius: 2 },
  forecastLabel: { fontSize: 9, color: '#BBB', marginTop: 4 },
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8F5',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0E0D8',
  },
  aiDot: { fontSize: 12, color: ACCENT, marginTop: 1 },
  aiText: { flex: 1, fontSize: 12, color: '#666', lineHeight: 17 },
  aiHighlight: { fontWeight: '700', color: '#1A1A1A' },
});
