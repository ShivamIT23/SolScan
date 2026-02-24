import { Text, StyleSheet, TouchableOpacity, View, Switch, Alert, ScrollView, Platform } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useWalletStore } from '../../src/stores/wallet-store';

// --- Theme Colors (Matches your Wallet Screen) ---
const COLORS = {
    background: "#0F172A", 
    card: "#1E293B",       
    border: "#334155",     
    primary: "#14F195",    
    text: "#F8FAFC",
    muted: "#94A3B8",
    danger: "#EF4444",
};

export default function SettingsScreen() {
    const { isDevnet, toggleNetwork, favorites, searchHistory, clearHistory } = useWalletStore();

    return (
        <SafeAreaView style={s.container}>
            <ScrollView contentContainerStyle={s.scrollContent}>
                <Text style={s.title}>Settings</Text>

                {/* --- NETWORK SECTION --- */}
                <Text style={s.sectionHeader}>Network Configuration</Text>
                <View style={s.card}>
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.label}>Use Devnet</Text>
                            <Text style={s.sublabel}>
                                {isDevnet ? "Current: Testing (Free SOL)" : "Current: Solana Mainnet"}
                            </Text>
                        </View>
                        <Switch
                            value={isDevnet}
                            onValueChange={toggleNetwork}
                            trackColor={{ true: COLORS.primary, false: COLORS.border }}
                            thumbColor={Platform.OS === 'ios' ? undefined : (isDevnet ? COLORS.primary : '#f4f3f4')}
                        />
                    </View>
                </View>

                {/* --- DATA & STORAGE SECTION --- */}
                <Text style={s.sectionHeader}>App Data</Text>
                <View style={s.card}>
                    <View style={[s.row, s.borderBottom]}>
                        <Text style={s.label}>Saved Wallets</Text>
                        <View style={s.badge}>
                            <Text style={s.badgeText}>{favorites.length}</Text>
                        </View>
                    </View>

                    <View style={s.row}>
                        <Text style={s.label}>Search History</Text>
                        <View style={s.badge}>
                            <Text style={s.badgeText}>{searchHistory.length}</Text>
                        </View>
                    </View>
                </View>

                {/* --- ACCOUNT ACTIONS --- */}
                <Text style={s.sectionHeader}>Security & Privacy</Text>
                <TouchableOpacity
                    style={s.dangerButton}
                    activeOpacity={0.7}
                    onPress={() => {
                        Alert.alert(
                            "Clear History",
                            "This will remove all your recent search addresses. Your favorites will remain safe.",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Clear Everything", style: "destructive", onPress: clearHistory },
                            ]
                        );
                    }}
                >
                    <Text style={s.dangerText}>Clear Search History</Text>
                </TouchableOpacity>

                <Text style={s.footerNote}>Wallet Guardian v1.0.4 • {isDevnet ? 'Dev' : 'Prod'}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 32,
        letterSpacing: -0.5,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.muted,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
        overflow: 'hidden',
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 18,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
    },
    sublabel: {
        fontSize: 13,
        color: COLORS.muted,
        marginTop: 4,
    },
    badge: {
        backgroundColor: "rgba(20, 241, 149, 0.1)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.primary,
    },
    dangerButton: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        padding: 18,
        borderRadius: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.3)",
    },
    dangerText: {
        color: COLORS.danger,
        fontWeight: "700",
        fontSize: 16,
    },
    footerNote: {
        textAlign: 'center',
        color: COLORS.muted,
        fontSize: 12,
        marginTop: 40,
        opacity: 0.6
    }
});