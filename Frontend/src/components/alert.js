import React from 'react';
import '../styles/Alert.css';

const Alert = ({ alert }) => {
  if (!alert.msg) return null;

  return (
    <div className={`alert alert-${alert.type}`}>
      {alert.msg}
    </div>
  );
};

export default Alert;
