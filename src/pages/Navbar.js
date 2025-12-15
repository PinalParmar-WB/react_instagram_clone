import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authThunks";

export default function Navbar() {
  const dispatch = useDispatch();

  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/profile">Profile</Link>
      <button onClick={() => dispatch(logout())}>Logout</button>
    </nav>
  );
}
