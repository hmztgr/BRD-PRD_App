# Multi-Tab Persistence Implementation Plan

**Project:** BRD-PRD App Claude  
**Issue:** Save/Resume functionality not working + Tab switching loses progress  
**Created:** September 3, 2025  
**Status:** Implementation in Progress  

## Executive Summary

Transform the document creation interface from a single-task system to a true multi-tasking platform where all tabs (Chat, Upload, Research, Progress, Generate) remain active and continue processing in the background.

## Core Issues Identified

1. **API Endpoints Return 404** - Save/Resume API calls fail
2. **Tab Switching Loses Progress** - Components remount when switching tabs
3. **No Background Processing** - Research/Generation stops when switching tabs
4. **Mode Switching Issues** - Advanced Mode reverts to Standard on reload
5. **Parameter Confusion** - URL uses `project=` but code looks for `projectId`

---

## Implementation Phases

### ✅ Phase 1: Create Implementation Document
**Status:** ✅ COMPLETED  
**Date:** September 3, 2025

- [x] Document created with complete implementation plan
- [x] All technical requirements defined
- [x] File structure and changes outlined

### 🔄 Phase 2: Fix API Routing Infrastructure
**Status:** 🔄 IN PROGRESS  
**Priority:** CRITICAL

#### Tasks:
- [ ] **2.1** Verify API folder structure matches Next.js App Router conventions
- [ ] **2.2** Fix dynamic parameter extraction in route handlers
- [ ] **2.3** Add comprehensive error logging to identify routing issues
- [ ] **2.4** Test API endpoints with proper project IDs

**Files to modify:**
- `src/app/api/projects/[id]/session/save/route.ts`
- `src/app/api/projects/[id]/session/resume/route.ts`

**Expected Result:** API endpoints return proper responses instead of 404 errors.

### 📋 Phase 3: Fix URL Parameter Handling
**Status:** PENDING  
**Priority:** HIGH

#### Tasks:
- [ ] **3.1** Update `new-document-client.tsx` to check both `project` and `projectId` parameters
- [ ] **3.2** Standardize parameter usage to `projectId` throughout application
- [ ] **3.3** Update `projects-page-client.tsx` to use consistent navigation parameters
- [ ] **3.4** Test parameter passing from projects page to document creation

**Files to modify:**
- `src/app/[locale]/documents/new/new-document-client.tsx`
- `src/app/[locale]/projects/projects-page-client.tsx`

### 📋 Phase 4: Implement Tab Persistence Architecture
**Status:** PENDING  
**Priority:** CRITICAL

#### Tasks:
- [ ] **4.1** Replace `TabsContent` with custom CSS visibility-based rendering
- [ ] **4.2** Keep all tab components mounted throughout session
- [ ] **4.3** Implement state management for each tab type
- [ ] **4.4** Add visual feedback system for tab states

**Technical Approach:**
```typescript
// Replace TabsContent with:
<div className={activeTab === 'chat' ? 'block' : 'hidden'}>
  <EnhancedChatInterface ... />
</div>
<div className={activeTab === 'research' ? 'block' : 'hidden'}>
  <DataGatheringPanel ... />
</div>
```

**Files to modify:**
- `src/app/[locale]/documents/new/new-document-client.tsx`

### 📋 Phase 5: Implement Centralized State Management
**Status:** PENDING  
**Priority:** CRITICAL

#### Tasks:
- [ ] **5.1** Create comprehensive state object in parent component
- [ ] **5.2** Implement state interfaces for each tab type
- [ ] **5.3** Pass state management functions to child components
- [ ] **5.4** Add state persistence layer

**State Structure:**
```typescript
interface TabStates {
  chat: {
    messages: Message[]
    conversationId: string
    isLoading: boolean
  }
  research: {
    activeQueries: ResearchQuery[]
    results: ResearchResult[]
    isProcessing: boolean
  }
  upload: {
    files: UploadedFile[]
    processingStatus: ProcessingStatus[]
    isUploading: boolean
  }
  // etc...
}
```

### 📋 Phase 6: Update Chat Interface for External State Management
**Status:** PENDING  
**Priority:** HIGH

#### Tasks:
- [ ] **6.1** Update `EnhancedChatInterface` to accept external state props
- [ ] **6.2** Implement fallback to internal state if props not provided
- [ ] **6.3** Fix auto-save functionality with proper API integration
- [ ] **6.4** Always show Save/Pause/Resume buttons in Advanced Mode

**Files to modify:**
- `src/components/chat/enhanced-chat-interface.tsx`

### 📋 Phase 7: Update Research Tab for Background Processing
**Status:** PENDING  
**Priority:** HIGH

#### Tasks:
- [ ] **7.1** Update `DataGatheringPanel` to continue processing in background
- [ ] **7.2** Implement progress reporting to parent component
- [ ] **7.3** Add completion notifications
- [ ] **7.4** Show research status in tab header

**Files to modify:**
- `src/components/research/data-gathering-panel.tsx`

### 📋 Phase 8: Update Upload Tab for Background Processing
**Status:** PENDING  
**Priority:** MEDIUM

#### Tasks:
- [ ] **8.1** Update `DocumentUploader` to continue processing in background
- [ ] **8.2** Show upload progress in tab header
- [ ] **8.3** Implement file processing queue
- [ ] **8.4** Add upload completion notifications

**Files to modify:**
- `src/components/document/document-uploader.tsx`

### 📋 Phase 9: Update Generation Tab for Queue Management
**Status:** PENDING  
**Priority:** MEDIUM

#### Tasks:
- [ ] **9.1** Update `MultiDocumentGenerator` to support background processing
- [ ] **9.2** Implement generation queue system
- [ ] **9.3** Show generation progress in tab header
- [ ] **9.4** Add generation completion notifications

**Files to modify:**
- `src/components/document/multi-document-generator.tsx`

### 📋 Phase 10: Implement Visual Feedback System
**Status:** PENDING  
**Priority:** MEDIUM

#### Tasks:
- [ ] **10.1** Add activity indicators to tab headers
- [ ] **10.2** Implement notification badges for completed operations
- [ ] **10.3** Add progress bars for long-running operations
- [ ] **10.4** Create status icons and color coding

**Visual Elements:**
- Activity indicators (spinning icons)
- Notification badges ("3 new results")
- Progress bars (75% complete)
- Status colors (green=completed, blue=processing, red=error)

### 📋 Phase 11: Implement Comprehensive Save/Resume
**Status:** PENDING  
**Priority:** CRITICAL

#### Tasks:
- [ ] **11.1** Update save endpoint to store all tab states
- [ ] **11.2** Update resume endpoint to restore all tab states
- [ ] **11.3** Implement mode persistence (Advanced/Standard)
- [ ] **11.4** Add auto-save functionality (30-second intervals)
- [ ] **11.5** Save before tab switches and navigation

**API Enhancement:**
```typescript
// Save payload includes all tab states
{
  project: { ... },
  tabStates: {
    chat: { messages, conversationId },
    research: { queries, results },
    upload: { files, status },
    progress: { milestones },
    generate: { queue, completed }
  },
  uiState: { activeTab, mode }
}
```

### 📋 Phase 12: Comprehensive Testing
**Status:** PENDING  
**Priority:** CRITICAL

#### Test Scenarios:
- [ ] **12.1** Multi-tab workflow test
  - Start chat conversation
  - Switch to Research, start research  
  - Switch back to Chat - conversation preserved
  - Research continues in background
  - Receive notification when research completes
  
- [ ] **12.2** Background processing test
  - Start file upload
  - Switch to Chat tab
  - Upload continues in background
  - Upload completion notification received
  
- [ ] **12.3** Save/Resume functionality test
  - Create content in multiple tabs
  - Save session manually
  - Navigate away and return
  - All tab states fully restored
  
- [ ] **12.4** Auto-save test
  - Work across multiple tabs
  - Verify auto-save occurs every 30 seconds
  - Check all tab states are preserved
  
- [ ] **12.5** Mode persistence test
  - Work in Advanced Mode
  - Save and navigate away
  - Return - should load in Advanced Mode
  
- [ ] **12.6** Error handling test
  - Test with network failures
  - Test with incomplete data
  - Verify graceful degradation

---

## Technical Specifications

### State Management Architecture

```typescript
interface ProjectSessionState {
  projectId: string
  mode: 'standard' | 'advanced'
  activeTab: string
  lastSaved: Date
  tabStates: {
    chat: ChatTabState
    upload: UploadTabState  
    research: ResearchTabState
    progress: ProgressTabState
    generate: GenerateTabState
  }
}
```

### Tab Persistence Strategy

1. **Keep Components Mounted**: Never unmount tab components
2. **CSS Visibility Control**: Use `display: none/block` to show/hide tabs
3. **Background Processing**: Allow operations to continue when tabs are hidden
4. **State Synchronization**: Update parent state from child components
5. **Visual Feedback**: Show activity indicators in tab headers

### API Integration Points

1. **Save Session**: `POST /api/projects/[id]/session/save`
2. **Resume Session**: `POST /api/projects/[id]/session/resume` 
3. **Auto-save**: Every 30 seconds during activity
4. **Manual Save**: User-triggered save operations
5. **Navigation Save**: Before page navigation

---

## Success Criteria

### Must Have (Production Blockers)
- ✅ All tab states persist when switching tabs
- ✅ Save/Resume functionality works end-to-end
- ✅ Background operations continue when tabs are hidden
- ✅ Mode persistence (Advanced/Standard) works correctly
- ✅ Auto-save prevents data loss

### Should Have (Quality Improvements)  
- ✅ Visual feedback for all operations
- ✅ Notification system for completed operations
- ✅ Progress indicators for long-running tasks
- ✅ Comprehensive error handling

### Nice to Have (Future Enhancements)
- WebSocket integration for real-time updates
- Cross-tab communication
- Operation prioritization
- Advanced state compression

---

## Risk Mitigation

### High Risk Items
1. **Performance Impact**: Keeping all components mounted
   - Mitigation: Implement lazy loading, optimize rendering
2. **State Complexity**: Managing multiple tab states
   - Mitigation: Clear state interfaces, comprehensive testing
3. **Memory Usage**: Background operations
   - Mitigation: Cleanup inactive operations, memory monitoring

### Medium Risk Items
1. **Browser Compatibility**: CSS visibility approach
   - Mitigation: Cross-browser testing, fallback strategies
2. **API Load**: Frequent auto-save calls
   - Mitigation: Debouncing, optimized payloads

---

## Implementation Progress Tracking

This document will be updated as implementation progresses. Each completed task will be marked with ✅ and include completion date and test results.

**Next Action:** Begin Phase 2 - Fix API Routing Infrastructure

---

**Last Updated:** September 3, 2025  
**Estimated Completion:** September 4, 2025  
**Implementation Status:** 🔄 Phase 2 In Progress