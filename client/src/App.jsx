import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './redux/store.js';
import { loadCurrentUser } from './redux/authSlice.js';
import AppRoutes from './routes/AppRoutes.jsx';

const AppContent = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Attempt to silently restore session if token exists
    if (localStorage.getItem('accessToken')) {
      dispatch(loadCurrentUser());
    }
  }, [dispatch]);

  if (loading && localStorage.getItem('accessToken')) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return <AppRoutes />;
};

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
