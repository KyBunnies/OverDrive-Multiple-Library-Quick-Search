// show options on installation
chrome.runtime.onInstalled.addListener(
  function(details) {
    if (details.reason == "install") {
      chrome.runtime.openOptionsPage();
    }
  }
);

//listener to pass messages from options to findSavedLibraries and back
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type == '_findSavedLibraries') {
    var findLibrariesURL = "https://www.overdrive.com/media/789876";
    //create iframe
    document.body.insertAdjacentHTML('beforeend', '<iframe id="iframe1"></iframe>');
    //load url in an iframe, using bg.js webrequest listener to block x-frame-options header
    $("#iframe1").off("load").on("load", passWhenLoaded);
    $('#iframe1').attr('src', findLibrariesURL);
    console.log('iframe loading');
  }
  //message from content script to open options page
  if (message.type == '_openOptionsPage') {
    chrome.runtime.openOptionsPage();
  }
});

function passWhenLoaded() {
  console.log('iframe load complete ' +  $('#iframe1').attr('src'));
  //wait a second before requesting libraries; allows updates;
  console.log("iframePort2", iframePort);
  setTimeout(function(){
    iframePort.postMessage({type: '_cs_findSavedLibraries'});
    console.log('sent _cs_findSavedLibraries');
  },1000);
}

var iframePort;
chrome.runtime.onConnect.addListener(port => {
    // save in a global variable to access it later from other functions
    iframePort = port;
    //this just passes info to outer console.log for easier debugging
    port.onMessage.addListener(msg => {
        if (msg.console) console.log(msg.console);
    });
});

// This is to remove X-Frame-Options header, if present
chrome.webRequest.onHeadersReceived.addListener(
  function(info) {
    var headers = info.responseHeaders;
    var index = headers.findIndex(x=>x.name.toLowerCase() == "x-frame-options");
    var oldheaders = headers;
    //console.log("insideOHR", oldheaders, index);
    if (index !=-1) {
      headers.splice(index, 1);
	    //console.log("x-frame-options removed")
    }
    return {responseHeaders: headers};
  },
  {
    urls: ['*://*.overdrive.com/*'], //
    types: ['sub_frame']
  },
  ['blocking', 'responseHeaders']
);
