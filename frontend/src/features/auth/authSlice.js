import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// ════════════════════════════════════════════════════
//  ASYNC THUNKS
// ════════════════════════════════════════════════════

// ── Login ─────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      return res.data; // { success, token, user: { _id, name, email, role, ... } }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    }
  }
);

// ── Logout ────────────────────────────────────────────
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Logout failed.'
      );
    }
  }
);

// ── Fetch current user (on app load / token refresh) ──
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/auth/me');
      return res.data; // { success, user: { ... } }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Session expired.'
      );
    }
  }
);

// ── Update Profile ────────────────────────────────────
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      // ✅ PATCH /auth/profile — matches authRoutes.js
      const res = await axiosInstance.patch('/auth/profile', updates);
      return res.data; // { success, message, user: { ... } }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Profile update failed.'
      );
    }
  }
);

// ── Register new user (super_admin only) ──────────────
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/users/register', userData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Registration failed.'
      );
    }
  }
);

// ════════════════════════════════════════════════════
//  INITIAL STATE
// ════════════════════════════════════════════════════
const initialState = {
  user:            null,   // Logged-in user object
  isAuthenticated: false,
  loading:         false,  // For login / logout / update actions
  bootstrapping:   true,   // True until fetchMe resolves on app load
  error:           null,
  registerSuccess: false,
};

// ════════════════════════════════════════════════════
//  SLICE
// ════════════════════════════════════════════════════
const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    // Clear API errors (e.g. on input change)
    clearAuthError: (state) => {
      state.error = null;
    },
    // Reset register success flag after use
    clearRegisterSuccess: (state) => {
      state.registerSuccess = false;
    },
  },

  extraReducers: (builder) => {

    // ── loginUser ──────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading         = false;
        state.isAuthenticated = true;
        state.user            = action.payload.user; // ✅ was .data — fixed
        state.error           = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── logoutUser ─────────────────────────────────────
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading         = false;
        state.isAuthenticated = false;
        state.user            = null;
        state.error           = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if API call fails — clear local state anyway
        state.loading         = false;
        state.isAuthenticated = false;
        state.user            = null;
        state.error           = null;
      });

    // ── fetchMe ────────────────────────────────────────
    builder
      .addCase(fetchMe.pending, (state) => {
        state.bootstrapping = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.bootstrapping   = false;
        state.isAuthenticated = true;
        state.user            = action.payload.user; // ✅ was .data — fixed
      })
      .addCase(fetchMe.rejected, (state) => {
        state.bootstrapping   = false;
        state.isAuthenticated = false;
        state.user            = null;
      });

    // ── updateUserProfile ──────────────────────────────
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user; // ✅ was .data — fixed
        state.error   = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── registerUser ───────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading         = true;   // ✅ was false — fixed
        state.registerSuccess = false;
        state.error           = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading         = false;
        state.registerSuccess = true;
        state.error           = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading         = false;
        state.registerSuccess = false;
        state.error           = action.payload;
      });
  },
});

export const { clearAuthError, clearRegisterSuccess } = authSlice.actions;

// ════════════════════════════════════════════════════
//  SELECTORS
// ════════════════════════════════════════════════════
export const selectUser            = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading     = (state) => state.auth.loading;
export const selectBootstrapping   = (state) => state.auth.bootstrapping;
export const selectAuthError       = (state) => state.auth.error;
export const selectUserRole        = (state) => state.auth.user?.role;
export const selectRegisterSuccess = (state) => state.auth.registerSuccess;

export default authSlice.reducer;
