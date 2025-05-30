import React from 'react'
import navbarcss from '../navbar/navbar.module.css'
import vibesync_logo from '../../images/vibesync_logo.png'
import vibesync_logo_2 from '../../images/vibesync_logo_2.png'
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import server_img_1 from '../../images/new_server.svg' 
import server_img_2 from '../../images/server_image_2.svg' 
import server_img_3 from '../../images/server_image_3.svg' 
import server_img_4 from '../../images/server_image_4.svg' 
import server_img_5 from '../../images/server_image_5.svg' 
import server_img_6 from '../../images/server_image_6.svg' 
import server_img_7 from '../../images/server_image_7.svg' 
import server_input from '../../images/server_image_input.svg'
import { useState,useEffect } from 'react'
import { Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import {useDispatch } from 'react-redux'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import {server_role} from '../../Redux/current_page'


function Navbar({new_req_recieved ,user_cred}) {

  const dispatch = useDispatch()
  
  const{username , user_servers} = user_cred
  const [servers, setservers] = useState([{server_pic:'' , server_name:'' , server_id:''}])
const showAlert = (message, type) => {
  alert(`${type.toUpperCase()}: ${message}`);
};

  useEffect(()=>{
    setservers(user_servers)
  },[user_servers])

  const [show, setShow] = useState(false);
  const handleClose = () => {
    setShow(false)
    setcurrent_modal(1)
    setsubmit_button({create_button_state:false , back_button_state:false})
    setnew_server_image_preview(server_input)
  };
  const handleShow = () => setShow(true);
  const template = [{text:'Create My Own' , image:server_img_1}, {text:'Gaming' , image:server_img_2}, {text:'School Club' , image:server_img_3}, {text:'Study Group' , image:server_img_4}, {text:'Friends' , image:server_img_5} , {text:'Artists & Creators' , image:server_img_6}, {text:'Local Community' , image:server_img_7}]
  const [server_details, setserver_details] = useState({name:`${username}'s server` , type:'' , key:0 , role:'author'})
  const [current_modal, setcurrent_modal] = useState(1)
  const [submit_button, setsubmit_button] = useState({create_button_state:false , back_button_state:false})
  const [new_server_image_preview, setnew_server_image_preview] = useState(server_input)
  const [new_server_image, setnew_server_image] = useState('')

  const url = process.env.REACT_APP_URL

  function update_server_pic(e){
    let file = e.target.files[0]
    setnew_server_image_preview(URL.createObjectURL(file))
    setnew_server_image(file)
  }

  const create_server = async () => {
  if (!new_server_image) {
    showAlert("Please select an image", "danger");
    return;
  }

  const formData = new FormData();
  formData.append("server_image", new_server_image);
  // server_details must be a string in multipart
  formData.append("server_details", JSON.stringify(server_details));

  try {
    const res = await fetch(`${url}/create_server`, {
      method: "POST",
      headers: {
        "x-auth-token": localStorage.getItem("token"),
        // no Content-Type: boundary is set automatically
      },
      body: formData,
    });

    const data = await res.json();
    if (res.status === 201) {
      handleClose();
      new_req_recieved(1);
      showAlert("Server created!", "success");
    } else {
      showAlert(data.message || "Failed to create server", "danger");
    }
  } catch (err) {
    console.error("Create server error:", err);
    showAlert("Server error", "danger");
  } finally {
    setsubmit_button({ create_button_state: false, back_button_state: false });
  }
};

  function first_modal(){
    return(
      <>
        <div className={navbarcss.modal_header}>
          <h2 className={navbarcss.modal_title}>Create a server</h2>
          <button className={navbarcss.modal_close} onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className={navbarcss.modal_content}>
          <p className={navbarcss.modal_subtitle}>
            Your server is where you and your friends hang out. Make yours and start talking.
          </p>
          
          <div className={navbarcss.template_grid}>
            {template.map((elem, index) => (
              <div 
                key={index} 
                className={navbarcss.template_card}
                onClick={() => {
                  setserver_details({...server_details, type: elem.text, key: index + 1})
                  setcurrent_modal(2)
                }}
              >
                <div className={navbarcss.template_icon}>
                  <img src={elem.image} alt="" />
                </div>
                <span className={navbarcss.template_text}>{elem.text}</span>
                <ChevronRightIcon className={navbarcss.template_arrow} />
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  function second_modal(){
    return(
      <>
        <div className={navbarcss.modal_header}>
          <h2 className={navbarcss.modal_title}>Tell us more about your server</h2>
          <button className={navbarcss.modal_close} onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className={navbarcss.modal_content}>
          <p className={navbarcss.modal_subtitle}>
            In order to help you with your setup, is your new server for just a few friends or a larger community?
          </p>
          
          <div className={navbarcss.template_grid}>
            {template.slice(template.length-2, template.length).map((elem, index) => (
              <div 
                key={index} 
                className={navbarcss.template_card}
                onClick={() => setcurrent_modal(3)}
              >
                <div className={navbarcss.template_icon}>
                  <img src={elem.image} alt="" />
                </div>
                <span className={navbarcss.template_text}>{elem.text}</span>
                <ChevronRightIcon className={navbarcss.template_arrow} />
              </div>
            ))}
          </div>
          
          <div className={navbarcss.skip_section}>
            <p>
              Not sure? You can 
              <button className={navbarcss.skip_link} onClick={() => setcurrent_modal(3)}>
                skip this question
              </button> 
              for now
            </p>
          </div>
          
          <div className={navbarcss.modal_footer}>
            <button className={navbarcss.back_btn} onClick={() => setcurrent_modal(1)}>
              Back
            </button>
          </div>
        </div>
      </>
    )
  }

  function third_modal(){
    return(
      <>
        <div className={navbarcss.modal_header}>
          <h2 className={navbarcss.modal_title}>Customize your server</h2>
          <button className={navbarcss.modal_close} onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className={navbarcss.modal_content}>
          <p className={navbarcss.modal_subtitle}>
            Give your new server a personality with a name and an icon. You can always change it later.
          </p>
          
          <div className={navbarcss.image_upload_section}>
            <label className={navbarcss.image_upload} htmlFor="update_cover_pic">
              <img src={new_server_image_preview} alt="Server icon" />
              <div className={navbarcss.upload_overlay}>
                <span>Change Icon</span>
              </div>
            </label>
            <input 
              onChange={update_server_pic} 
              type="file" 
              id="update_cover_pic" 
              name="image" 
              accept="image/*"
              hidden
            />
          </div>

          <div className={navbarcss.input_section}>
            <label className={navbarcss.input_label}>SERVER NAME</label>
            <input 
              onChange={(e) => setserver_details({...server_details, name: e.target.value})} 
              value={server_details.name} 
              className={navbarcss.server_name_input} 
              type="text" 
              placeholder="Enter server name"
            />
          </div>

          <div className={navbarcss.modal_footer}>
            <button 
              className={navbarcss.back_btn} 
              disabled={submit_button.back_button_state}  
              onClick={() => setcurrent_modal(2)}
            > 
              Back
            </button>
            <button
              className={`${navbarcss.create_btn} ${submit_button.create_button_state ? navbarcss.loading : ''}`}
              onClick={() => {
                create_server(); 
                setsubmit_button({create_button_state: true, back_button_state: true})
              }}
              disabled={submit_button.create_button_state}
            >
              {submit_button.create_button_state ? (
                <>
                  <CircularProgress size="1rem" color="inherit" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className={navbarcss.main}>
      <div className={navbarcss.main_wrap}>
        <div>
          {/* for going to the dashboard */}
          <Link to={'/channels/@me'} className={`${navbarcss.list_items} ${navbarcss.dms}`} >
              <div className={`${navbarcss.left}`}>
                {/* this `selected` class is to specify which list item is selected using a css style which is written in it and the clas "left" is a wrap for this class */}
                <div className={navbarcss.selected}></div>
              </div>
              <div className={`${navbarcss.middle}`} id={navbarcss.direct_message}>
                <img src={vibesync_logo} alt="" />
              </div>
              <div className={`${navbarcss.right}`}></div>
          </Link>
        </div>
       
        {/* servers from here */}
        <div className={navbarcss.servers_wrap}>
        {
          servers.length>0?
          servers.map((elem,key)=>{
            return(
              <OverlayTrigger
                  key={key}
                  placement="right"
                  overlay={<Tooltip id={navbarcss.button_tooltip_2}>{elem.server_name}</Tooltip>}>
                     <Link to={`/channels/${elem.server_id}`} onClick={()=>{dispatch(server_role(elem.server_role))}} className={`${navbarcss.list_items} ${navbarcss.servers}`}>
                <div className={`${navbarcss.left}`}>
                  <div className={navbarcss.selected}></div>
                </div>
                  <div className={`${navbarcss.middle}  ${navbarcss.server_middle}`}>
                    {
                      elem.server_pic==''?
                      <>{elem.server_name[0]}</>
                      :
                      <img src={elem.server_pic} alt="" />
                    }
                  </div>
                <div className={`${navbarcss.right}`}></div>
                </Link>

                </OverlayTrigger>        

            )
          }):
          <></>
        }
              </div>
        
        {/* Add new server */}
        <div className={`${navbarcss.list_items}`}>
            <div className={`${navbarcss.left}`}></div>
            <div className={`${navbarcss.middle}  ${navbarcss.server_middle}`}  onClick={handleShow} id={navbarcss.plus}>
              <AddIcon fontSize='large'/>
            </div>
            <div className={`${navbarcss.right}`}></div>
        </div> 
        
        {/* Custom Modal */}
        {show && (
          <div className={navbarcss.modal_overlay} onClick={handleClose}>
            <div className={navbarcss.modal_container} onClick={(e) => e.stopPropagation()}>
              {current_modal === 1 && first_modal()}
              {current_modal === 2 && second_modal()}
              {current_modal === 3 && third_modal()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar