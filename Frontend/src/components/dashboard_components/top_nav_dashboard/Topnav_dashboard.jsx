import React, { useCallback } from 'react';
import topnav_dashboardcss from '../top_nav_dashboard/topnav_dashboard.module.css';
import friends_icon from '../../../images/friends.svg';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useDispatch } from 'react-redux';
import {
  change_option,
  change_option_name,
  option_status,
  option_text
} from '../../../Redux/options_slice';
import { clearSelectedUser } from '../../../Redux/dms_slice';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

function Topnav_dashboard({ button_status = {} }) {
  const { pending, all_friends } = button_status;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const change_option_value = (option_number, option_name, status, text) => {
    dispatch(change_option(option_number));
    dispatch(change_option_name(option_name));
    dispatch(option_status(status));
    dispatch(option_text(text));
    dispatch(clearSelectedUser());
  };

  // 1. Define a logout handler that talks to the server…
  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',   // ← send the httpOnly cookie
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // 2. …then clear client state and redirect
      localStorage.clear();
      navigate('/');
    }
  }, [navigate]);

  const renderButton = (message, Icon) => (
    <div
      className={topnav_dashboardcss.right_part_icons}
      onClick={() => {
        if (message === 'Logout') {
          handleLogout();
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') handleLogout();
      }}
    >
      <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip">{message}</Tooltip>}>
        <Icon />
      </OverlayTrigger>
    </div>
  );

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
        {[ 
          { num:1, name:'Online', status:false, text:"No one's around to play with Duckie." },
          { num:2, name:'All friends', status:all_friends, text:'Duckie is playing with friends. You should too!' },
          { num:3, name:'Pending', status:pending, text:"There are no pending friend requests. Here's Duckie for now." },
          { num:4, name:'Blocked', status:false, text:"You can't unblock the Duckie. You should watch him eat instead." },
          { num:5, name:'Add friends', status:false, text:'Duckie is playing with friends. You should too!' }
        ].map(({num,name,status,text}, idx) => (
          <div
            key={idx}
            className={topnav_dashboardcss.middle_part_comps}
            id={topnav_dashboardcss[`middle_part_item_${num}`]}
            onClick={() => change_option_value(num, name, status, text)}
          >            
            {num === 1 ? 'Online' : name}
          </div>
        ))}
      </div>

      <div className={topnav_dashboardcss.top_nav_comps} id={topnav_dashboardcss.right_part}>
        {renderButton('Logout', LogoutIcon)}
      </div>
    </>
  );
}

export default Topnav_dashboard;