import React from 'react';
import topnav_dashboardcss from '../top_nav_dashboard/topnav_dashboard.module.css';
import friends_icon from '../../../images/friends.svg';
import InboxIcon from '@mui/icons-material/Inbox';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useDispatch } from 'react-redux';
import { change_option, change_option_name, option_status, option_text } from '../../../Redux/options_slice';
import { clearSelectedUser } from '../../../Redux/dms_slice'; // Adjust path if needed
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

function Topnav_dashboard({ button_status = {} }) {
  const { pending, all_friends } = button_status;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function change_option_value(option_number, option_name, status, text) {
    dispatch(change_option(option_number));
    dispatch(change_option_name(option_name));
    dispatch(option_status(status));
    dispatch(option_text(text));
    dispatch(clearSelectedUser()); // Clear selected DM when switching top nav option
  }

  function buttons(message, Icon) {
    return (
      <div
        className={topnav_dashboardcss.right_part_icons}
        onClick={() => {
          if (message === 'Logout') {
            localStorage.clear();
            navigate('/');
          }
        }}
      >
        <OverlayTrigger placement="bottom" overlay={tooltips(message)}>
          <Icon />
        </OverlayTrigger>
      </div>
    );
  }

  const tooltips = (value, props) => (
    <Tooltip id="button-tooltip" {...props}>
      {value}
    </Tooltip>
  );

  return (
    <>
      <div className={topnav_dashboardcss.top_nav_comps} id={topnav_dashboardcss.left_part_wrap}>
        <div id={topnav_dashboardcss.left_part}>
          <img className={topnav_dashboardcss.top_nav_images} src={friends_icon} alt="" />
          Friends
        </div>
      </div>
      <div className={topnav_dashboardcss.right_nav_comps} id={topnav_dashboardcss.middle_part}>
        <div
          className={topnav_dashboardcss.middle_part_comps}
          id={topnav_dashboardcss.middle_part_item_1}
          onClick={() => {
            change_option_value(1, 'ONLINE', false, "No one's around to play with Duckie.");
          }}
        >
          Online
        </div>
        <div
          className={topnav_dashboardcss.middle_part_comps}
          id={topnav_dashboardcss.middle_part_item_2}
          onClick={() => {
            change_option_value(2, 'ALL FRIENDS', all_friends, 'Duckie is playing with friends. You should too!');
          }}
        >
          All
        </div>
        <div
          className={topnav_dashboardcss.middle_part_comps}
          id={topnav_dashboardcss.middle_part_item_3}
          onClick={() => {
            change_option_value(3, 'PENDING', pending, "There are no pending friend requests. Here's Duckie for now.");
          }}
        >
          Pending
        </div>
        <div
          className={topnav_dashboardcss.middle_part_comps}
          id={topnav_dashboardcss.middle_part_item_4}
          onClick={() => {
            change_option_value(4, 'BLOCKED', false, "You can't unblock the Duckie. You should watch him eat instead.");
          }}
        >
          Blocked
        </div>
        <div
          className={topnav_dashboardcss.middle_part_comps}
          id={topnav_dashboardcss.middle_part_item_5}
          onClick={() => {
            change_option_value(5, 'ADD FRIENDS', false, 'Duckie is playing with friends. You should too!');
          }}
        >
          Add Friend
        </div>
      </div>
      <div className={topnav_dashboardcss.top_nav_comps} id={topnav_dashboardcss.right_part}>
        {buttons('New Group DM', ChatBubbleIcon)}
        {buttons('Inbox', InboxIcon)}
        {buttons('Logout', LogoutIcon)}
      </div>
    </>
  );
}

export default Topnav_dashboard;