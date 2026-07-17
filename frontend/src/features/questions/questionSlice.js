import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// ════════════════════════════════════════════════════
//  ASYNC THUNKS
// ════════════════════════════════════════════════════

// ── Submit a new question (public) ────────────────────
export const submitQuestion = createAsyncThunk(
  'questions/submit',
  async (questionData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/questions/submit', questionData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to submit question.'
      );
    }
  }
);

// ── Fetch public Fatwa feed ────────────────────────────
export const fetchPublicFeed = createAsyncThunk(
  'questions/fetchPublicFeed',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/questions/public', { params });
      return res.data; // { success, pagination, count, data }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch public feed.'
      );
    }
  }
);

// ── Fetch single public Fatwa by ID ───────────────────
export const fetchPublicFatwaById = createAsyncThunk(
  'questions/fetchPublicFatwaById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/questions/public/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Fatwa not found.'
      );
    }
  }
);

// ── Admin: Fetch all questions ─────────────────────────
export const fetchAllQuestionsAdmin = createAsyncThunk(
  'questions/fetchAllAdmin',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/questions/admin/all', { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch questions.'
      );
    }
  }
);

// ── Admin: Assign question to Mufti ───────────────────
export const assignQuestion = createAsyncThunk(
  'questions/assign',
  async ({ questionId, muftiIds }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
  `/questions/${questionId}/assign`,
  {
    muftiIds,
  }
);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to assign question.'
      );
    }
  }
);

// ── Admin: Request revision ────────────────────────────
export const requestRevision = createAsyncThunk(
  'questions/requestRevision',
  async ({ questionId, revisionNote }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/questions/${questionId}/revision`,
        { revisionNote }
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to request revision.'
      );
    }
  }
);

// ── Admin: Approve question ────────────────────────────
export const approveQuestion = createAsyncThunk(
  'questions/approve',
  async ({ questionId, notes }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/questions/${questionId}/approve`,
        { notes }
      );
      return res.data; // includes stampCode, fatwaNumber, fatwaDate, data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to approve question.'
      );
    }
  }
);

// ── Admin: Reject question ─────────────────────────────
export const rejectQuestion = createAsyncThunk(
  'questions/reject',
  async ({ questionId, rejectionReason }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/questions/${questionId}/reject`,
        { rejectionReason }
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to reject question.'
      );
    }
  }
);

// ── Mufti: Fetch assigned questions ───────────────────
export const fetchMuftiAssigned = createAsyncThunk(
  'questions/fetchMuftiAssigned',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/questions/mufti/assigned', { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch assigned questions.'
      );
    }
  }
);

// ── Mufti: Submit answer ───────────────────────────────
export const submitAnswer = createAsyncThunk(
  'questions/submitAnswer',
  async ({ questionId, answerText, references }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/questions/${questionId}/answer`,
        { answerText, references }
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to submit answer.'
      );
    }
  }
);

// ════════════════════════════════════════════════════
//  INITIAL STATE
// ════════════════════════════════════════════════════
const initialState = {
  // Public feed
  publicFeed:      [],
  feedPagination:  null,

  // Single Fatwa view
  selectedFatwa:   null,

  // Admin dashboard
  adminQuestions:  [],
  adminPagination: null,
  statusCounts:    {},

  // Mufti dashboard
  muftiQuestions:  [],
  muftiPagination: null,

  // Submission result
  submitResult:    null,

  // Approval result
  approvalResult:  null,

  // UI state
  loading:         false,
  actionLoading:   false, // For approve/reject/assign actions
  error:           null,
  actionError:     null,
  successMessage:  null,
};

// ════════════════════════════════════════════════════
//  SLICE
// ════════════════════════════════════════════════════
const questionSlice = createSlice({
  name: 'questions',
  initialState,

  reducers: {
    clearQuestionError:   (state) => { state.error = null; state.actionError = null; },
    clearSuccessMessage:  (state) => { state.successMessage = null; },
    clearSubmitResult:    (state) => { state.submitResult = null; },
    clearApprovalResult:  (state) => { state.approvalResult = null; },
    clearSelectedFatwa:   (state) => { state.selectedFatwa = null; },
  },

  extraReducers: (builder) => {

    // ── submitQuestion ─────────────────────────────────
    builder
      .addCase(submitQuestion.pending, (state) => {
        state.loading      = true;
        state.error        = null;
        state.submitResult = null;
      })
      .addCase(submitQuestion.fulfilled, (state, action) => {
        state.loading      = false;
        state.submitResult = action.payload.data;
        state.successMessage = action.payload.message;
      })
      .addCase(submitQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── fetchPublicFeed ────────────────────────────────
    builder
      .addCase(fetchPublicFeed.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchPublicFeed.fulfilled, (state, action) => {
        state.loading        = false;
        state.publicFeed     = action.payload.data;
        state.feedPagination = action.payload.pagination;
      })
      .addCase(fetchPublicFeed.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── fetchPublicFatwaById ───────────────────────────
    builder
      .addCase(fetchPublicFatwaById.pending, (state) => {
        state.loading       = true;
        state.selectedFatwa = null;
        state.error         = null;
      })
      .addCase(fetchPublicFatwaById.fulfilled, (state, action) => {
        state.loading       = false;
        state.selectedFatwa = action.payload;
      })
      .addCase(fetchPublicFatwaById.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── fetchAllQuestionsAdmin ─────────────────────────
    builder
      .addCase(fetchAllQuestionsAdmin.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchAllQuestionsAdmin.fulfilled, (state, action) => {
        state.loading          = false;
        state.adminQuestions   = action.payload.data;
        state.adminPagination  = action.payload.pagination;
        state.statusCounts     = action.payload.statusCounts || {};
      })
      .addCase(fetchAllQuestionsAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── assignQuestion ─────────────────────────────────
    builder
      .addCase(assignQuestion.pending, (state) => {
        state.actionLoading = true;
        state.actionError   = null;
      })
      .addCase(assignQuestion.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = 'Question assigned successfully.';
        // Update in admin list
        state.adminQuestions = state.adminQuestions.map((q) =>
          q._id === action.payload._id ? action.payload : q
        );
      })
      .addCase(assignQuestion.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError   = action.payload;
      });

    // ── requestRevision ────────────────────────────────
    builder
      .addCase(requestRevision.pending, (state) => {
        state.actionLoading = true;
        state.actionError   = null;
      })
      .addCase(requestRevision.fulfilled, (state, action) => {
        state.actionLoading  = false;
        state.successMessage = 'Revision requested successfully.';
        state.adminQuestions = state.adminQuestions.map((q) =>
          q._id === action.payload._id ? action.payload : q
        );
      })
      .addCase(requestRevision.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError   = action.payload;
      });

    // ── approveQuestion ────────────────────────────────
    builder
      .addCase(approveQuestion.pending, (state) => {
        state.actionLoading  = true;
        state.actionError    = null;
        state.approvalResult = null;
      })
      .addCase(approveQuestion.fulfilled, (state, action) => {
        state.actionLoading  = false;
        state.approvalResult = {
          stampCode:   action.payload.stampCode,
          fatwaNumber: action.payload.fatwaNumber,
          fatwaDate:   action.payload.fatwaDate,
        };
        state.successMessage = 'Question approved and published!';
        state.adminQuestions = state.adminQuestions.map((q) =>
          q._id === action.payload.data._id ? action.payload.data : q
        );
      })
      .addCase(approveQuestion.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError   = action.payload;
      });

    // ── rejectQuestion ─────────────────────────────────
    builder
      .addCase(rejectQuestion.pending, (state) => {
        state.actionLoading = true;
        state.actionError   = null;
      })
      .addCase(rejectQuestion.fulfilled, (state, action) => {
        state.actionLoading  = false;
        state.successMessage = 'Question rejected.';
        state.adminQuestions = state.adminQuestions.map((q) =>
          q._id === action.payload._id ? action.payload : q
        );
      })
      .addCase(rejectQuestion.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError   = action.payload;
      });

    // ── fetchMuftiAssigned ─────────────────────────────
    builder
      .addCase(fetchMuftiAssigned.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchMuftiAssigned.fulfilled, (state, action) => {
        state.loading          = false;
        state.muftiQuestions   = action.payload.data;
        state.muftiPagination  = action.payload.pagination;
      })
      .addCase(fetchMuftiAssigned.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── submitAnswer ───────────────────────────────────
    builder
      .addCase(submitAnswer.pending, (state) => {
        state.actionLoading = true;
        state.actionError   = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.actionLoading  = false;
        state.successMessage = 'Answer submitted successfully!';
        state.muftiQuestions = state.muftiQuestions.map((q) =>
          q._id === action.payload._id ? action.payload : q
        );
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError   = action.payload;
      });
  },
});

export const {
  clearQuestionError,
  clearSuccessMessage,
  clearSubmitResult,
  clearApprovalResult,
  clearSelectedFatwa,
} = questionSlice.actions;

// ── Selectors ──────────────────────────────────────────
export const selectPublicFeed      = (state) => state.questions.publicFeed;
export const selectFeedPagination  = (state) => state.questions.feedPagination;
export const selectSelectedFatwa   = (state) => state.questions.selectedFatwa;
export const selectAdminQuestions  = (state) => state.questions.adminQuestions;
export const selectAdminPagination = (state) => state.questions.adminPagination;
export const selectStatusCounts    = (state) => state.questions.statusCounts;
export const selectMuftiQuestions  = (state) => state.questions.muftiQuestions;
export const selectMuftiPagination = (state) => state.questions.muftiPagination;
export const selectSubmitResult    = (state) => state.questions.submitResult;
export const selectApprovalResult  = (state) => state.questions.approvalResult;
export const selectQLoading        = (state) => state.questions.loading;
export const selectActionLoading   = (state) => state.questions.actionLoading;
export const selectQError          = (state) => state.questions.error;
export const selectActionError     = (state) => state.questions.actionError;
export const selectSuccessMessage  = (state) => state.questions.successMessage;

export default questionSlice.reducer;
