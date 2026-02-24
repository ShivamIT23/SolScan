import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useWalletStore } from "../../src/stores/wallet-store";
import { FavoriteButton } from "../../src/components/FavouriteButton";

// --- Theme Colors ---
const COLORS = {
  background: "#0F172A", // Deep Navy
  card: "#1E293B",       // Slate 800
  border: "#334155",     // Slate 700
  primary: "#14F195",    // Solana Green
  secondary: "#9945FF",  // Solana Purple
  text: "#F8FAFC",
  muted: "#94A3B8",
  danger: "#EF4444",
  devnet: "#F59E0B",     // Amber
};

export default function WalletScreen() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const favorites = useWalletStore((state) => state.favorites);
  const isDevnet = useWalletStore((state) => state.isDevnet);
  
  const router = useRouter();
  const { addToHistory, searchHistory } = useWalletStore();

  const RPC = isDevnet
    ? "https://solana-devnet.g.alchemy.com/v2/Z0N__jKO-lWx649K3xLsu"
    : "https://solana-mainnet.g.alchemy.com/v2/Z0N__jKO-lWx649K3xLsu";

  // --- Logic ---
  const rpcCall = async (method: string, params: any[]) => {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
  };

  const search = async () => {
    const addr = address.trim();
    if (!addr) return Alert.alert("Wallet Required", "Please enter or paste an address.");

    setLoading(true);
    try {
      const [balRes, tokRes, txRes] = await Promise.all([
        rpcCall("getBalance", [addr]),
        rpcCall("getTokenAccountsByOwner", [
          addr,
          { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
          { encoding: "jsonParsed" },
        ]),
        rpcCall("getSignaturesForAddress", [addr, { limit: 10 }]),
      ]);

      setBalance(balRes.value / 1_000_000_000);
      setTokens((tokRes.value || []).map((a: any) => ({
        mint: a.account.data.parsed.info.mint,
        amount: a.account.data.parsed.info.tokenAmount.uiAmount,
      })).filter((t: any) => t.amount > 0));
      setTxns(txRes.map((s: any) => ({ sig: s.signature, time: s.blockTime, ok: !s.err })));
      
      addToHistory(addr);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI Components ---
  const renderHeader = () => (
    <View style={s.headerContainer}>
      <Text style={s.title}>SolScan</Text>
      <Text style={s.subtitle}>Real-time blockchain explorer</Text>

      {isDevnet && (
        <View style={s.devnetBanner}>
          <Text style={s.devnetText}>🔧 CONNECTED TO DEVNET</Text>
        </View>
      )}

      <View style={s.inputWrapper}>
        <TextInput
          style={s.input}
          placeholder="Paste address (86xCn...)"
          placeholderTextColor={COLORS.muted}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity 
            style={[s.searchBtn, loading && { opacity: 0.7 }]} 
            onPress={search} 
            disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={s.searchBtnText}>Search</Text>}
        </TouchableOpacity>
      </View>

      {balance !== null && (
        <LinearGradient colors={[COLORS.card, '#1e293be0']} style={s.balanceCard}>
          <View style={s.cardTop}>
             <Text style={s.label}>Main Balance</Text>
             <FavoriteButton address={address.trim()} />
          </View>
          <View style={s.balanceRow}>
            <Text style={s.balanceText}>{balance.toFixed(4)}</Text>
            <Text style={s.solSymbol}>SOL</Text>
          </View>
          <View style={s.addressBadge}>
            <Text style={s.addressText}>{address.slice(0, 8)}...{address.slice(-8)}</Text>
          </View>
        </LinearGradient>
      )}

      {tokens.length > 0 && <Text style={s.sectionTitle}>Tokens Assets</Text>}
    </View>
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={tokens}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => item.mint}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => router.push(`/token/${item.mint}`)}>
            <View style={s.tokenIcon}>
                <Text style={s.tokenInitial}>{item.mint.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.mintText}>{item.mint.slice(0, 4)}...{item.mint.slice(-4)}</Text>
              <Text style={s.mutedText}>SPL Token</Text>
            </View>
            <Text style={s.amountText}>{item.amount.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
            txns.length > 0 ? (
                <View>
                    <Text style={[s.sectionTitle, { paddingHorizontal: 20 }]}>Recent Activity</Text>
                    {txns.map((tx) => (
                        <TouchableOpacity 
                            key={tx.sig} 
                            style={s.row} 
                            onPress={() => Linking.openURL(`https://solscan.io/tx/${tx.sig}`)}
                        >
                            <View style={[s.statusDot, { backgroundColor: tx.ok ? COLORS.primary : COLORS.danger }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={s.mintText}>{tx.sig.slice(0, 12)}...</Text>
                                <Text style={s.mutedText}>{tx.time ? new Date(tx.time * 1000).toLocaleTimeString() : 'Pending'}</Text>
                            </View>
                            <Text style={[s.statusLabel, { color: tx.ok ? COLORS.primary : COLORS.danger }]}>
                                {tx.ok ? 'SUCCESS' : 'FAILED'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingBottom: 40 },
  headerContainer: { padding: 20 },
  title: { fontSize: 32, fontWeight: "800", color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: COLORS.muted, marginBottom: 20 },
  
  devnetBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.devnet,
    marginBottom: 20,
  },
  devnetText: { color: COLORS.devnet, fontWeight: "700", fontSize: 12, textAlign: 'center' },

  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: { flex: 1, color: COLORS.text, paddingHorizontal: 12, fontSize: 16 },
  searchBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  searchBtnText: { fontWeight: "700", color: "#000" },

  balanceCard: {
    marginTop: 25,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: COLORS.muted, textTransform: 'uppercase', fontSize: 12, fontWeight: '600' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 10 },
  balanceText: { fontSize: 42, fontWeight: '800', color: COLORS.text },
  solSymbol: { fontSize: 18, color: COLORS.primary, fontWeight: '700', marginLeft: 8 },
  addressBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(153, 69, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  addressText: { color: COLORS.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginTop: 30, marginBottom: 15 },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.card, 
    marginHorizontal: 20, 
    marginBottom: 10, 
    padding: 16, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  tokenIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  tokenInitial: { color: COLORS.text, fontWeight: '800' },
  mintText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
  mutedText: { color: COLORS.muted, fontSize: 12 },
  amountText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 15 },
  statusLabel: { fontSize: 10, fontWeight: '800' }
});