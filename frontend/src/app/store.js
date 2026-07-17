import { configureStore } from '@reduxjs/toolkit';
import authReducer     from '../features/auth/authSlice';
import questionReducer from '../features/questions/questionSlice';

const store = configureStore({
  reducer: {
    auth:      authReducer,
    questions: questionReducer,
  },

  // Middleware is pre-configured by RTK (includes redux-thunk)
  devTools: import.meta.env.MODE !== 'production',
});

export default store;
