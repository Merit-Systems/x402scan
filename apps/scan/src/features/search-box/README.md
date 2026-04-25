# Search Box

Self-contained copy of the AgentCash search UX for x402scan.

The core component is `SearchBox`. It only needs a same-origin search API and
caller-provided selection behavior. Keep app-specific URL building and telemetry
wiring outside this folder.

```tsx
import { SearchBox } from './features/search-box';

<SearchBox
  protocols={['x402']}
  previewMode="off"
  initialAutocompleteCache={buildTimeCache}
  onSelectSuggestion={suggestion => {
    // App-specific navigation.
  }}
  onSelectResult={result => {
    // App-specific navigation.
  }}
/>;
```

Local dependencies to provide or adjust after copying:

- `@/components/ui/{button,command,dialog,skeleton,textarea,tooltip}`:
  shadcn primitives used by the input, list, feedback dialog, and telemetry.
- `@/lib/utils`: `cn` helper; replace with your app's class-name utility.
- `lucide-react` and `motion/react`: icons and popover transitions.
- Next App Router: `useSearchBoxNavigation` syncs committed searches to `?q=`.

Variable integration points:

- `apiBaseUrl`: normally omit. x402scan proxies same-origin `/api/search/*`
  requests to AgentCash `/api/external/search/*` with a server-only API key.
- `protocols`: use `['x402']`, `['mpp']`, or `['x402', 'mpp']`.
- `enableKeyboardShortcut`: disable in apps that already bind `⌘K` globally.
- `previewMode`: use `'animated'` only for passive demos like the homepage.
- `initialAutocompleteCache`: optional build/render-time autocomplete payloads.
  Homepage animation uses this cache and does not generate API traffic for every
  scripted character; live requests start after focus/click/type.
- `onSelectSuggestion`, `onSelectResult`, `onSearchSubmit`: keep destination
  behavior outside the core component.
- `onReportBadResults` and `showFeedbackControls`: opt into internal quality
  feedback without coupling the component to storage.

x402scan keeps scanner-linking behavior outside this folder at
`src/app/(app)/_components/search/x402-linked-search-box.tsx`.
