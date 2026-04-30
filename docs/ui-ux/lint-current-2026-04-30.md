
> dm-hub@0.0.0 lint
> eslint .


/Users/andrew/Projects/DM_Hub/src/components/CommandPalette.jsx
  30:27  error    Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `encounter`, but the source dependencies were [query]. Inferred different dependency than source.

  28 |   ];
  29 |
> 30 |   const results = useMemo(() => {
     |                           ^^^^^^^
> 31 |     if (!query) return actions.map(a => ({ ...a, type: 'action' }));
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 32 |
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 60 |     return [...filteredActions, ...filteredMonsters, ...filteredRules];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 61 |   }, [query]);
     | ^^^^ Could not preserve existing manual memoization
  62 |
  63 |   useEffect(() => {
  64 |     setSelectedIndex(0);       react-hooks/preserve-manual-memoization
  30:27  error    Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `toggleRules`, but the source dependencies were [query]. Inferred different dependency than source.

  28 |   ];
  29 |
> 30 |   const results = useMemo(() => {
     |                           ^^^^^^^
> 31 |     if (!query) return actions.map(a => ({ ...a, type: 'action' }));
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 32 |
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 60 |     return [...filteredActions, ...filteredMonsters, ...filteredRules];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 61 |   }, [query]);
     | ^^^^ Could not preserve existing manual memoization
  62 |
  63 |   useEffect(() => {
  64 |     setSelectedIndex(0);     react-hooks/preserve-manual-memoization
  30:27  error    Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `t2`, but the source dependencies were [query]. Inferred different dependency than source.

  28 |   ];
  29 |
> 30 |   const results = useMemo(() => {
     |                           ^^^^^^^
> 31 |     if (!query) return actions.map(a => ({ ...a, type: 'action' }));
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 32 |
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 60 |     return [...filteredActions, ...filteredMonsters, ...filteredRules];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 61 |   }, [query]);
     | ^^^^ Could not preserve existing manual memoization
  62 |
  63 |   useEffect(() => {
  64 |     setSelectedIndex(0);              react-hooks/preserve-manual-memoization
  30:27  error    Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `encounter`, but the source dependencies were [query]. Inferred different dependency than source.

  28 |   ];
  29 |
> 30 |   const results = useMemo(() => {
     |                           ^^^^^^^
> 31 |     if (!query) return actions.map(a => ({ ...a, type: 'action' }));
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 32 |
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 60 |     return [...filteredActions, ...filteredMonsters, ...filteredRules];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 61 |   }, [query]);
     | ^^^^ Could not preserve existing manual memoization
  62 |
  63 |   useEffect(() => {
  64 |     setSelectedIndex(0);       react-hooks/preserve-manual-memoization
  30:27  error    Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `setView`, but the source dependencies were [query]. Inferred different dependency than source.

  28 |   ];
  29 |
> 30 |   const results = useMemo(() => {
     |                           ^^^^^^^
> 31 |     if (!query) return actions.map(a => ({ ...a, type: 'action' }));
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 32 |
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 60 |     return [...filteredActions, ...filteredMonsters, ...filteredRules];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 61 |   }, [query]);
     | ^^^^ Could not preserve existing manual memoization
  62 |
  63 |   useEffect(() => {
  64 |     setSelectedIndex(0);         react-hooks/preserve-manual-memoization
  30:27  error    Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `toggleBestiary`, but the source dependencies were [query]. Inferred different dependency than source.

  28 |   ];
  29 |
> 30 |   const results = useMemo(() => {
     |                           ^^^^^^^
> 31 |     if (!query) return actions.map(a => ({ ...a, type: 'action' }));
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 32 |
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 60 |     return [...filteredActions, ...filteredMonsters, ...filteredRules];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 61 |   }, [query]);
     | ^^^^ Could not preserve existing manual memoization
  62 |
  63 |   useEffect(() => {
  64 |     setSelectedIndex(0);  react-hooks/preserve-manual-memoization
  30:27  error    Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `toggleRules`, but the source dependencies were [query]. Inferred different dependency than source.

  28 |   ];
  29 |
> 30 |   const results = useMemo(() => {
     |                           ^^^^^^^
> 31 |     if (!query) return actions.map(a => ({ ...a, type: 'action' }));
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 32 |
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 60 |     return [...filteredActions, ...filteredMonsters, ...filteredRules];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 61 |   }, [query]);
     | ^^^^ Could not preserve existing manual memoization
  62 |
  63 |   useEffect(() => {
  64 |     setSelectedIndex(0);     react-hooks/preserve-manual-memoization
  61:6   warning  React Hook useMemo has missing dependencies: 'actions', 'encounter', and 'toggleRules'. Either include them or remove the dependency array. If 'toggleRules' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/exhaustive-deps
  64:5   error    Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

  62 |
  63 |   useEffect(() => {
> 64 |     setSelectedIndex(0);
     |     ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  65 |   }, [query]);
  66 |
  67 |   useEffect(() => {                                                                                                                                                                                                                                react-hooks/set-state-in-effect

/Users/andrew/Projects/DM_Hub/src/components/EntityCard.jsx
  43:7  error    Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

  41 |     if (!entity) return;
  42 |     if (entity.hp < prevHpRef.current) {
> 43 |       setShowDamageFlash(true);
     |       ^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  44 |       const timer = setTimeout(() => setShowDamageFlash(false), 500);
  45 |       return () => clearTimeout(timer);
  46 |     }  react-hooks/set-state-in-effect
  48:6  warning  React Hook useEffect has a missing dependency: 'entity'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/exhaustive-deps

/Users/andrew/Projects/DM_Hub/src/components/MapDisplay.jsx
   63:21  error    Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

  61 |   useEffect(() => {
  62 |     const dataUrl = map?.background?.dataUrl;
> 63 |     if (!dataUrl) { setBgImage(null); return; }
     |                     ^^^^^^^^^^ Avoid calling setState() directly within an effect
  64 |     const img = new Image();
  65 |     img.onload = () => setBgImage(img);
  66 |     img.src = dataUrl;  react-hooks/set-state-in-effect
  787:6   warning  React Hook useEffect has missing dependencies: 'viewOffset.x', 'viewOffset.y', and 'zoom'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps

/Users/andrew/Projects/DM_Hub/src/components/RulesPanel.jsx
  14:14  error  Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components

/Users/andrew/Projects/DM_Hub/src/components/ToastProvider.jsx
  13:14  error  Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components

/Users/andrew/Projects/DM_Hub/src/hooks/useEncounterState.js
  112:6  warning  React Hook useEffect has a missing dependency: 'state'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 16 problems (12 errors, 4 warnings)

