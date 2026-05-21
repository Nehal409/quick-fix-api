import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';

export interface TimelineStep {
  id: string;
  label: string;
  time: string;
  status: 'completed' | 'active' | 'pending';
  log?: string;
  eta?: string;
}

interface TrackingTimelineProps {
  steps: TimelineStep[];
}

export function TrackingTimeline({ steps }: TrackingTimelineProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepRow}>
          <View style={styles.leftCol}>
            <View 
              style={[
                styles.dot, 
                step.status === 'completed' && styles.dotCompleted,
                step.status === 'active' && styles.dotActive
              ]} 
            />
            {index < steps.length - 1 && (
              <View 
                style={[
                  styles.line, 
                  step.status === 'completed' && styles.lineCompleted
                ]} 
              />
            )}
          </View>
          <View style={styles.rightCol}>
            <View style={styles.textRow}>
              <Text style={[styles.label, step.status === 'pending' && styles.mutedText]}>
                {step.label}
              </Text>
              <Text style={styles.timeText}>{step.time}</Text>
            </View>
            
            {step.eta && (
              <Text style={styles.etaText}>Live · ETA {step.eta}</Text>
            )}

            {step.log && (
              <View style={styles.logBox}>
                <Text style={styles.logText}>{step.log}</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  leftCol: {
    alignItems: 'center',
    width: 30,
    marginRight: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginTop: 6,
    zIndex: 1,
  },
  dotCompleted: {
    backgroundColor: Colors.success,
  },
  dotActive: {
    backgroundColor: '#D94027',
    borderWidth: 2,
    borderColor: '#FFEBEE',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: Colors.success,
  },
  rightCol: {
    flex: 1,
    paddingBottom: 20,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  timeText: {
    fontSize: 11,
    color: Colors.muted,
  },
  mutedText: {
    color: Colors.muted,
  },
  etaText: {
    fontSize: 11,
    color: '#D94027',
    fontWeight: '600',
    marginTop: 2,
  },
  logBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: Radius.sm,
    padding: 10,
    marginTop: 8,
  },
  logText: {
    color: '#D4D4D4',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
