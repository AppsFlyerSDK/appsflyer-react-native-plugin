import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import AppsFlyer from 'react-native-appsflyer';
import { APP_ID, DEV_KEY, RPC_CATALOG } from './rpcCatalog';

// Filtered by Platform.OS — one shared catalog here instead of MethodCatalog.swift's two iOS-only targets.
const METHODS = RPC_CATALOG.filter((m) => m.platform === 'both' || m.platform === Platform.OS);

function safeStringify(value) {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function logColor(text) {
	if (text.startsWith('✗')) return RED;
	if (text.startsWith('✓')) return GREEN;
	if (text.startsWith('⚠')) return AMBER;
	if (text.includes('===')) return TEXT_PRIMARY;
	return TEXT_SECONDARY;
}

// Memoized so FlatList's rapid appends during a run don't re-render every already-rendered row.
const ResultRow = memo(function ResultRow({ item, onSelect }) {
	return (
		<Pressable style={styles.row} onPress={() => onSelect(item)}>
			<View style={[styles.statusDot, item.status === 'success' ? styles.dotSuccess : styles.dotFailure]} />
			<View style={styles.rowBody}>
				<Text style={styles.rowName}>{item.name}</Text>
				<Text style={styles.rowGroup}>{item.group}</Text>
			</View>
			<Text style={styles.rowDuration}>{item.duration}ms</Text>
		</Pressable>
	);
});

const LogRow = memo(function LogRow({ item }) {
	return (
		<View style={styles.logRow}>
			<Text style={styles.logTime}>{item.time}</Text>
			<Text style={[styles.logText, { color: logColor(item.text) }]}>{item.text}</Text>
		</View>
	);
});

const RESULT_ROW_PITCH = 62;
function getResultItemLayout(data, index) {
	return { length: RESULT_ROW_PITCH, offset: RESULT_ROW_PITCH * index, index };
}

const RPC_TIMEOUT_MS = 15000;
function withTimeout(promise, label) {
	return Promise.race([
		promise,
		new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${RPC_TIMEOUT_MS}ms`)), RPC_TIMEOUT_MS)),
	]);
}

// Timeout fallback for registerSessionReadyListener's known indefinite-stall bug (known-issues-kb.md); matches example/src/App.tsx.
const SESSION_READY_TIMEOUT_MS = 15000;
function startWhenSessionReady(onReady) {
	return new Promise((resolve, reject) => {
		let started = false;
		const doStart = (reason) => {
			if (started) return;
			started = true;
			clearTimeout(timeoutId);
			onReady?.(reason);
			AppsFlyer.start().then(resolve, reject);
		};
		AppsFlyer.registerSessionReadyListener(() => doStart('onSessionReady'));
		const timeoutId = setTimeout(() => doStart('timeout-fallback'), SESSION_READY_TIMEOUT_MS);
	});
}

export default function App() {
	const [results, setResults] = useState([]);
	const [logs, setLogs] = useState([]);
	const [isRunning, setIsRunning] = useState(false);
	const [progress, setProgress] = useState({ current: 0, total: 0 });
	const [selected, setSelected] = useState(null);
	const [activeTab, setActiveTab] = useState('results');
	const [copyLabel, setCopyLabel] = useState('Copy');
	const [sessionReady, setSessionReady] = useState(false);
	const logIdRef = useRef(0);
	const logListRef = useRef(null);
	const isRunningRef = useRef(false);

	const copyLogs = async () => {
		const text = logs.map((entry) => `[${entry.time}] ${entry.text}`).join('\n');
		await Clipboard.setStringAsync(text);
		setCopyLabel('Copied!');
		setTimeout(() => setCopyLabel('Copy'), 1500);
	};

	const addLog = (text) => {
		logIdRef.current += 1;
		const id = logIdRef.current;
		const now = new Date();
		const time = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
		setLogs((prev) => [...prev, { key: String(id), time, text }]);
	};

	useEffect(() => {
		let cancelled = false;

		async function bootstrap() {
			addLog('========== Bootstrap Started ==========');
			AppsFlyer.enableDebug({ enabled: true });

			// registerDeepLinkListener before init, no Platform.OS branch — iOS's one-shot DDL
			// bug that used to require deferring this call is fixed upstream (bridge-patterns.md §4).
			AppsFlyer.registerDeepLinkListener({});

			// Not awaited: registration below must dispatch synchronously, not after init's
			// promise settles (bridge-patterns.md §4).
			AppsFlyer.init({ devKey: DEV_KEY, appId: APP_ID }).then(
				() => addLog('✓ init OK'),
				(error) => addLog(`✗ init FAILED: ${safeStringify(error)}`),
			);

			AppsFlyer.registerConversionListener({});

			await startWhenSessionReady((reason) => addLog(`✓ Session ready (${reason})`));
			if (!cancelled) setSessionReady(true);
		}

		bootstrap().catch((error) => addLog(`✗ Bootstrap FAILED: ${safeStringify(error)}`));

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const runAll = async () => {
		if (isRunningRef.current) return;
		if (!sessionReady) return;
		isRunningRef.current = true;
		setIsRunning(true);
		setResults([]);
		setProgress({ current: 0, total: METHODS.length });
		addLog(`========== Run All Started (${METHODS.length} methods) ==========`);

		const originalWarn = console.warn;
		const originalError = console.error;
		const forward = (prefix) => (...args) => {
			addLog(`${prefix} ${args.map((a) => (typeof a === 'string' ? a : safeStringify(a))).join(' ')}`);
		};
		console.warn = (...args) => {
			forward('⚠')(...args);
			originalWarn(...args);
		};
		console.error = (...args) => {
			forward('⚠')(...args);
			originalError(...args);
		};

		let passedCount = 0;
		try {
			for (let i = 0; i < METHODS.length; i++) {
				const method = METHODS[i];
				setProgress({ current: i + 1, total: METHODS.length });
				addLog(`→ CALL ${method.name}`);
				const start = Date.now();
				let status = 'success';
				let response = null;
				try {
					response = await withTimeout(method.run(), method.name);
				} catch (error) {
					status = 'failure';
					response = error;
				}
				const duration = Date.now() - start;
				if (status === 'success') {
					passedCount += 1;
					addLog(`✓ ${method.name} OK (${duration}ms)`);
				} else {
					addLog(`✗ ${method.name} FAILED (${duration}ms): ${safeStringify(response)}`);
				}
				const result = { key: `${method.name}-${i}`, name: method.name, group: method.group, status, duration, response };
				setResults((prev) => [...prev, result]);
			}
		} finally {
			console.warn = originalWarn;
			console.error = originalError;
		}

		addLog(`========== Run All Finished — ${passedCount}/${METHODS.length} passed ==========`);
		isRunningRef.current = false;
		setIsRunning(false);
	};

	const renderResultItem = useCallback(({ item }) => <ResultRow item={item} onSelect={setSelected} />, []);
	const renderLogItem = useCallback(({ item }) => <LogRow item={item} />, []);

	const total = results.length;
	const passed = results.filter((r) => r.status === 'success').length;
	const failed = total - passed;

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.screen}>
				<StatusBar style='light' />
				<View style={styles.header}>
					<Text style={styles.headerTitle}>AppsFlyer Expo Example App</Text>
					<Text style={styles.headerSubtitle}>{Platform.OS} · {METHODS.length} methods</Text>
				</View>

				<View style={styles.runSection}>
					<Pressable
						style={[styles.runButton, (isRunning || !sessionReady) && styles.runButtonDisabled]}
						onPress={runAll}
						disabled={isRunning || !sessionReady}
						accessibilityLabel='runAllButton'>
						{isRunning ? (
							<ActivityIndicator color={ON_ACCENT} />
						) : (
							<Text style={styles.runButtonText}>
								{!sessionReady ? 'Waiting for session…' : total > 0 ? 'Run Again' : 'Run All Methods'}
							</Text>
						)}
					</Pressable>

					<Text style={styles.progressText}>{sessionReady ? 'Session ready' : 'Bootstrapping…'}</Text>

					{isRunning && (
						<Text style={styles.progressText}>
							Running {progress.current}/{progress.total}… {METHODS[progress.current - 1]?.name ?? ''}
						</Text>
					)}

					{total > 0 && !isRunning && (
						<View style={styles.summaryRow}>
							<Text style={styles.summaryChip}>{total} total</Text>
							<Text style={[styles.summaryChip, styles.summaryPass]}>{passed} pass</Text>
							<Text style={[styles.summaryChip, failed > 0 && styles.summaryFail]}>{failed} fail</Text>
						</View>
					)}
				</View>

				<View style={styles.tabRow}>
					<Pressable
						style={[styles.tabButton, activeTab === 'results' && styles.tabButtonActive]}
						onPress={() => setActiveTab('results')}>
						<Text style={[styles.tabLabel, activeTab === 'results' && styles.tabLabelActive]}>Results</Text>
					</Pressable>
					<Pressable
						style={[styles.tabButton, activeTab === 'logs' && styles.tabButtonActive]}
						onPress={() => setActiveTab('logs')}>
						<Text style={[styles.tabLabel, activeTab === 'logs' && styles.tabLabelActive]}>Logs ({logs.length})</Text>
					</Pressable>
				</View>

				{activeTab === 'results' ? (
					<FlatList
						data={results}
						keyExtractor={(item) => item.key}
						style={styles.list}
						contentContainerStyle={results.length === 0 && styles.listEmpty}
						ListEmptyComponent={
							<Text style={styles.emptyText}>
								{isRunning ? 'Starting…' : 'Tap "Run All Methods" to start'}
							</Text>
						}
						renderItem={renderResultItem}
						getItemLayout={getResultItemLayout}
					/>
				) : (
					<>
						{logs.length > 0 && (
							<View style={styles.logActionsRow}>
								<Pressable style={styles.logActionButton} onPress={copyLogs}>
									<Text style={styles.logActionText}>{copyLabel}</Text>
								</Pressable>
								<Pressable style={styles.logActionButton} onPress={() => setLogs([])}>
									<Text style={[styles.logActionText, styles.clearButtonText]}>Clear</Text>
								</Pressable>
							</View>
						)}
						<FlatList
							ref={logListRef}
							data={logs}
							keyExtractor={(item) => item.key}
							style={styles.list}
							contentContainerStyle={logs.length === 0 && styles.listEmpty}
							onContentSizeChange={() => logListRef.current?.scrollToEnd({ animated: true })}
							ListEmptyComponent={<Text style={styles.emptyText}>Logs appear here during a run</Text>}
							renderItem={renderLogItem}
						/>
					</>
				)}

				<Modal visible={!!selected} animationType='slide' onRequestClose={() => setSelected(null)}>
					{/* Modal renders into its own native root, so it needs its own SafeAreaProvider, not just a SafeAreaView. */}
					<SafeAreaProvider>
						<SafeAreaView style={styles.modal}>
							<View style={styles.modalHeader}>
								<Text style={styles.modalTitle}>{selected?.name}</Text>
								<Pressable onPress={() => setSelected(null)}>
									<Text style={styles.modalClose}>Close</Text>
								</Pressable>
							</View>
							<ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
								<Text style={styles.modalLabel}>
									{selected?.status.toUpperCase()} · {selected?.duration}ms · {selected?.group}
								</Text>
								<Text style={styles.modalJson}>{selected ? safeStringify(selected.response) : ''}</Text>
							</ScrollView>
						</SafeAreaView>
					</SafeAreaProvider>
				</Modal>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

// Modern black & white: white is the "accent" (primary actions, active states) on a black
// ground; grays carry secondary text/chrome. Pass/fail/warn colors stay — they're functional
// status signal for a test runner, not decoration.
const ACCENT = '#FFFFFF';
const ON_ACCENT = '#000000';
const BG = '#000000';
const SURFACE = '#1C1C1E';
const BORDER = '#2C2C2E';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#8E8E93';
const TEXT_TERTIARY = '#5A5A5C';
const GREEN = '#3DDC84';
const RED = '#FF5252';
const AMBER = '#FFC107';

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
		color: TEXT_PRIMARY,
		fontSize: 28,
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	headerSubtitle: {
		color: TEXT_SECONDARY,
		fontSize: 14,
		marginTop: 2,
	},
	runSection: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		gap: 8,
	},
	runButton: {
		backgroundColor: ACCENT,
		borderRadius: 12,
		paddingVertical: 13,
		alignItems: 'center',
	},
	runButtonDisabled: {
		backgroundColor: BORDER,
	},
	runButtonText: {
		color: ON_ACCENT,
		fontWeight: '700',
		fontSize: 16,
	},
	progressText: {
		color: TEXT_SECONDARY,
		fontSize: 12,
		fontFamily: 'Menlo, Courier',
	},
	summaryRow: {
		flexDirection: 'row',
		gap: 12,
	},
	summaryChip: {
		color: TEXT_PRIMARY,
		fontSize: 13,
		fontWeight: '600',
	},
	summaryPass: {
		color: GREEN,
	},
	summaryFail: {
		color: RED,
	},
	tabRow: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		gap: 8,
		marginBottom: 8,
	},
	tabButton: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: 8,
		alignItems: 'center',
		backgroundColor: SURFACE,
	},
	tabButtonActive: {
		backgroundColor: ACCENT,
	},
	tabLabel: {
		color: TEXT_SECONDARY,
		fontSize: 13,
		fontWeight: '600',
	},
	tabLabelActive: {
		color: ON_ACCENT,
	},
	logActionsRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 16,
		paddingRight: 16,
		marginBottom: 6,
	},
	logActionButton: {
		paddingVertical: 2,
	},
	logActionText: {
		color: TEXT_PRIMARY,
		fontSize: 12,
		fontWeight: '600',
	},
	clearButtonText: {
		color: RED,
	},
	logRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		paddingVertical: 3,
	},
	logTime: {
		color: TEXT_TERTIARY,
		fontSize: 11,
		fontFamily: 'Menlo, Courier',
		width: 72,
	},
	logText: {
		flex: 1,
		fontSize: 11,
		fontFamily: 'Menlo, Courier',
	},
	list: {
		flex: 1,
		paddingHorizontal: 16,
	},
	listEmpty: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		color: TEXT_TERTIARY,
		fontSize: 14,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: SURFACE,
		borderRadius: 10,
		height: 56, // keep in sync with RESULT_ROW_PITCH's getItemLayout math
		paddingHorizontal: 12,
		marginBottom: 6,
		gap: 10,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	dotSuccess: {
		backgroundColor: GREEN,
	},
	dotFailure: {
		backgroundColor: RED,
	},
	rowBody: {
		flex: 1,
	},
	rowName: {
		color: TEXT_PRIMARY,
		fontSize: 14,
		fontFamily: 'Menlo, Courier',
		fontWeight: '600',
	},
	rowGroup: {
		color: TEXT_SECONDARY,
		fontSize: 11,
		marginTop: 2,
	},
	rowDuration: {
		color: TEXT_SECONDARY,
		fontSize: 12,
		fontFamily: 'Menlo, Courier',
	},
	modal: {
		flex: 1,
		backgroundColor: BG,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: BORDER,
	},
	modalTitle: {
		color: TEXT_PRIMARY,
		fontSize: 18,
		fontWeight: '700',
		fontFamily: 'Menlo, Courier',
	},
	modalClose: {
		color: TEXT_PRIMARY,
		fontSize: 15,
		fontWeight: '600',
	},
	modalBody: {
		flex: 1,
	},
	modalBodyContent: {
		padding: 20,
	},
	modalLabel: {
		color: TEXT_SECONDARY,
		fontSize: 12,
		marginBottom: 10,
	},
	modalJson: {
		color: TEXT_PRIMARY,
		fontSize: 13,
		fontFamily: 'Menlo, Courier',
		lineHeight: 19,
	},
});
