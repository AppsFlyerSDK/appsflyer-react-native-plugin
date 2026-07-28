---
name: rn-architect-guardrails
description: Reviews and refactors React Native / Expo demo code (App.js, components) to eliminate common AI-generated anti-patterns — useEffect state-syncing, unjustified useMemo/useCallback, business logic trapped inside component bodies, and missing FlatList perf props. Use when writing or reviewing React Native components, especially in demos/appsflyer-expo-app, or when the user asks to "review this component", "clean up this hook", or "audit for React anti-patterns".
---

# React Native Architect Guardrails

Enforce these 4 rules on any React Native component you write or review. Fix violations in place; don't just flag them.

## 1. Derived state over `useEffect`

Never use `useEffect` + a state setter to sync/filter/format/map data that's computable during render. Delete the effect and the secondary `useState`; compute inline.

```js
// BAD
const [data, setData] = useState([]);
const [filtered, setFiltered] = useState([]);
useEffect(() => { setFiltered(data.filter(i => i.active)) }, [data]);

// GOOD
const filtered = data.filter(i => i.active);
```

Same rule for state that should reset when a prop changes: don't `useEffect` to detect the prop change and call a setter — give the component a `key={propValue}` so React remounts it fresh instead.

## 2. Justified `useMemo`/`useCallback` only

Ban memoization for standard handlers or cheap transforms. Only keep it when either:
- the value/function is passed to a child wrapped in `React.memo()`, or
- it's an expensive computation (heavy regex, array ops over 1000+ items).

```js
// BAD
const onPress = useCallback(() => navigate('Home'), []);
// GOOD
const onPress = () => navigate('Home');
```

Exception: `FlatList`'s `renderItem` counts as the `React.memo()` case — FlatList recycles item renderers internally, so an inline arrow function defined in JSX defeats that. Wrap it in `useCallback` (or define it outside the component if it doesn't close over props/state).

## 3. Pure function extraction

Any function inside a component that doesn't read/write state, props, or hooks belongs outside the component (bottom of file or a util module) as a plain, testable function.

```js
// BAD
function MyComponent({ text }) {
  const formatText = (str) => str.toUpperCase();
  return <Text>{formatText(text)}</Text>;
}
// GOOD
const formatText = (str) => str.toUpperCase();
function MyComponent({ text }) {
  return <Text>{formatText(text)}</Text>;
}
```

## 4. `FlatList` perf props

For any `FlatList` with a large or frequently-updated `data` array: give it a stable `keyExtractor` (already required), a `useCallback`-wrapped `renderItem` (see rule 2 exception), and, if every row is the same height/width, `getItemLayout={(data, index) => ({length, offset: length * index, index})}` — it skips FlatList's async layout measurement pass entirely.

## Workflow

1. Scan the target file(s) for `useEffect`, `useMemo`, `useCallback`, non-hook helper functions declared inside components, and `FlatList` usage.
2. For each hit, apply the matching rule above and rewrite in place.
3. Report each fix as one line: `file:line — rule violated → what changed`.
