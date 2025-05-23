// src/components/navbar_2/Navbar_2.jsx
import React, { useState } from 'react';
import { useSelector }    from 'react-redux';
import { useParams }      from 'react-router-dom';
import OverlayTrigger     from 'react-bootstrap/OverlayTrigger';
import Tooltip            from 'react-bootstrap/Tooltip';
import nav2css            from './navbar2.module.css';
import SettingsIcon       from '@mui/icons-material/Settings';
import HeadsetIcon        from '@mui/icons-material/Headset';
import MicOffIcon         from '@mui/icons-material/MicOff';
import Navbar2_dashboard  from '../dashboard_components/navbar2_dashboard/Navbar2_dashboard';
import Navbar2_chat       from '../chat_components/navbar_2_chat/Navbar2_chat';
import SettingsModal      from '../settings/SettingsModal';

export default function Navbar_2({ showAlert }) {
  const { server_id } = useParams();
  const username     = useSelector(s => s.user_info.username);
  const tag          = useSelector(s => s.user_info.tag);
  const profile_pic  = useSelector(s => s.user_info.profile_pic);

  // State to open/close Settings modal
  const [showSettings, setShowSettings] = useState(false);

  // wrapper for each icon+tooltip
  function button(iconName, IconComponent, onClick) {
    return (
      <div className={nav2css.icons} onClick={onClick}>
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-${iconName}`}>{iconName}</Tooltip>}
        >
          <IconComponent fontSize="small" style={{ cursor: 'pointer' }}/>
        </OverlayTrigger>
      </div>
    );
  }

  return (
    <>
      <div className={nav2css.main}>
        <div>
          {server_id === '@me' || !server_id
            ? <Navbar2_dashboard />
            : <Navbar2_chat />
          }
        </div>

        <div id={nav2css.footer}>
          <div id={nav2css.profile} className={nav2css.footer_comps}>
            <img src={profile_pic} alt="Your avatar" />
          </div>
          <div id={nav2css.profile_name_wrap} className={nav2css.footer_comps}>
            <div id={nav2css.profile_name} className={nav2css.profile_name_comps}>
              {username}
            </div>
            <div id={nav2css.tag} className={nav2css.profile_name_comps}>
              #{tag}
            </div>
          </div>
          <div id={nav2css.profile_options} className={nav2css.footer_comps}>
            {button('Unmute',   MicOffIcon,   () => {/* your unmute logic */})}
            {button('Deafen',   HeadsetIcon,  () => {/* your deafen logic */})}
            {button('User Settings', SettingsIcon, () => setShowSettings(true))}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        showAlert={showAlert}
      />
    </>
  );
}