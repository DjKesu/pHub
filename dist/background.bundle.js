// background.js
chrome.action.onClicked.addListener((tab) => {
    // Ensure that the tab.url is present before trying to extract the hostname
    if (tab.url) {
      try {
        let url = new URL(tab.url);
        let domain = url.hostname;
        // Now you have the domain, you can send it to the content script or popup
        // For example, you can send a message to the popup script
        chrome.runtime.sendMessage({ type: "SET_DOMAIN", domain: domain });
      } catch (error) {
        console.error("Error parsing the tab URL:", error);
      }
    } else {
      console.error("No URL found for the active tab.");
    }
  });
  
  // Listen for messages from the popup if necessary
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_DOMAIN") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          let url = new URL(tabs[0].url);
          let domain = url.hostname;
          sendResponse({ domain: domain });
        }
      });
      return true; // Keep the message channel open for sendResponse
    }
  });
  