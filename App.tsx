import React, { useState } from 'react';
import {
  StyleSheet, Text,
  TextInput, FlatList, ScrollView, TouchableOpacity, ActivityIndicator,
  View, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Clipboard
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// --- Constants & Colors ---
const RPC_URL = "https://api.mainnet-beta.solana.com";

const COLORS = {
  background: '#0f172a', // Deep Slate
  card: '#1e293b',       // Slate 800
  border: '#334155',       // Slate 700
  primary: '#6366f1',     // Indigo
  primaryLight: '#818cf8',
  text: '#f1f5f9',       // White
  muted: '#94a3b8',       // Slate 400
  accent: '#8b5cf6',      // Violet
  success: '#10b981',      // Emerald
  warning: '#f59e0b',      // Amber
};

// --- RPC Logic ---
const rpc = async (method: string, params: any[]) => {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
};

const getBalance = async (addr: string) => {
  const result = await rpc("getBalance", [addr]);
  return result.value / 1_000_000_000;
};

const getTokens = async (addr: string) => {
  const result = await rpc("getTokenAccountsByOwner", [
    addr,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed" },
  ]);
  return (result.value || [])
    .map((a: any) => ({
      mint: a.account.data.parsed.info.mint,
      amount: a.account.data.parsed.info.tokenAmount.uiAmount,
      symbol: a.account.data.parsed.info.tokenAmount.symbol || 'Unknown',
      decimals: a.account.data.parsed.info.tokenAmount.decimals
    }))
    .filter((t: any) => t.amount > 0);
};

const getTxns = async (addr: string) => {
  const sigs = await rpc("getSignaturesForAddress", [addr, { limit: 10 }]);
  return sigs.map((s: any) => ({
    sig: s.signature,
    time: s.blockTime,
    ok: !s.err,
    err: s.err ? s.err.message : null
  }));
};

// --- Sub-Components ---

const StatCard = ({ title, value, icon, color }: any) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const TokenItem = ({ item }: any) => (
  <View style={styles.itemRow}>
    <View style={[styles.tokenAvatar, { backgroundColor: COLORS.border }]}>
      <Text style={styles.tokenInitial}>{item.mint.substring(0, 2).toUpperCase()}</Text>
    </View>
    <View style={styles.itemContent}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{parseFloat(item.amount).toLocaleString()} {item.symbol}</Text>
        <Text style={styles.itemMuted}>{item.mint}</Text>
      </View>
    </View>
  </View>
);

const TxnItem = ({ item }: any) => (
  <View style={[styles.itemRow, styles.txnItem]}>
    <View style={[styles.statusDot, { backgroundColor: item.ok ? COLORS.success : COLORS.warning }]}>
      <Text style={styles.statusText}>{item.ok ? 'OK' : 'ERR'}</Text>
    </View>
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle} numberOfLines={1} ellipsizeMode="middle">
        {item.sig.substring(0, 18)}...{item.sig.substring(item.sig.length - 18)}
      </Text>
      <Text style={styles.itemMuted}>
        {new Date(item.time * 1000).toLocaleString()}
      </Text>
    </View>
  </View>
);

// --- Main Component ---

export default function App() {
  const [balance, setBalance] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");
  const [token, setToken] = useState<any[]>([]);
  const [txn, setTxn] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("");

  const [activeTab, setActiveTab] = useState<'tokens' | 'txns'>('tokens');

  const handleFetchBalance = async () => {
    if (!address) return;
    setLoading(true);
    setLoadingText("Fetching Balance...");
    try {
      const b = await getBalance(address);
      setBalance(b);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTokens = async () => {
    if (!address) return;
    setLoading(true);
    setLoadingText("Fetching Tokens...");
    try {
      const t = await getTokens(address);
      setToken(t);
      setActiveTab('tokens');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTxns = async () => {
    if (!address) return;
    setLoading(true);
    setLoadingText("Fetching History...");
    try {
      const t = await getTxns(address);
      setTxn(t);
      setActiveTab('txns');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Define the Header Layout ---
  // We extract everything above the list into a single component
  const renderHeader = () => (
    <>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.background, COLORS.card]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Solana Explorer</Text>
        <Text style={styles.headerSubtitle}>Mainnet Beta</Text>
      </LinearGradient>

      {/* Input Section */}
      <View style={styles.inputCard}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Paste Wallet Address..."
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => address && Clipboard.setString(address)}
          >
            <Text style={styles.copyText}>COPY</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={handleFetchBalance} activeOpacity={0.8}>
            <Text style={styles.actionText}>Balance</Text>
            <Text style={styles.actionSub}>SOL</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleFetchTokens} activeOpacity={0.8}>
            <Text style={styles.actionText}>Tokens</Text>
            <Text style={styles.actionSub}>SPL</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleFetchTxns} activeOpacity={0.8}>
            <Text style={styles.actionText}>History</Text>
            <Text style={styles.actionSub}>TXS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Display */}
      {balance !== null && (
        <StatCard title="Wallet Balance" value={`${balance.toFixed(4)} SOL`} icon="💎" color={COLORS.primary} />
      )}

      {/* Tabs */}
      {(token.length > 0 || txn.length > 0) && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tokens' && styles.activeTab]}
            onPress={() => setActiveTab('tokens')}
          >
            <Text style={[styles.tabText, activeTab === 'tokens' && styles.activeTabText]}>
              Tokens ({token.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'txns' && styles.activeTab]}
            onPress={() => setActiveTab('txns')}
          >
            <Text style={[styles.tabText, activeTab === 'txns' && styles.activeTabText]}>
              History ({txn.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* This empty view acts as the top padding for the content card 
        so the items below it look like they are inside a container 
      */}
      <View style={{ marginTop: 10 }} />
    </>
  );

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.container}>

          <FlatList
            // 1. Pass the header we built above
            ListHeaderComponent={renderHeader}

            // 2. Conditionally pass the right data based on the active tab
            data={loading ? [] : (activeTab === 'tokens' ? token : txn)}
            keyExtractor={(item, index) => item.mint || item.sig || index.toString()}

            // 3. Conditionally render the right item type
            renderItem={({ item }) => (
              <View style={{ backgroundColor: COLORS.card, marginHorizontal: 20, paddingHorizontal: 15 }}>
                {activeTab === 'tokens' ? <TokenItem item={item} /> : <TxnItem item={item} />}
              </View>
            )}

            // 4. Handle Loading and Empty States seamlessly
            ListEmptyComponent={
              <View style={[styles.contentCard, { minHeight: 300, marginTop: 0 }]}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>{loadingText}</Text>
                  </View>
                ) : (
                  (token.length > 0 || txn.length > 0) && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>
                        {activeTab === 'tokens' ? 'No tokens found.' : 'No transactions found.'}
                      </Text>
                    </View>
                  )
                )}
              </View>
            }

            // 5. Wrap up the styling at the bottom of the list
            ListFooterComponent={<View style={{ height: 20, backgroundColor: 'transparent' }} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          />

        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    color: COLORS.text,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.primaryLight,
    opacity: 0.8,
    marginTop: 4,
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    height: 40,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  copyText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSub: {
    color: COLORS.muted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    borderWidth: 0,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cardTitle: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.background,
  },
  tabText: {
    color: COLORS.muted,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  contentCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    minHeight: 300,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tokenAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  tokenInitial: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  itemMuted: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  txnItem: {
    justifyContent: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.muted,
    marginTop: 10,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 15,
  },
});