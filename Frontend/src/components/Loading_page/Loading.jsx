import React from 'react';
import loadingcss from '../Loading_page/Loading.module.css';

function Loading() {
  return (
    <div className={loadingcss.main}>
      <div className={loadingcss.loader_wrapper}>
        <div className={loadingcss.bar_container}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`${loadingcss.bar} ${loadingcss[`bar${i + 1}`]}`} />
          ))}
        </div>
        <p className={loadingcss.loading_text}>Loading...</p>
      </div>
    </div>
  );
}

export default Loading;