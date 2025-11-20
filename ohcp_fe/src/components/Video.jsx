import * as React from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';
import Loading from './Loading';

function randomID(len) {
  let result = '';
  if (result) return result;
  var chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP',
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

function getUrlParams(
  url = window.location.href
) {
  let urlStr = url.split('?')[1];
  return new URLSearchParams(urlStr);
}

export default function Video() {
  const roomID = getUrlParams().get('roomID') || randomID(5);
  let myMeeting = async (element) => {
    // generate Kit Token
    const appID = 157614012;
    const serverSecret = "fe61db55625bbac30bedf6098447c357";
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID, randomID(5), randomID(5));


    // Create instance object from Kit Token.
    const zp = ZegoUIKitPrebuilt.create(kitToken);
    // start the call
    zp.joinRoom({
      container: element,
      sharedLinks: [
        {
          name: 'Personal link',
          url:
            window.location.protocol + '//' +
            window.location.host + window.location.pathname +
            '?roomID=' +
            roomID,
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall, // To implement 1-on-1 calls, modify the parameter here to [ZegoUIKitPrebuilt.OneONoneCall].
      },
    });


  };
    const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Giả lập thời gian load trang (có thể thay bằng logic load data thực tế)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5 giây

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className='container'>
          <Navbar />
        </div>
      <div
        className="myCallContainer"
        ref={myMeeting}
        style={{ width: '100vw', height: '100vh' }}
      ></div>
    </div>
  );
}