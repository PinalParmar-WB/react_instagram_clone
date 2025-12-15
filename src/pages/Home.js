import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

const Home = () => {
  const user = useSelector(state => state.auth.user);

  return (
    <div>
      <h1>Welcome, {user?.username}</h1>
      <p>Email: {user?.email}</p>

      <button>
        Logout
      </button>
    </div>
  );
}

export default Home;    