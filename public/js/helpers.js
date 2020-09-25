function isAN (str){
  var code, i, len;
  for(i=0;i<str.length;i++){
     code = str.charCodeAt(i);
     if(!(code>47&&code<58)&&!(code>64&&code<91)&&!(code>96&&code<123)){
        return false;
     }
  }
  return true;
}
function isANS (str){
  var code, i, len;
  for(i=0;i<str.length;i++){
     code = str.charCodeAt(i);
     if(!(code>47&&code<58)&&!(code>64&&code<91)&&!(code>96&&code<123)&&!(code==32)){
        return false;
     }
  }
  return true;
}

let localStorageTimeout = 15 * 1000; // 15,000 milliseconds = 15 seconds.
let localStorageResetInterval = 10 * 1000; // 10,000 milliseconds = 10 seconds.
let localStorageTabKey = 'test-application-browser-tab';
let sessionStorageGuidKey = 'browser-tab-guid';

function createGUID() {
  let guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    /*eslint-disable*/
    let r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    /*eslint-enable*/
    return v.toString(16);
  });

  return guid;
}
function testTab() {
  let sessionGuid = sessionStorage.getItem(sessionStorageGuidKey) || createGUID();
  let tabObj = JSON.parse(localStorage.getItem(localStorageTabKey)) || null;

    sessionStorage.setItem(sessionStorageGuidKey, sessionGuid);

  // If no or stale tab object, our session is the winner.  If the guid matches, ours is still the winner
  if (tabObj === null || (tabObj.timestamp < new Date().getTime() - localStorageTimeout) || tabObj.guid === sessionGuid) {
    function setTabObj() {
      let newTabObj = {
        guid: sessionGuid,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(localStorageTabKey, JSON.stringify(newTabObj));
    }
    setTabObj();
    setInterval(setTabObj, localStorageResetInterval);
    return true;
  } else {
    // An active tab is already open that does not match our session guid.
    return false;
  }
}
if (!testTab()){
    window.location.replace("/MTerror");
 }
