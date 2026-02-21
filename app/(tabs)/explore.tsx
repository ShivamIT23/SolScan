import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router';

export default function explore() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.scroll}>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/orders')}>
                <Text style={{ color: '#fff' }}>Orders</Text>
            </TouchableOpacity>
            <Text>explore</Text>
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
    button: {
        backgroundColor: '#16161D',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#2A2A35',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginTop: 10,
    }
})