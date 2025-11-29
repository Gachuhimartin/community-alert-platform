import React from 'react';

const MessageToast = ({ username, message, timestamp }) => {
  // Format timestamp to a readable string, e.g. HH:mm:ss
  const formattedTime = new Date(timestamp).toLocaleTimeString();

  const toastStyle = {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 12px',
    backgroundColor: '#323232',
    color: 'white',
    borderRadius: '4px',
    fontSize: '14px',
    maxWidth: '300px',
    wordBreak: 'break-word',
  };

  const usernameStyle = {
    fontWeight: 'bold',
    marginBottom: '4px',
  };

  const timeStyle = {
    fontSize: '11px',
    color: '#aaa',
    alignSelf: 'flex-end',
    marginTop: '6px',
  };

  return (
    <div style={toastStyle}>
      <span style={usernameStyle}>{username}</span>
      <span>{message}</span>
      <span style={timeStyle}>{formattedTime}</span>
    </div>
  );
};

export default MessageToast;
