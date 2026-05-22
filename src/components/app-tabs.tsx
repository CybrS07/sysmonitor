import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { LineChart } from "react-native-chart-kit";

const THEME = {
    bg: '#111214', card: '#1D2024', accent: '#3DAEE9', text: '#FFFFFF',
    muted: '#7F8C8D', danger: '#ED1515', success: '#2ECC71', nvidia: '#C724B1', orange: '#FDB338'
};

const screenWidth = Dimensions.get("window").width;
const firebaseConfig = { databaseURL: "  " }; // realime database link

// Prevent Firebase "already initialized" error
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

const chartSettings = (color: string) => ({
    backgroundGradientFrom: THEME.card, backgroundGradientTo: THEME.card,
    color: (o = 1) => color, strokeWidth: 2,
    propsForDots: { r: "0" }, propsForBackgroundLines: { strokeDasharray: "" }
});

const Tab = createMaterialTopTabNavigator();

export default function AppTabs() {
    const [data, setData] = useState<any>(null);
    const [history, setHistory] = useState<any>({ cpu: [0], net: [0], ram: [0], swap: [0] });
    const [selectedGpu, setSelectedGpu] = useState<any>(null);

    const handleReset = () => setHistory({ cpu: [0], net: [0], ram: [0], swap: [0] });

    useEffect(() => {
        return onValue(ref(db, 'live_stats'), (snap) => {
            const val = snap.val();
            if (val) {
                setData(val);
                setHistory((prev: any) => ({
                    cpu: [...(prev.cpu || [0]).slice(-13), val.performance?.cpu_total || 0],
                    ram: [...(prev.ram || [0]).slice(-13), val.memory?.ram_perc || 0],
                    swap: [...(prev.swap || [0]).slice(-13), val.memory?.swap_perc || 0],
                    net: [...(prev.net || [0]).slice(-13), val.traffic?.down || 0]
                }));
            }
        });
    }, []);

    if (!data) return (
        <View style={styles.center}><ActivityIndicator color={THEME.accent} /><Text style={styles.wait}>Syncing Hardware Link...</Text></View>
    );

    const HomeScreen = () => (
        <ScrollView style={styles.tabBg}>
            <View style={styles.fedoraCircle}><Text style={styles.fText}>f</Text></View>
            <View style={styles.heroBox}>
                <Text style={styles.h1}>{data.sensors?.os_name || 'System'}</Text>
                <Text style={styles.hSub}>KDE Plasma Mobile Dashboard</Text>
            </View>
            <Box label="Software Details" color={THEME.accent}>
                <DataRow l="Plasma Version" r={data.sensors?.plasma || 'N/A'} />
                <DataRow l="Kernel Version" r={data.sensors?.kernel || 'N/A'} />
                <DataRow l="Local IP" r={data.sensors?.ip || 'N/A'} />
            </Box>
            <Box label="Hardware ID" color={THEME.success}>
                <DataRow l="Product Model" r={data.sensors?.model || 'N/A'} />
                <DataRow l="Main Memory" r={`${data.memory?.ram_total || 0} GiB Total`} />
            </Box>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}><Text style={styles.btnText}>RESET GRAPHS</Text></TouchableOpacity>
        </ScrollView>
    );

    const PerformanceScreen = () => (
        <ScrollView style={styles.tabBg}>
            <Box label="CPU History" color={THEME.accent} rightText={`${data.performance?.cpu_total || 0}%`}>
                <LineChart data={{ datasets: [{ data: history.cpu }] }} width={screenWidth - 60} height={130} chartConfig={chartSettings(THEME.accent)} bezier withDots={false} withInnerLines={false} />
            </Box>
            <Text style={styles.groupHead}>DYNAMIC THERMAL CLUSTER</Text>
            <View style={styles.grid}>
                {(data.performance?.cpu_usages || []).map((usage: number, i: number) => (
                    <View key={`core-${i}`} style={styles.gridCard}>
                        <Text style={styles.coreNum}>CORE {i + 1}</Text>
                        <Text style={styles.coreVal}>
                            {data.performance?.cpu_temps?.[i] !== undefined
                                ? `${data.performance.cpu_temps[i].toFixed(0)}°C`
                                : 'N/A'}
                        </Text>
                        <View style={styles.track}><View style={[styles.fill, { width: `${usage || 0}%`, backgroundColor: THEME.accent }]} /></View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const GraphicsScreen = () => {
        if (selectedGpu) return (
            <ScrollView style={styles.tabBg}>
                <TouchableOpacity onPress={() => setSelectedGpu(null)} style={styles.resetBtn}><Text style={styles.btnText}>← BACK TO ALL GPUS</Text></TouchableOpacity>
                <Box label={`TECHNICAL: ${selectedGpu.name}`} color={THEME.nvidia}>
                    <Text style={styles.text}>Driver Version: {selectedGpu.driver || 'N/A'}</Text>
                    <Text style={styles.text}>UUID: {selectedGpu.uuid}</Text>
                    <Text style={styles.text}>VRAM: {selectedGpu.memoryTotal || 0} MB</Text>
                    <Text style={styles.groupHead}>CURRENT PERFORMANCE</Text>
                    <Text style={styles.text}>GPU Load: {(selectedGpu.load || 0).toFixed(1)}%</Text>
                    <Text style={styles.text}>Temperature: {(selectedGpu.temp || 0).toFixed(0)}°C</Text>
                </Box>
            </ScrollView>
        );

        return (
            <ScrollView style={styles.tabBg}>
                {(data.gpus || []).map((gpu: any, i: number) => (
                    <Box key={`gpu-${i}`} label={gpu.name} color={THEME.orange}>
                        <View style={styles.split}>
                            <Text style={styles.text}>Load: {(gpu.load || 0).toFixed(1)}% | {(gpu.temp || 0).toFixed(0)}°C</Text>
                            <TouchableOpacity onPress={() => setSelectedGpu(gpu)} style={styles.detailBtn}><Text style={styles.btnText}>DETAILS</Text></TouchableOpacity>
                        </View>
                    </Box>
                ))}
                <Box label="Memory Metrics" color={THEME.accent}>
                    <Text style={styles.miniLabel}>RAM USAGE (%)</Text>
                    <LineChart data={{ datasets: [{ data: history.ram }] }} width={screenWidth - 60} height={100} chartConfig={chartSettings(THEME.accent)} bezier withDots={false} />
                    <Text style={[styles.miniLabel, { marginTop: 15 }]}>SWAP USAGE (%)</Text>
                    <LineChart data={{ datasets: [{ data: history.swap }] }} width={screenWidth - 60} height={100} chartConfig={chartSettings(THEME.muted)} bezier withDots={false} />
                </Box>
            </ScrollView>
        );
    };

    const ActivityScreen = () => (
        <ScrollView style={styles.tabBg}>
            <Box label="Bandwidth Flow" color={THEME.danger} rightText={`↓ ${data.traffic?.down || 0} KiB/s`}>
                <LineChart data={{ datasets: [{ data: history.net }] }} width={screenWidth - 60} height={100} chartConfig={chartSettings(THEME.danger)} withDots={false} bezier />
            </Box>
            <View style={styles.split}>
                <Text style={styles.groupHead}>ACTIVE PROCESSES</Text>
                <Text style={[styles.groupHead, { color: THEME.accent }]}>CPU | RAM</Text>
            </View>
            {(data.procs || []).map((p: any, i: number) => (
                <View key={`proc-${i}`} style={styles.procRow}>
                    <Text numberOfLines={1} style={[styles.pText, { flex: 1, fontSize: 13 }]}>{p.name || 'Unknown'}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={[styles.pText, { color: THEME.accent, width: 50, textAlign: 'right', fontSize: 12 }]}>{p.cpu || 0}%</Text>
                        <Text style={[styles.pText, { color: THEME.muted, width: 70, textAlign: 'right', fontSize: 12 }]}>{p.ram || '0 MB'}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );

    return (
        <Tab.Navigator screenOptions={{ tabBarStyle: { backgroundColor: THEME.bg }, tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' }, tabBarActiveTintColor: THEME.accent, tabBarIndicatorStyle: { backgroundColor: THEME.accent, height: 3 } }}>
            <Tab.Screen name="HOME" component={HomeScreen} />
            <Tab.Screen name="CPU" component={PerformanceScreen} />
            <Tab.Screen name="GRAPHICS" component={GraphicsScreen} />
            <Tab.Screen name="ACTIVITY" component={ActivityScreen} />
        </Tab.Navigator>
    );
}

const Box = ({ label, color, children, rightText }: any) => <View style={[styles.box, { borderLeftColor: color }]}><View style={styles.split}><Text style={styles.miniLabel}>{label.toUpperCase()}</Text><Text style={[styles.miniLabel, { color }]}>{rightText}</Text></View>{children}</View>;
const DataRow = ({ l, r }: any) => <View style={styles.dRow}><Text style={styles.labelM}>{l}:</Text><Text style={styles.text}>{r}</Text></View>;

const styles = StyleSheet.create({
    tabBg: { flex: 1, backgroundColor: THEME.bg, padding: 15 },
    center: { flex: 1, backgroundColor: THEME.bg, justifyContent: 'center', alignItems: 'center' },
    wait: { color: '#fff', marginTop: 15, fontSize: 12, fontWeight: 'bold' },
    fedoraCircle: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.accent, justifyContent: 'center', alignItems: 'center', marginVertical: 30 },
    fText: { color: '#fff', fontSize: 50, fontWeight: '900' },
    heroBox: { alignItems: 'center', marginBottom: 30 },
    h1: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    hSub: { color: THEME.accent, fontWeight: '600', fontSize: 14 },
    box: { backgroundColor: THEME.card, padding: 15, borderRadius: 10, marginBottom: 15, borderLeftWidth: 3 },
    split: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    miniLabel: { color: THEME.muted, fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
    dRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    labelM: { color: THEME.muted, fontSize: 11 },
    text: { color: THEME.text, fontWeight: '700', fontSize: 13 },
    resetBtn: { alignSelf: 'center', backgroundColor: '#2C3034', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, marginTop: 15 },
    detailBtn: { padding: 5, backgroundColor: '#2C3034', borderRadius: 5 },
    btnText: { color: THEME.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    groupHead: { color: THEME.muted, fontSize: 10, fontWeight: 'bold', marginVertical: 15, letterSpacing: 1.5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridCard: { width: '31%', backgroundColor: THEME.card, padding: 10, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
    coreNum: { color: THEME.muted, fontSize: 10 },
    coreVal: { color: '#fff', fontSize: 16, fontWeight: '800', marginVertical: 3 },
    track: { width: '100%', height: 3, backgroundColor: '#333' },
    fill: { height: '100%' },
    procRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#232529' },
    pText: { color: '#fff', fontSize: 14 }
});