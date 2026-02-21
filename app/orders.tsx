import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router';

export default function orders() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.scroll}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Text>Back</Text>
            </Pressable>
            <Text>orders</Text>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    backButton: {
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#2A2A35',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
    }
})