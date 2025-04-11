import PropTypes from 'prop-types';
import Conversations from "./Conversations";
import SearchInput from "./SearchInput";

const Sidebar = ({ onSelectConversation }) => {
    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            </div>
            
            {/* Search */}
            <div className="p-3 border-b border-gray-200">
                <SearchInput />
            </div>
            
            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
                <Conversations onSelectConversation={onSelectConversation} />
            </div>
        </div>
    );
};

Sidebar.propTypes = {
    onSelectConversation: PropTypes.func.isRequired,
};

export default Sidebar;