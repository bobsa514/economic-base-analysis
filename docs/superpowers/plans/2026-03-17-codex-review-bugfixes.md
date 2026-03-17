# Codex Review Bugfixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all confirmed bugs from the Codex code review — crashers, broken UI controls, wasted API calls, lint failures, and stale copy.

**Architecture:** Backend fixes ensure empty/missing data returns well-formed responses instead of crashing. Frontend fixes wire up disconnected state, skip unnecessary API calls, correct NAICS level detection, and extract components to satisfy React Compiler rules.

**Tech Stack:** Python/FastAPI (backend), TypeScript/Next.js 15/React (frontend), pytest, ESLint with React Compiler plugin

---

### Task 1: Fix LQ empty-data crash (P0)

**Files:**
- Modify: `backend/app/analysis/location_quotient.py:92-93`
- Modify: `backend/tests/test_location_quotient.py:42-53`

When `e_total == 0 or big_e_total == 0`, `calculate_lq` returns `[]` (a list), but the route handler does `result["industries"]` which crashes with `TypeError`. Fix: return a proper dict with zero values.

- [ ] **Step 1: Update the existing test to expect a dict**

In `backend/tests/test_location_quotient.py`, change `test_empty_data_returns_empty` to assert the new shape:

```python
@pytest.mark.asyncio
async def test_empty_data_returns_empty():
    """When no local data is returned, result should be a dict with zero employment."""
    with (
        patch("app.analysis.location_quotient.fetch_cbp_county", new_callable=AsyncMock, return_value=[]),
        patch("app.analysis.location_quotient.fetch_cbp_national", new_callable=AsyncMock, return_value=[]),
    ):
        result = await calculate_lq(
            client=None, fips="00000", year=2021, naics_level=2
        )

    assert result == {"total_employment": 0, "industries": []}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_location_quotient.py::test_empty_data_returns_empty -v`
Expected: FAIL (currently returns `[]` not a dict)

- [ ] **Step 3: Fix the return value in location_quotient.py**

In `backend/app/analysis/location_quotient.py`, change line 92-93 from:
```python
    if e_total == 0 or big_e_total == 0:
        return []
```
to:
```python
    if e_total == 0 or big_e_total == 0:
        return {"total_employment": 0, "industries": []}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_location_quotient.py -v`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/analysis/location_quotient.py backend/tests/test_location_quotient.py
git commit -m "fix: return proper dict from calculate_lq on empty data"
```

---

### Task 2: Fix shift-share empty-summary crash (P0)

**Files:**
- Modify: `backend/app/analysis/shift_share.py:106-107`
- Modify: `backend/tests/test_shift_share.py`

When `e_total_t0 == 0`, `calculate_shift_share` returns `{"summary": {}, "industries": []}`. The route then does `ShiftShareSummary(**results["summary"])` which crashes because the required fields are missing. Fix: return a complete summary with zeros.

- [ ] **Step 1: Add a test for empty shift-share data**

Add to `backend/tests/test_shift_share.py`:

```python
@pytest.mark.asyncio
async def test_empty_data_returns_complete_summary():
    """When national totals are 0, result should have a complete summary with zeros."""
    with (
        patch("app.analysis.shift_share.fetch_cbp_county", new_callable=AsyncMock, return_value=[]),
        patch("app.analysis.shift_share.fetch_cbp_national", new_callable=AsyncMock, return_value=[]),
    ):
        result = await calculate_shift_share(
            client=None, fips="00000", year_start=2018, year_end=2021, naics_level=2
        )

    assert result["summary"]["national_growth"] == 0
    assert result["summary"]["industry_mix"] == 0
    assert result["summary"]["regional_competitive"] == 0
    assert result["summary"]["total_change"] == 0
    assert result["summary"]["year_start"] == 2018
    assert result["summary"]["year_end"] == 2021
    assert result["industries"] == []
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_shift_share.py::test_empty_data_returns_complete_summary -v`
Expected: FAIL (KeyError on "national_growth")

- [ ] **Step 3: Fix the empty return in shift_share.py**

In `backend/app/analysis/shift_share.py`, change line 106-107 from:
```python
    if e_total_t0 == 0:
        return {"summary": {}, "industries": []}
```
to:
```python
    if e_total_t0 == 0:
        return {
            "summary": {
                "national_growth": 0,
                "industry_mix": 0,
                "regional_competitive": 0,
                "total_change": 0,
                "year_start": year_start,
                "year_end": year_end,
            },
            "industries": [],
        }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_shift_share.py -v`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/analysis/shift_share.py backend/tests/test_shift_share.py
git commit -m "fix: return complete summary dict from shift-share on empty data"
```

---

### Task 3: Fix Industry page NAICS level detection (P1)

**Files:**
- Modify: `frontend/src/app/industry/[naics]/page.tsx:44-45`

The Industry page determines NAICS level from string length: `naics.length as 2 | 3 | 4 | 5 | 6`. This misidentifies hyphenated 2-digit sectors like "31-33" (length 5) as 5-digit codes. Fix: replicate the backend's `get_naics_level` logic.

- [ ] **Step 1: Add a getNaicsLevel utility function and fix the page**

In `frontend/src/app/industry/[naics]/page.tsx`, add a helper function before the component and replace the broken line:

Add before the component (after the `const NAICS_LEVELS` declaration):
```typescript
/** Determine NAICS hierarchy level from a code string.
 *  Mirrors backend logic in cbp.py:get_naics_level. */
function getNaicsLevel(code: string): 2 | 3 | 4 | 5 | 6 {
  if (code.includes("-") || code.includes("/")) return 2;
  const len = code.length;
  if (len >= 2 && len <= 6) return len as 2 | 3 | 4 | 5 | 6;
  return 2; // fallback
}
```

Then change line 45 from:
```typescript
  const currentLevel = naics.length as 2 | 3 | 4 | 5 | 6;
```
to:
```typescript
  const currentLevel = getNaicsLevel(naics);
```

- [ ] **Step 2: Verify the build passes**

Run: `cd frontend && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/industry/\[naics\]/page.tsx
git commit -m "fix: use proper NAICS level detection for hyphenated sector codes"
```

---

### Task 4: Wire Compare page NAICS level selector to data hooks (P1)

**Files:**
- Modify: `frontend/src/app/compare/page.tsx:23,36,46,90-93`
- Modify: `frontend/src/components/compare/lq-comparison-chart.tsx:51-54,185-187`

The Compare page hardcodes `DEFAULT_NAICS_LEVEL = 2` when fetching LQ data, and the chart's NAICS level selector only changes local state without triggering a refetch. Fix: lift naicsLevel state to the page level, pass it through the data hooks AND down to the chart.

- [ ] **Step 1: Lift naicsLevel state to compare page and pass through**

In `frontend/src/app/compare/page.tsx`:

1. Add `naicsLevel` state to `ComparePageInner`:
```typescript
  const [naicsLevel, setNaicsLevel] = useState(DEFAULT_NAICS_LEVEL);
```

2. Change all 4 `useRegionCompareData` calls (lines 90-93) to use `naicsLevel` instead of `DEFAULT_NAICS_LEVEL`:
```typescript
  const r0 = useRegionCompareData(regionEntries[0]?.fips ?? "", naicsLevel, regionEntries[0]?.geoType);
  const r1 = useRegionCompareData(regionEntries[1]?.fips ?? "", naicsLevel, regionEntries[1]?.geoType);
  const r2 = useRegionCompareData(regionEntries[2]?.fips ?? "", naicsLevel, regionEntries[2]?.geoType);
  const r3 = useRegionCompareData(regionEntries[3]?.fips ?? "", naicsLevel, regionEntries[3]?.geoType);
```

3. Pass `naicsLevel` and `setNaicsLevel` to LQComparisonChart:
```typescript
  <LQComparisonChart
    regionsLQData={regionsForLQ}
    naicsLevel={naicsLevel}
    onNaicsLevelChange={setNaicsLevel}
  />
```

- [ ] **Step 2: Update LQComparisonChart to accept and use the props**

In `frontend/src/components/compare/lq-comparison-chart.tsx`:

1. Update the interface:
```typescript
interface LQComparisonChartProps {
  regionsLQData: RegionLQData[];
  naicsLevel: number;
  onNaicsLevelChange: (level: number) => void;
}
```

2. Update the component signature — remove internal state, use props:
```typescript
export default function LQComparisonChart({
  regionsLQData,
  naicsLevel,
  onNaicsLevelChange,
}: LQComparisonChartProps) {
```

3. Remove the internal `useState`:
```typescript
  // DELETE: const [naicsLevel, setNaicsLevel] = useState(2);
```

4. Update the Select's `onValueChange` to call the prop:
```typescript
  onValueChange={(v) => onNaicsLevelChange(Number(v))}
```

- [ ] **Step 3: Verify the build passes**

Run: `cd frontend && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/compare/page.tsx frontend/src/components/compare/lq-comparison-chart.tsx
git commit -m "fix: wire Compare page NAICS level selector to data hooks"
```

---

### Task 5: Prevent demographics request for ZIP in demographics-tab (P1)

**Files:**
- Modify: `frontend/src/components/explore/demographics-tab.tsx:29-50`

The demographics tab calls `useDemographics(fips, year, ...)` before checking if geoType is "zip". When geoType is "zip", it passes `undefined` as geoType to the hook, which makes it query as county — a wasted and incorrect request. Fix: pass empty string as fips when zip (hook's `enabled: !!fips` will prevent the fetch).

- [ ] **Step 1: Fix the hook call to disable for ZIP**

In `frontend/src/components/explore/demographics-tab.tsx`, change lines 32-36 from:
```typescript
  const { data, isLoading, isError, error } = useDemographics(
    fips,
    year,
    geoType !== "zip" ? geoType : undefined
  );
```
to:
```typescript
  const { data, isLoading, isError, error } = useDemographics(
    geoType === "zip" ? "" : fips,
    year,
    geoType
  );
```

This way, when geoType is "zip", fips is empty → `enabled: !!fips` is false → no request fires.

- [ ] **Step 2: Verify the build passes**

Run: `cd frontend && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/explore/demographics-tab.tsx
git commit -m "fix: skip demographics API call for ZIP code regions"
```

---

### Task 6: Fix lint errors — extract ColumnHeader, fix useMemo deps, fix setState-in-effect (P2)

**Files:**
- Modify: `frontend/src/components/explore/lq-tab.tsx:143-212,89,132`
- Modify: `frontend/src/components/explore/shift-share-tab.tsx:88,113-121,124`
- Modify: `frontend/src/components/layout/header.tsx:47-49`

10 lint errors total:
- `lq-tab.tsx`: 1 useMemo dep mismatch + 6 "component created during render" (ColumnHeader defined inside component)
- `shift-share-tab.tsx`: 1 useMemo dep mismatch + 1 "component created during render" (SortIcon defined inside component)
- `header.tsx`: 1 "setState synchronously within an effect"

- [ ] **Step 1: Fix lq-tab.tsx — extract ColumnHeader outside component**

The `ColumnHeader` component is defined inside `LQTab` (line 181) because it captures `handleSort` and `SortIcon` via closure. Extract it outside the component and pass the handlers as props. Similarly, `SortIcon` is defined inside (line 143) — extract it too.

Before the `LQTab` component, add:

```typescript
/** Sort direction indicator icon */
function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ArrowUpDown className="ml-1 inline h-3 w-3 text-slate-400" />;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-blue-600" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-blue-600" />
  );
}

/** Sortable column header with optional info tooltip */
function ColumnHeader({
  field,
  label,
  tooltip,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField;
  label: string;
  tooltip?: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}) {
  return (
    <th
      className="cursor-pointer px-4 py-3 text-left font-medium text-slate-600 select-none hover:text-slate-900"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger
              onClick={(e) => e.stopPropagation()}
              className="inline-flex"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-blue-500" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </th>
  );
}
```

Remove the `SortIcon` and `ColumnHeader` definitions from inside `LQTab`.

Update all `<ColumnHeader .../>` usages in the JSX to pass the extra props:
```tsx
<ColumnHeader field="naics_label" label="Industry" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
<ColumnHeader field="naics" label="NAICS" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
<ColumnHeader field="employment" label="Employment" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
<ColumnHeader field="lq" label="LQ" tooltip={COLUMN_TOOLTIPS.lq} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
<ColumnHeader field="local_share" label="Local Share %" tooltip={COLUMN_TOOLTIPS.local_share} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
<ColumnHeader field="national_share" label="National Share %" tooltip={COLUMN_TOOLTIPS.national_share} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
```

Also fix the useMemo dependency: change `data?.industries` to `data` (the React Compiler infers `data.industries` — aligning the dep makes it consistent):

```typescript
  }, [data, sortField, sortDir, minEmployment, lqPreset, minLQ, maxLQ]);
```

- [ ] **Step 2: Fix shift-share-tab.tsx — extract SortIcon, fix useMemo deps**

Extract `SortIcon` (line 113) outside `ShiftShareTab`:

```typescript
/** Sort direction indicator icon for shift-share table */
function ShiftShareSortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ArrowUpDown className="ml-1 inline h-3 w-3 text-slate-400" />;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-blue-600" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-blue-600" />
  );
}
```

Remove the internal `SortIcon` definition from inside `ShiftShareTab`.

Update usage inside the table header (line 500):
```tsx
<ShiftShareSortIcon field={col.field} sortField={sortField} sortDir={sortDir} />
```

Fix both useMemo dependencies:
- Line 102: change `data?.industries` to `data`
- Line 141: change `data?.industries` to `data`

- [ ] **Step 3: Fix header.tsx — avoid setState in effect body**

In `frontend/src/components/layout/header.tsx`, the effect at line 47-49 calls `setMobileMenuOpen(false)` synchronously in response to `pathname` changes. The React Compiler flags this. Fix: use a ref to track the previous pathname and only close the menu when it actually changes, OR simply remove the effect and close on link click (which is already done on line 114). The effect is redundant — every `<Link>` already calls `onClick={() => setMobileMenuOpen(false)}`. Delete the effect:

```typescript
  // DELETE lines 47-49:
  // useEffect(() => {
  //   setMobileMenuOpen(false);
  // }, [pathname]);
```

- [ ] **Step 4: Run lint to verify all 10 errors are fixed**

Run: `cd frontend && npm run lint`
Expected: 0 errors, 0 warnings

- [ ] **Step 5: Verify build still passes**

Run: `cd frontend && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/explore/lq-tab.tsx frontend/src/components/explore/shift-share-tab.tsx frontend/src/components/layout/header.tsx
git commit -m "fix: resolve all 10 lint errors (React Compiler rules)"
```

---

### Task 7: Fix About page stale tab name (P3)

**Files:**
- Modify: `frontend/src/app/about/page.tsx:143`

About page says "Browse the Overview tab" but the actual Explore page tab is "Economic Base". Fix: update the copy.

- [ ] **Step 1: Update the text**

Change `"Browse the Overview tab"` to `"Browse the Economic Base tab"` and update the description to match the actual tab content.

Change from:
```tsx
<h3 className="font-medium text-slate-900">Browse the Overview tab</h3>
<p className="mt-1 text-sm text-slate-600">
  The Overview tab shows headline metrics at a glance &mdash; total
  employment, number of establishments, annual payroll, and the top
  industries by employment. This gives you a quick snapshot of your
  region&rsquo;s economic profile.
</p>
```
to:
```tsx
<h3 className="font-medium text-slate-900">Browse the Economic Base tab</h3>
<p className="mt-1 text-sm text-slate-600">
  The Economic Base tab shows Location Quotients for all industries,
  revealing which sectors are concentrated locally compared to the
  national average. Industries with LQ &gt; 1 are &ldquo;basic&rdquo;
  (export-oriented) industries that drive the local economy.
</p>
```

- [ ] **Step 2: Verify the build passes**

Run: `cd frontend && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/about/page.tsx
git commit -m "fix: update About page to reference correct tab name"
```

---

### Task 8: Improve error messages in frontend API client (P3)

**Files:**
- Modify: `frontend/src/lib/api.ts:30-36`

Currently `fetchJSON` throws `API error 400: Bad Request` — discarding the response body which often contains a useful `detail` field from FastAPI. Fix: parse the response body and include the detail in the error message.

- [ ] **Step 1: Update fetchJSON to include response body detail**

In `frontend/src/lib/api.ts`, change the error handling from:
```typescript
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
```
to:
```typescript
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        if (body.detail) detail = body.detail;
      } catch {
        // Response body not JSON — use statusText
      }
      throw new Error(`API error ${res.status}: ${detail}`);
    }
```

- [ ] **Step 2: Verify the build passes**

Run: `cd frontend && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "fix: surface backend error details in frontend error messages"
```

---

### Task 9: Run full verification

- [ ] **Step 1: Run backend tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All tests pass (29 existing + 1 new = 30)

- [ ] **Step 2: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: 0 errors

- [ ] **Step 3: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Update documentation**

Update CHANGELOG.md with all fixes in this session.
