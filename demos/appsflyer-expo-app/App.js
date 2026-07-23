import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import appsFlyer from 'react-native-appsflyer';

const DEV_KEY = process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY ?? 'Us4xXxXxXxQed';
const APP_ID = process.env.EXPO_PUBLIC_APPSFLYER_APP_ID ?? '7xXxXxXx1';

function DataCard({ label, value, action }) {
	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.cardLabel}>{label}</Text>
				{action ? (
					<Pressable
						style={({ pressed }) => [styles.cardAction, pressed && styles.cardActionPressed]}
						onPress={action.onPress}>
						<Text style={styles.cardActionText}>{action.title}</Text>
					</Pressable>
				) : null}
			</View>
			<ScrollView style={styles.cardBody} contentContainerStyle={styles.cardBodyContent}>
				<Text style={styles.cardValue}>{value}</Text>
			</ScrollView>
		</View>
	);
}

export default function App() {
	const [gcd, setGcd] = useState('No conversion data yet…');
	const [oaoa, setOaoa] = useState('No deep link yet…');
	const [logStatus, setLogStatus] = useState('Tap "Send" to log a test event…');
	const [sdkStatus, setSdkStatus] = useState('Initializing…');

	useEffect(() => {
		appsFlyer.setIsDebug(true);
		// Listeners must be registered before init() resolves — the native RPC
		// layer buffers them internally until init completes.
		const gcdListener = appsFlyer.onInstallConversionData((res) => setGcd(JSON.stringify(res, null, 2)));
		const oaoaListener = appsFlyer.onDeepLink((res) => setOaoa(JSON.stringify(res, null, 2)));

		// startSdk() must be called inside registerSessionReadyListener's callback, not
		// right after init() resolves — the SDK doesn't start itself (AppsFlyerLib.h
		// contract), same pattern as example/src/App.tsx's startWhenSessionReady().
		const unregisterSessionReady = appsFlyer.registerSessionReadyListener(() => {
			setSdkStatus('Session ready — starting…');
			appsFlyer.startSdk().then(() => setSdkStatus('Started'));
		});

		appsFlyer.init(DEV_KEY, APP_ID).then(
			() => setSdkStatus((s) => (s === 'Initializing…' ? 'Initialized, awaiting session…' : s)),
			(err) => setSdkStatus(`Init error: ${err.message ?? JSON.stringify(err)}`),
		);

		return () => {
			gcdListener();
			oaoaListener();
			unregisterSessionReady();
		};
	}, []);

	const handleLogEvent = () => {
		setLogStatus('sending…');
		appsFlyer
			.logEvent('af_add_to_cart', { af_content_id: 'demo-item' }, true)
			.then((res) => setLogStatus(`sent: ${typeof res === 'string' ? res : JSON.stringify(res)}`))
			.catch((err) => setLogStatus(`error: ${err.message ?? JSON.stringify(err)}`));
	};

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.screen}>
				<StatusBar style='light' />
				<View style={styles.header}>
					<Text style={styles.headerTitle}>AppsFlyer</Text>
					<Text style={styles.headerSubtitle}>Expo Demo · {sdkStatus}</Text>
				</View>

				<View style={styles.content}>
					<DataCard label='INSTALL CONVERSION DATA' value={gcd} />
					<DataCard label='DEEP LINK' value={oaoa} />
					<DataCard
						label='LOG EVENT'
						value={logStatus}
						action={{ title: 'Send', onPress: handleLogEvent }}
					/>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const ACCENT = '#FF7A00';
const BG = '#0F1115';
const SURFACE = '#1A1D24';

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: BG,
	},
	header: {
		paddingHorizontal: 24,
		paddingTop: 16,
		paddingBottom: 8,
	},
	headerTitle: {
		color: '#FFFFFF',
		fontSize: 28,
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	headerSubtitle: {
		color: '#8A8F9A',
		fontSize: 14,
		marginTop: 2,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 16,
		gap: 16,
	},
	card: {
		flex: 1,
		backgroundColor: SURFACE,
		borderRadius: 16,
		overflow: 'hidden',
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 14,
		paddingBottom: 8,
	},
	cardLabel: {
		color: ACCENT,
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1,
	},
	cardAction: {
		backgroundColor: ACCENT,
		borderRadius: 14,
		paddingVertical: 6,
		paddingHorizontal: 14,
	},
	cardActionPressed: {
		opacity: 0.7,
	},
	cardActionText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '700',
	},
	cardBody: {
		flex: 1,
	},
	cardBodyContent: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	cardValue: {
		color: '#D7DAE0',
		fontSize: 13,
		fontFamily: 'Menlo, Courier',
		lineHeight: 19,
	},
});
