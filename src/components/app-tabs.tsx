import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { LineChart, ProgressChart } from "react-native-chart-kit";

// --- FEDORA BREEZE DARK THEME ---
const THEME = {
    bg: '#111214', card: '#1D2024', accent: '#3DAEE9', text: '#FFFFFF',
    muted: '#7F8C8D', danger: '#ED1515', success: '#2ECC71', nvidia: '#C724B1', orange: '#FDB338'
};

const screenWidth = Dimensions.get("window").width;
const firebaseConfig = { databaseURL: " " };  //firebase live database link
const db = getDatabase(initializeApp(firebaseConfig));

// Global Chart settings to prevent transform errors on web/mobile
const chartSettings = (color: string) => ({
    backgroundGradientFrom: THEME.card, backgroundGradientTo: THEME.card,
    color: (o = 1) => color, strokeWidth: 2,
    propsForDots: { r: "0" }, propsForBackgroundLines: { strokeDasharray: "" }
});

const Tab = createMaterialTopTabNavigator();

export default function AppTabs() {
    const [data, setData] = useState<any>(null);
    const [history, setHistory] = useState<any>({ cpu: [], gpus: [], net: [] });

    const handleReset = () => setHistory({ cpu: [], gpus: [], net: [] });

    useEffect(() => {
        const statsRef = ref(db, 'live_stats');
        return onValue(statsRef, (snap) => {
            const val = snap.val();
            if (val) {
                setData(val);
                setHistory((prev: any) => ({
                    cpu: [...prev.cpu.slice(-14), val.performance?.cpu_total || 0],
                    gpus: val.gpus.map((g: any, i: number) => {
                        const existing = prev.gpus[i] || { load: [], temp: [] };
                        return {
                            load: [...existing.load.slice(-14), g.load],
                            temp: [...existing.temp.slice(-14), g.temp]
                        };
                    }),
                    net: [...prev.net.slice(-14), val.traffic?.down || 0]
                }));
            }
        });
    }, []);

    if (!data) return (
        <View style={styles.center}><ActivityIndicator color={THEME.accent} /><Text style={styles.wait}>Syncing Hardware Link...</Text></View>
    );

    // --- HOME: REPLICA OF "ABOUT SYSTEM" SCREEN ---
    const HomeScreen = () => (
        <ScrollView style={styles.tabBg}>
            <View style={styles.fedoraCircle}><Text style={styles.fText}>f</Text></View>
            <View style={styles.heroBox}>
                <Text style={styles.h1}>{data.sensors?.os_name}</Text>
                <Text style={styles.hSub}>KDE Plasma Mobile Dashboard</Text>
            </View>
            <Box label="Software Details" color={THEME.accent}>
                <DataRow l="Plasma Version" r={data.sensors?.plasma} />
                <DataRow l="Kernel Version" r={data.sensors?.kernel} />
                <DataRow l="Local IP" r={data.sensors?.ip} />
                <DataRow l="System Uptime" r={data.sensors?.uptime} />
            </Box>
            <Box label="Hardware ID" color={THEME.success}>
                <DataRow l="Product Model" r={data.sensors?.model} />
                <DataRow l="Main Memory" r={`${data.memory?.ram_total} GiB Total`} />
            </Box>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}><Text style={styles.btnText}>RESET GRAPHS</Text></TouchableOpacity>
        </ScrollView>
    );

    // --- PERFORMANCE: DYNAMIC CPU GRID + THERMAL CLUSTER ---
    const PerformanceScreen = () => (
        <ScrollView style={styles.tabBg}>
            <Box label="CPU History" color={THEME.accent} rightText={`${data.performance?.cpu_total}%`}>
                <LineChart data={{ labels: [], datasets: [{ data: history.cpu }] }} width={screenWidth - 60} height={130} chartConfig={chartSettings(THEME.accent)} bezier withDots={false} withInnerLines={false} />
            </Box>

            <Text style={styles.groupHead}>DYNAMIC THERMAL CLUSTER ({data.performance?.cpu_usages.length} CORES)</Text>
            <View style={styles.grid}>
                {data.performance?.cpu_temps.map((temp: number, i: number) => (
                    <View key={i} style={styles.gridCard}>
                        <Text style={styles.coreNum}>CORE {i + 1}</Text>
                        <Text style={styles.coreVal}>{temp.toFixed(0)}°C</Text>
                        <View style={styles.track}><View style={[styles.fill, { width: `${data.performance.cpu_usages[i]}%`, backgroundColor: THEME.accent }]} /></View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    // --- GRAPHICS: DYNAMIC ADAPTIVE GPU BLOCK ---
    const GraphicsScreen = () => (
        <ScrollView style={styles.tabBg}>
            {data.gpus.map((gpu: any, i: number) => (
                <View key={i}>
                    <Box label={`${gpu.name} Usage`} color={THEME.orange} rightText={`${gpu.load.toFixed(1)}%`}>
                        {history.gpus[i]?.load?.length > 1 && (
                            <LineChart data={{ labels: [], datasets: [{ data: history.gpus[i].load }] }} width={screenWidth - 60} height={100} chartConfig={chartSettings(THEME.orange)} bezier withDots={false} />
                        )}
                    </Box>
                    <Box label={`${gpu.name} Thermal`} color={THEME.nvidia} rightText={`${gpu.temp.toFixed(0)}°C`}>
                        {history.gpus[i]?.temp?.length > 1 && (
                            <LineChart data={{ labels: [], datasets: [{ data: history.gpus[i].temp }] }} width={screenWidth - 60} height={100} chartConfig={chartSettings(THEME.nvidia)} bezier withDots={false} />
                        )}
                    </Box>
                </View>
            ))}
            <View style={styles.split}>
                <View style={styles.half}><ProgressChart data={{ data: [data.memory.ram_perc / 100] }} width={120} height={70} strokeWidth={6} radius={25} chartConfig={chartSettings(THEME.accent)} hideLegend /><Text style={styles.halfVal}>RAM {data.memory.ram_perc}%</Text></View>
                <View style={styles.half}><ProgressChart data={{ data: [data.memory.swap_perc / 100] }} width={120} height={70} strokeWidth={6} radius={25} chartConfig={chartSettings('#555')} hideLegend /><Text style={styles.halfVal}>Swap {data.memory.swap_used}G</Text></View>
            </View>
        </ScrollView>
    );

    // --- ACTIVITY: PROCESS LIST & NETWORK FLOW ---
    const ActivityScreen = () => (
        <ScrollView style={styles.tabBg}>
            <Box label="Bandwidth Flow" color={THEME.danger} rightText={`↓ ${data.traffic.down} KiB/s`}>
                <LineChart data={{ labels: [], datasets: [{ data: history.net }] }} width={screenWidth - 60} height={100} chartConfig={chartSettings(THEME.danger)} withDots={false} bezier />
            </Box>
            <Text style={styles.groupHead}>PROCESS MONITOR (TOP 10)</Text>
            {data.procs.map((p: any, i: number) => (
                <View key={i} style={styles.procRow}>
                    <Text style={[styles.pText, { flex: 1 }]}>{p.name}</Text>
                    <Text style={[styles.pText, { color: THEME.accent, width: 45, textAlign: 'right' }]}>{p.cpu}%</Text>
                    <Text style={[styles.pText, { color: THEME.muted, width: 80, textAlign: 'right', fontSize: 11 }]}>{p.ram}</Text>
                </View>
            ))}
        </ScrollView>
    );

    return (
        <Tab.Navigator screenOptions={{
            tabBarStyle: { backgroundColor: THEME.bg },
            tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' },
            tabBarActiveTintColor: THEME.accent,
            tabBarIndicatorStyle: { backgroundColor: THEME.accent, height: 3 }
        }}>
            <Tab.Screen name="HOME" component={HomeScreen} />
            <Tab.Screen name="CPU" component={PerformanceScreen} />
            <Tab.Screen name="GRAPHICS" component={GraphicsScreen} />
            <Tab.Screen name="ACTIVITY" component={ActivityScreen} />
        </Tab.Navigator>
    );
}

// Helpers
const Box = ({ label, color, children, rightText }: any) => (
    <View style={[styles.box, { borderLeftColor: color }]}><View style={styles.split}><Text style={styles.miniLabel}>{label.toUpperCase()}</Text><Text style={[styles.miniLabel, { color }]}>{rightText}</Text></View>{children}</View>
);
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
    btnText: { color: THEME.accent, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    groupHead: { color: THEME.muted, fontSize: 10, fontWeight: 'bold', marginVertical: 15, letterSpacing: 1.5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridCard: { width: '31%', backgroundColor: THEME.card, padding: 10, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
    coreNum: { color: THEME.muted, fontSize: 10 },
    coreVal: { color: '#fff', fontSize: 16, fontWeight: '800', marginVertical: 3 },
    track: { width: '100%', height: 3, backgroundColor: '#333' },
    fill: { height: '100%' },
    half: { flex: 0.48, backgroundColor: THEME.card, padding: 15, borderRadius: 10, alignItems: 'center' },
    halfVal: { color: THEME.muted, fontSize: 10, fontWeight: '900' },
    procRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#232529' },
    pText: { color: '#fff', fontSize: 14 }
});