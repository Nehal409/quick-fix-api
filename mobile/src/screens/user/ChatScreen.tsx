import React, { useState, useRef, useCallback, useEffect } from 'react';
import Config from 'react-native-config';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { requestsApi, bookingsApi } from '../../lib/api';
import { Colors, Spacing, Radius } from '../../theme';
import type {
  ApiRequestEnvelope,
  ApiClarification,
  IntentData,
  Candidate,
  Language,
} from '../../types';
import { ReasoningPanel } from '../../components/chat/ReasoningPanel';
import { PriceQuoteCard } from '../../components/chat/PriceQuoteCard';
import { BookingConfirmCard } from '../../components/chat/BookingConfirmCard';
import type { RootStackParams } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParams>;

// ── Message types ─────────────────────────────────────
type ChatMsg =
  | { id: string; type: 'agent' | 'user'; text: string }
  | { id: string; type: 'typing' }
  | { id: string; type: 'intent_card'; requestId: string; intent: IntentData; candidates: Candidate[] }
  | { id: string; type: 'clarification_card'; requestId: string; clarifications: ApiClarification[] }
  | { id: string; type: 'providers_found'; requestId: string; count: number; requestIdRef: string; candidatesRef: Candidate[]; intentRef: IntentData }
  | { id: string; type: 'reasoning_panel'; candidate: Candidate }
  | { id: string; type: 'price_quote_card'; requestId: string; candidate: Candidate; intent: IntentData }
  | { id: string; type: 'booking_confirm_card'; booking: any };



const GREETING = "I'm Quickfix. What do you need fixed? You can type in any language — even mix them.";

// ── Sub-components ────────────────────────────────────

function AgentBubble({ text }: { text: string }) {
  return (
    <View style={styles.agentRow}>
      <View style={styles.agentAvatar}>
        <Text style={styles.agentAvatarText}>Q</Text>
      </View>
      <View style={styles.agentBubble}>
        <Text style={styles.agentText}>{text}</Text>
      </View>
    </View>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.agentRow}>
      <View style={styles.agentAvatar}>
        <Text style={styles.agentAvatarText}>Q</Text>
      </View>
      <View style={styles.agentBubble}>
        <Text style={styles.typingText}>agent · parsing intent…</Text>
      </View>
    </View>
  );
}

// ── Intent Confirm Card (Screen 03) ──────────────────
function IntentCard({
  requestId,
  intent,
  candidates,
  onFindProviders,
}: {
  requestId: string;
  intent: IntentData;
  candidates: Candidate[];
  onFindProviders: (requestId: string, candidates: Candidate[], intent: IntentData) => void;
}) {
  const pct = Math.round(intent.confidence * 100);
  const locationStr = [intent.location?.sector, intent.location?.city].filter(Boolean).join(', ') || '—';
  const fields = [
    { icon: '🔧', label: 'SERVICE', value: intent.service?.label ?? '—', chip: intent.service?.severity ?? null },
    { icon: '📍', label: 'LOCATION', value: locationStr, chip: null },
    { icon: '🕐', label: 'WHEN', value: intent.when?.window ?? '—', chip: null, note: intent.when?.start ?? undefined },
    { icon: '💰', label: 'BUDGET', value: intent.budget?.max ? `Up to Rs. ${intent.budget.max.toLocaleString()}` : '—', chip: intent.budget?.priceSensitive ? 'price-sensitive' : null },
    { icon: '⚡', label: 'URGENCY', value: intent.urgency, chip: null },
  ];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Here's what I understood</Text>
        <Text style={styles.cardSub}>Tap any line to edit</Text>
      </View>

      {/* Confidence badge */}
      <View style={[styles.badge, styles.badgeSuccess]}>
        <Text style={[styles.badgeDot, styles.badgeSuccessText]}>●</Text>
        <Text style={[styles.badgeText, styles.badgeSuccessText]}>
          Confidence {pct}% · {intent.extractedFields?.length ?? fields.length} fields extracted
        </Text>
      </View>

      {/* Fields */}
      {fields.map((f) => (
        <View key={f.label} style={styles.intentRow}>
          <Text style={styles.intentIcon}>{f.icon}</Text>
          <View style={styles.intentContent}>
            <Text style={styles.intentLabel}>{f.label}</Text>
            <Text style={styles.intentValue}>{f.value}</Text>
            {f.note && <Text style={styles.intentNote}>{f.note}</Text>}
            {f.chip && (
              <View style={styles.chipWrap}>
                <Text style={styles.chip}>{f.chip}</Text>
              </View>
            )}
          </View>
          <Text style={styles.editIcon}>✏️</Text>
        </View>
      ))}

      {/* Glosses (word-by-word translation from mixed-language input) */}
      {intent.glosses && intent.glosses.length > 0 && (
        <View style={styles.parsedBox}>
          <Text style={styles.parsedLabel}>How I parsed this:</Text>
          <Text style={styles.parsedText}>{intent.glosses.map(g => `${g.ur} → ${g.en}`).join('  ·  ')}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryCardBtn}
          onPress={() => onFindProviders(requestId, candidates, intent)}
        >
          <Text style={styles.primaryCardBtnText}>Find providers →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Clarification Card ────────────────────────────────
function ClarificationCard({
  requestId,
  clarifications,
  onSubmit,
}: {
  requestId: string;
  clarifications: ApiClarification[];
  onSubmit: (requestId: string, answers: Record<string, string>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isComplete = clarifications.every((c) => (answers[c.id] ?? '').trim().length > 0);
  const canSubmit = isComplete && !submitting;

  return (
    <View style={styles.card}>
      {/* Agent trace badge */}
      <View style={styles.clarifyBadge}>
        <Text style={styles.clarifyBadgeText}>✦ AGENT · NEEDS INFO</Text>
      </View>

      {clarifications.map((c, idx) => (
        <View key={c.id} style={[styles.clarifyBlock, idx > 0 && styles.clarifyBlockBorder]}>
          <Text style={styles.clarifyPrompt}>{c.prompt}</Text>
          <TextInput
            style={styles.clarifyInput}
            placeholder="Type your answer…"
            placeholderTextColor={Colors.muted}
            value={answers[c.id] ?? ''}
            onChangeText={(v) => setAnswers((a) => ({ ...a, [c.id]: v }))}
            editable={!submitting}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.primaryCardBtn, !canSubmit && styles.primaryCardBtnDisabled]}
        onPress={() => {
          if (!canSubmit) return;
          setSubmitting(true);
          onSubmit(requestId, answers);
        }}
        disabled={!canSubmit}
      >
        <Text style={styles.primaryCardBtnText}>{submitting ? 'Sending…' : 'Confirm →'}</Text>
      </TouchableOpacity>
    </View>
  );
}


// ── Main ChatScreen ───────────────────────────────────
export function ChatScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const chatStore = useChatStore();
  const insets = useSafeAreaInsets();
  const [sessionLoading, setSessionLoading] = useState(true);

  const greeting: ChatMsg = { id: '0', type: 'agent', text: `Hi! ${user?.name ?? 'there'} ${GREETING}` };
  const [messages, setMessages] = useState<ChatMsg[]>([greeting]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const listRef = useRef<FlatList>(null);
  const activeRequestId = useRef<string | null>(null);

  const currentLang = (i18n.language as Language) ?? 'en';

  const addMsg = useCallback((msg: ChatMsg) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // ── Auto-save session on every message change ────────
  useEffect(() => {
    if (!activeRequestId.current || sessionLoading) return;
    const toSave = messages.filter((m) => m.type !== 'typing');
    chatStore.save(activeRequestId.current, toSave);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ── Restore session on mount ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      const { requestId, messages: saved } = await chatStore.restore();
      if (cancelled) return;

      if (requestId && saved && (saved as ChatMsg[]).length > 1) {
        activeRequestId.current = requestId;
        setMessages(saved as ChatMsg[]);
        // Sync with server to pick up any state changes since last open
        try {
          const { data } = await requestsApi.getChat(requestId);
          if (cancelled) return;
          const lastMsg = (saved as ChatMsg[]).at(-1);
          if (
            (data.status === 'ready' || data.status === 'matched') &&
            data.intent &&
            lastMsg?.type !== 'intent_card' &&
            lastMsg?.type !== 'providers_found' &&
            lastMsg?.type !== 'price_quote_card'
          ) {
            setMessages((prev) => [
              ...prev.filter((m) => m.type !== 'typing'),
              { id: Date.now().toString(), type: 'intent_card', requestId, intent: data.intent!, candidates: data.candidates ?? [] },
            ]);
          } else if (
            data.status === 'needs_clarification' &&
            data.clarifications?.length &&
            lastMsg?.type !== 'clarification_card'
          ) {
            setMessages((prev) => [
              ...prev.filter((m) => m.type !== 'typing'),
              { id: Date.now().toString(), type: 'clarification_card', requestId, clarifications: data.clarifications! },
            ]);
          }
        } catch {
          // Offline — work from local cache
        }
      }
      setSessionLoading(false);
    }
    restoreSession();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle API response ─────────────────────────────
  const handleRequestResponse = useCallback(
    (envelope: ApiRequestEnvelope) => {
      setProcessing(false);
      setMessages((prev) => prev.filter((m) => m.type !== 'typing'));
      const res = envelope.data;
      activeRequestId.current = res.requestId;

      if (res.status === 'needs_clarification' && res.clarifications?.length) {
        addMsg({
          id: Date.now().toString(),
          type: 'clarification_card',
          requestId: res.requestId,
          clarifications: res.clarifications,
        });
      } else if ((res.status === 'ready' || res.status === 'matched') && res.intent) {
        addMsg({
          id: Date.now().toString(),
          type: 'intent_card',
          requestId: res.requestId,
          intent: res.intent,
          candidates: res.candidates ?? [],
        });
      } else {
        addMsg({
          id: Date.now().toString(),
          type: 'agent',
          text: "I've processed your request. Let me know if you'd like to continue.",
        });
      }
    },
    [addMsg],
  );

  // ── Send message ────────────────────────────────────
  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || processing) return;
      setInput('');
      addMsg({ id: Date.now().toString(), type: 'user', text });
      setProcessing(true);
      addMsg({ id: 'typing', type: 'typing' });

      try {
        const { data } = await requestsApi.create(text, currentLang);
        handleRequestResponse(data);
      } catch (err: unknown) {
        setProcessing(false);
        setMessages((prev) => prev.filter((m) => m.type !== 'typing'));
        const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        addMsg({ id: Date.now().toString(), type: 'agent', text: msg });
      }
    },
    [processing, currentLang, addMsg, handleRequestResponse],
  );

  // ── Show providers ───────────────────────────────────
  const handleFindProviders = useCallback(
    (requestId: string, candidates: Candidate[], intent: IntentData) => {
      if (!candidates.length) {
        addMsg({ id: Date.now().toString(), type: 'agent', text: 'No providers found in your area right now.' });
        return;
      }
      addMsg({
        id: Date.now().toString(),
        type: 'providers_found',
        requestId,
        count: candidates.length,
        requestIdRef: requestId,
        candidatesRef: candidates,
        intentRef: intent,
      });
      navigation.navigate('Providers', { requestId, candidates, intent });
    },
    [addMsg, navigation],
  );

  // ── Clarify ─────────────────────────────────────────
  const handleClarify = useCallback(
    async (requestId: string, answers: Record<string, string>) => {
      setProcessing(true);
      addMsg({ id: 'typing', type: 'typing' });
      try {
        const { data } = await requestsApi.clarify(requestId, answers);
        const res = data.data;
        setProcessing(false);
        setMessages((prev) => prev.filter((m) => m.type !== 'typing'));
        activeRequestId.current = res.requestId;

        if ((res.status === 'ready' || res.status === 'matched') && res.intent && res.candidates?.length) {
          handleFindProviders(res.requestId, res.candidates, res.intent);
        } else if (res.status === 'needs_clarification' && res.clarifications?.length) {
          addMsg({ id: Date.now().toString(), type: 'clarification_card', requestId: res.requestId, clarifications: res.clarifications });
        } else {
          addMsg({ id: Date.now().toString(), type: 'agent', text: "I've processed your request. Let me know if you'd like to continue." });
        }
      } catch {
        setProcessing(false);
        setMessages((prev) => prev.filter((m) => m.type !== 'typing'));
        addMsg({ id: Date.now().toString(), type: 'agent', text: 'Could not process your answers. Please try again.' });
      }
    },
    [addMsg, handleFindProviders],
  );

  // ── Final Booking ───────────────────────────────────
  const handleFinalBook = useCallback(
    async (requestId: string, candidate: Candidate, intent: IntentData) => {
      setProcessing(true);
      addMsg({ id: 'typing', type: 'typing' });
      try {
        let bookingData;
        const isDemo = Config.DEMO_MODE !== 'false'; // Default to demo if not explicitly false
        
        if (isDemo) {
          await new Promise(resolve => setTimeout(() => resolve(null), 1200));
          const demoLocation = [intent?.location?.sector, intent?.location?.city].filter(Boolean).join(', ');
          bookingData = {
            id: 'BK-' + Math.floor(Math.random() * 10000),
            status: 'confirmed',
            provider: candidate,
            scheduledAt: intent?.when?.window ?? 'Today',
            totalPrice: 3200,
            address: demoLocation || 'Karachi',
            service: intent?.service?.label || 'AC Repair',
            whatsappPayload: {
              target: candidate.displayName,
              message: `Hi, a new booking has been confirmed for ${intent?.when?.window || 'tomorrow'}.`,
            }
          };
        } else {
          const { data } = await bookingsApi.create({
            requestId,
            providerId: candidate.providerId,
            ...(intent.when?.start ? { scheduledAt: intent.when.start } : {}),
          });
          bookingData = data;
        }

        setProcessing(false);
        setMessages((prev) => prev.filter((m) => m.type !== 'typing'));
        await chatStore.clear();
        activeRequestId.current = null;
        navigation.navigate('BookingSuccess', { booking: bookingData });
      } catch (err: any) {
        console.error('[Booking Error]', err);
        setProcessing(false);
        setMessages((prev) => prev.filter((m) => m.type !== 'typing'));
        const errorMessage = err?.message || 'Something went wrong';
        addMsg({ 
          id: Date.now().toString(), 
          type: 'agent', 
          text: `Booking failed: ${errorMessage}. (Using DEMO_MODE=${Config.DEMO_MODE})` 
        });
      }
    },
    [addMsg, chatStore, navigation, setMessages, setProcessing]
  );

  // ── Render message ───────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ChatMsg }) => {
      switch (item.type) {
        case 'agent':
          return <AgentBubble text={item.text} />;
        case 'user':
          return <UserBubble text={item.text} />;
        case 'typing':
          return <TypingIndicator />;
        case 'intent_card':
          return (
            <IntentCard
              requestId={item.requestId}
              intent={item.intent}
              candidates={item.candidates}
              onFindProviders={handleFindProviders}
            />
          );
        case 'clarification_card':
          return (
            <ClarificationCard
              requestId={item.requestId}
              clarifications={item.clarifications}
              onSubmit={handleClarify}
            />
          );
        case 'providers_found':
          return (
            <View style={styles.agentRow}>
              <View style={styles.agentAvatar}>
                <Text style={styles.agentAvatarText}>Q</Text>
              </View>
              <View style={[styles.agentBubble, styles.providersFoundBubble]}>
                <Text style={styles.agentText}>
                  Found <Text style={styles.providersFoundCount}>{item.count} providers</Text> for your request!
                </Text>
                <TouchableOpacity
                  style={styles.viewMatchesBtn}
                  onPress={() => navigation.navigate('Providers', { requestId: item.requestIdRef, candidates: item.candidatesRef, intent: item.intentRef })}
                >
                  <Text style={styles.viewMatchesBtnText}>View matches →</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        case 'reasoning_panel':
          return (
            <ReasoningPanel
              candidate={item.candidate}
              onContinue={(_c) => {
                const prev = messages.find(m => m.type === 'providers_found') as any;
                if (prev) navigation.navigate('Providers', { requestId: prev.requestIdRef, candidates: prev.candidatesRef, intent: prev.intentRef });
              }}
              onClose={() => {}}
            />
          );
        case 'price_quote_card':
          return (
            <PriceQuoteCard
              candidate={item.candidate}
              budgetCap={item.intent.budget?.max ?? null}
              onBook={() => handleFinalBook(item.requestId, item.candidate, item.intent)}
            />
          );
        case 'booking_confirm_card':
          return (
            <BookingConfirmCard
              booking={item.booking}
              onTrack={() => navigation.navigate('ActiveBooking', { bookingId: item.booking.id })}
            />
          );
        default:
          return null;
      }
    },
    [handleFindProviders, handleClarify, handleFinalBook, messages, navigation],
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      {/* Safe-area top spacer */}
      <View style={{ height: insets.top, backgroundColor: Colors.surface }} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>New request</Text>
          <Text style={styles.headerSub}>Quickfix Agent · online</Text>
        </View>
        <View style={styles.headerRight}>
          {activeRequestId.current && (
            <TouchableOpacity
              style={styles.newChatBtn}
              onPress={async () => {
                await chatStore.clear();
                activeRequestId.current = null;
                setMessages([greeting]);
                setInput('');
              }}
            >
              <Text style={styles.newChatBtnText}>+ New</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.globeBtn}>
            <Text style={styles.globeIcon}>🌐</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Message list */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />


      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.plusBtn}>
          <Text style={styles.plusIcon}>+</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={Colors.muted}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
        />
        {processing ? (
          <ActivityIndicator color={Colors.primary} style={styles.micBtn} />
        ) : (
          <TouchableOpacity
            style={[styles.micBtn, input.trim() && styles.micBtnActive]}
            onPress={() => send(input)}
          >
            <Text style={styles.micIcon}>{input.trim() ? '↑' : '🎤'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.success, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newChatBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  newChatBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  globeBtn: { padding: 6 },
  globeIcon: { fontSize: 20 },

  // Message list
  list: { padding: Spacing.md, paddingBottom: Spacing.lg },

  // Agent bubble
  agentRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, maxWidth: '85%' },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  agentAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  agentBubble: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.bubble,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  agentText: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  typingText: { color: Colors.muted, fontSize: 13, fontStyle: 'italic' },

  // User bubble
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  userBubble: {
    backgroundColor: Colors.text,
    borderRadius: Radius.bubble,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  userText: { color: '#fff', fontSize: 14, lineHeight: 20 },

  // Card shared
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    marginBottom: 12,
    gap: 5,
  },
  badgeDot: { fontSize: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeSuccess: { backgroundColor: '#E8F5E9' },
  badgeSuccessText: { color: Colors.success },

  // Intent card
  intentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  intentIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  intentContent: { flex: 1 },
  intentLabel: { fontSize: 10, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, marginBottom: 2 },
  intentValue: { fontSize: 14, fontWeight: '500', color: Colors.text },
  intentNote: { fontSize: 12, color: '#F4813A', marginTop: 2 },
  chipWrap: { marginTop: 4 },
  chip: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  editIcon: { fontSize: 14, opacity: 0.4 },

  parsedBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.sm,
    padding: 10,
    marginTop: 12,
  },
  parsedLabel: { fontSize: 11, fontWeight: '700', color: Colors.muted, marginBottom: 3 },
  parsedText: { fontSize: 12, color: Colors.text, lineHeight: 17 },

  // Card action buttons
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  editBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  editBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  primaryCardBtn: {
    flex: 2,
    backgroundColor: Colors.text,
    borderRadius: Radius.sm,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryCardBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Clarification card
  clarifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  clarifyBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.muted, letterSpacing: 0.8 },
  clarifyBlock: { marginBottom: 16 },
  clarifyBlockBorder: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 16 },
  clarifyPrompt: { fontSize: 15, fontWeight: '600', color: Colors.text, lineHeight: 22, marginBottom: 12 },
  clarifyOptions: { gap: 8 },
  clarifyOptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.surface,
  },
  clarifyOptBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  clarifyOptBtnRecommended: { borderColor: Colors.primary + '60', backgroundColor: Colors.primary + '08' },
  recommendedDot: { fontSize: 12, color: Colors.primary, marginRight: 2 },
  clarifyOptText: { fontSize: 14, fontWeight: '500', color: Colors.text, flex: 1 },
  clarifyOptTextActive: { color: Colors.primary, fontWeight: '700' },
  clarifyInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
  },
  clarifyInputSpaced: { marginTop: 10 },
  primaryCardBtnDisabled: { opacity: 0.4 },

  // Providers card
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  providerRowTop: { borderTopWidth: 0 },
  bestMatchBadge: {
    position: 'absolute',
    top: 8,
    right: 80,
    backgroundColor: Colors.danger,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  bestMatchText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  providerMeta: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  providerSpec: { fontSize: 11, fontWeight: '600', color: Colors.primary, marginTop: 2, textTransform: 'uppercase' },
  providerStats: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statItem: { fontSize: 12, color: Colors.text, fontWeight: '500' },
  providerRight: { alignItems: 'center', gap: 6 },
  matchScore: { fontSize: 20, fontWeight: '800', color: Colors.text },
  selectBtn: {
    backgroundColor: '#D94027',
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  selectBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  viewBtn: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  viewBtnText: { color: Colors.text, fontSize: 13, fontWeight: '600' },

  // Quick chips
  chipsScroll: { flexShrink: 0 },
  chips: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.surface,
  },
  chipBtnText: { fontSize: 13, color: Colors.text, fontWeight: '500' },

  // Providers found bubble
  providersFoundBubble: { gap: 8 },
  providersFoundCount: { fontWeight: '700', color: Colors.primary },
  viewMatchesBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewMatchesBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: 12,
    paddingHorizontal: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: { fontSize: 14, color: Colors.text, fontWeight: '600' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: { fontSize: 20, color: Colors.muted, lineHeight: 22 },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: Colors.primary },
  micIcon: { fontSize: 16 },
});
