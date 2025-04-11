import { BiLogOut } from "react-icons/bi";
import useLogout from "../../hooks/useLogout";

const LogoutButton = () => {
    const { loading, logout } = useLogout();

    return (
        <div className="mt-auto">
            {!loading ? (
                <BiLogOut
                    className="w-6 h-6 text-white-700 cursor-pointer hover:text-gray-900 transition duration-150 ease-in-out"
                    onClick={logout}
                />
            ) : (
                <span className="loading loading-spinner text-white-700"></span>
            )}
        </div>
    );
};

export default LogoutButton;