# Testing Checklist for Audio Download & Agent Name Features

## 🔍 **Manual Testing Steps**

### **Audio Download Button Testing**

#### Test Case 1: TranscriptionModal via CallItems Split-Screen
1. **Navigate to**: Agent Detail page → Select any call → Click "Itens" button
2. **Action**: Click "Comparar com Transcrição" button to open split-screen
3. **Verify**: 
   - [ ] Audio download button appears in TranscriptionModal
   - [ ] Button shows "Baixar Áudio" with download icon
   - [ ] Button is not disabled when callId is available
   - [ ] Clicking button triggers audio download
   - [ ] Downloaded file has format: `audio-{callId}.mp3`

#### Test Case 2: Direct Transcription Page
1. **Navigate to**: Agent Detail page → Select any call → Click "Transcrição" button
2. **Verify**:
   - [ ] Audio download button appears in main transcription area
   - [ ] Button functionality works correctly
   - [ ] Download process completes successfully

#### Test Case 3: Error Handling
1. **Test with invalid callId**: Manually modify URL or test with non-existent call
2. **Verify**:
   - [ ] Appropriate error message displays
   - [ ] Button shows disabled state when no callId available
   - [ ] Error message: "ID da ligação não encontrado"

### **Agent Name Display Testing**

#### Test Case 4: CallItems Page Agent Display
1. **Navigate to**: Any CallItems page from agent detail
2. **Verify**:
   - [ ] Agent name appears in header section
   - [ ] Format: "Agente: {Agent Name}"
   - [ ] Name is properly formatted using formatAgentName function
   - [ ] Layout is responsive and professional

#### Test Case 5: Transcription Page Agent Display
1. **Navigate to**: Any Transcription page from agent detail
2. **Verify**:
   - [ ] Agent name appears in information grid
   - [ ] Shows under "Agente" label
   - [ ] Displays alongside Call ID and Evaluation ID
   - [ ] Consistent formatting across all instances

### **Integration Testing**

#### Test Case 6: Cross-Page Navigation
1. **Start from**: Dashboard → Agent Detail → Call Items → Transcription Modal
2. **Verify**:
   - [ ] Agent name consistently displayed across all pages
   - [ ] Audio download works in all contexts
   - [ ] Navigation preserves agentId state correctly

#### Test Case 7: API Integration
1. **Check Network Tab** during testing
2. **Verify**:
   - [ ] getAgentSummary API calls succeed
   - [ ] getAgentCalls API calls succeed  
   - [ ] downloadAudio API calls succeed
   - [ ] No unnecessary duplicate API calls
   - [ ] Smart query enabling works (queries only run when needed)

## 🛠 **Technical Verification**

### **Code Quality Checks**
- [ ] No TypeScript compilation errors
- [ ] No console errors in browser
- [ ] No React warnings in console
- [ ] Build completes successfully (`npm run build`)
- [ ] Development server runs without issues

### **Performance Checks**
- [ ] Page load times remain acceptable
- [ ] No memory leaks from audio downloads
- [ ] Queries are properly enabled/disabled
- [ ] No infinite re-renders

## 🎯 **Success Criteria**

✅ **Audio Download Button**: Works in both TranscriptionModal (split-screen) and direct Transcription page
✅ **Agent Name Display**: Visible and properly formatted on both CallItems and Transcription pages
✅ **Error Handling**: Graceful handling of missing data or API failures
✅ **Performance**: No degradation in application performance
✅ **User Experience**: Intuitive and professional interface

## 📝 **Notes**

- **Backend Requirement**: Ensure backend API at `http://10.100.20.242:8080` is running
- **Audio Endpoint**: Verify `/call/{call_id}/audio` endpoint is accessible
- **Agent Data**: Confirm agent summary data is available for test agents
- **Browser Compatibility**: Test in Chrome, Firefox, and Edge

## 🚨 **Known Limitations**

- Audio download requires valid callId from backend
- Agent name display requires agentId in navigation state
- Backend audio endpoint must return proper audio blob

---

**Testing Environment**: 
- Development Server: http://localhost:5180/
- Backend API: http://10.100.20.242:8080
- Date: June 5, 2025
