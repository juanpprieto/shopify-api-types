# Decision 009: AI-Generated README + Script Consolidation

**Date**: 2025-08-14  
**Status**: Approved  
**Context**: Phase 5+ optimization and code reduction

## Background

After completing Phase 5 (version model + schema comparisons), we identified
opportunities to reduce code complexity and improve documentation quality:

1. **Duplicate README logic**: `generate-docs.ts` (504 LOC) duplicates changelog
   functionality that could be better handled by AI
2. **Script proliferation**: 5 separate `generate-*` scripts (1,469 LOC total)
   with overlapping patterns

## Decision

Implement two-phase optimization:

### Phase 1: AI-Generated Full README (High Priority)

Replace complex template-based README generation with AI-powered full document
generation.

**Current State:**

- `generate-docs.ts`: 504 LOC of template logic
- Static template with placeholder replacement
- Simplified changelog summarization

**Target State:**

- AI prompt generates complete README
- `generate-docs.ts`: ~50-100 LOC (data prep + AI invocation)
- Higher quality, more dynamic documentation

### Phase 2: Script Consolidation (Medium Priority)

Consolidate simple generation scripts into unified interface.

**Consolidation Scope:**

- ✅ Consolidate: `generate-exports.ts` (266 LOC), `generate-comparisons.ts` (77
  LOC), `generate-indexes.ts` (234 LOC)
- ❌ Keep separate: `generate-changelog.ts` (388 LOC - complex CLI),
  `generate-docs.ts` (AI integration)

**Target Structure:**

```
scripts/
├── generate.ts              # Consolidated: exports, comparisons, indexes
├── generate-changelog.ts    # Keep separate (complex CLI)
├── generate-docs.ts         # Keep separate (AI integration)
```

## Implementation Tasks

### Phase 1: AI README

1. **Task 1A**: Analyze current README template structure and requirements
2. **Task 1B**: Enhance document-changes prompt with full README generation
   capabilities
3. **Task 1C**: Update generate-docs.ts to use AI prompt instead of template
   logic
4. **Task 1D**: Test AI-generated README and refine prompt

### Phase 2: Consolidation

1. **Task 2A**: Create consolidated scripts/generate.ts with subcommands
2. **Task 2B-D**: Migrate generate-exports, generate-comparisons,
   generate-indexes logic
3. **Task 2E**: Update package.json scripts and CI workflows
4. **Task 2F**: Test consolidated structure and cleanup old files

## Impact

**Code Reduction:**

- Phase 1: ~400 LOC reduction (504 → ~100)
- Phase 2: ~577 LOC consolidation into unified structure
- **Total**: ~570 LOC reduction + improved quality

**Scripts Reduction:**

- Before: 5 generate scripts
- After: 3 generate scripts

**Quality Improvement:**

- AI-generated documentation vs static templates
- Unified script interface vs scattered commands

## Risks & Mitigations

**Risk**: AI prompt consistency  
**Mitigation**: Comprehensive prompt testing and iteration

**Risk**: Breaking existing workflows  
**Mitigation**: Maintain backward compatibility in npm scripts during transition

## Success Criteria

1. AI-generated README maintains all current sections with improved quality
2. Consolidated generate script supports all existing functionality
3. All CI workflows continue to function without modification
4. Net code reduction of >500 LOC
5. Documentation quality improvement verified through review

## Next Steps

1. Begin with Task 1A (README structure analysis)
2. Iterate through Phase 1 tasks before starting Phase 2
3. Validate each phase before proceeding to next
