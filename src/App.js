import { Routes, Route, Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import { useSelector } from 'react-redux';
import Feed from './pages/Feed';
import ProfileEdit from './pages/ProfileEdit';
import CreatePost from './pages/CreatePost';
import PostDetails from './pages/PostDetails';

export default function App() {
  const { user } = useSelector((store) => store.auth);

  // Wrapper 1: Protects private routes (Home, Profile)
  // Logic: If NO user, go to Login. Otherwise, show the child component.
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Wrapper 2: Protects public routes (Login, Register)
  // Logic: If user EXISTS, go to Home. Otherwise, show the login/register page.
  const PublicRoute = ({ children }) => {
    if (user) {
      return <Navigate to="/home" replace />;
    }
    return children;
  };

  return (
    <div className="App">
      {/* <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes> */}

      <Routes>
        {/* PUBLIC ROUTES (Accessible only if NOT logged in) */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* PRIVATE ROUTES (Accessible only if LOGGED IN) */}
        <Route
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        >
            <Route path="/home" element={<Feed />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile-edit" element={<ProfileEdit />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/post/:id" element={<PostDetails />} />
        </Route>
      </Routes>
    </div>
  );
}
