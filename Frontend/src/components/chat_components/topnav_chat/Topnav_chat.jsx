import React from 'react';
import topnav_chatcss from '../topnav_chat/topnav_chat.module.css';
import TagIcon from '@mui/icons-material/Tag';
import PushPinIcon from '@mui/icons-material/PushPin';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function Topnav_chat() {
  const channel_name = useSelector(state => state.current_page.page_name);
  const navigate = useNavigate();

  // Tooltip content generator
  const renderTooltip = (value) => (
    <Tooltip id={`tooltip-${value}`}>
      {value}
    </Tooltip>
  );

  // Button renderer
  function buttons(message, Icon) {
    return (
      <div
        className={topnav_chatcss.right_comps}
        onClick={() => {
          if (message === 'Logout') {
            localStorage.clear();
            navigate('/login');
          }
        }}
      >
        <OverlayTrigger placement="bottom" overlay={renderTooltip(message)}>
          <div><Icon /></div>
        </OverlayTrigger>
      </div>
    );
  }

  return (
    <div className={topnav_chatcss.main_wrap}>
      <div id={topnav_chatcss.left}>
        <TagIcon />
        <div id={topnav_chatcss.channel_name}>
          {channel_name}
        </div>
      </div>

      <div id={topnav_chatcss.right}>
        {buttons('Pinned Messages', PushPinIcon)}
        <input placeholder="Search" type="text" />
        {buttons('Logout', LogoutIcon)}
      </div>
    </div>
  );
}

export default Topnav_chat;