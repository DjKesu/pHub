const form = document.getElementById('control-row');
const input = document.getElementById('input');
const message = document.getElementById('message');
const cookieList = document.getElementById('cookie-list');
const prompt = "List down the cookies as a table with the link, cookie name, type, and basic summary"


// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      input.value = url.hostname;
      // Fetch cookies and display them
      displayCookies(url.hostname);
    } catch {
      // ignore
    }
  }

  input.focus();
})();

async function displayCookies(domain) {
  try {
    const cookies = await chrome.cookies.getAll({ domain });

    cookieList.textContent = ''; // Clear any existing cookie info
    cookies.forEach(cookie => {
      const cookieItem = document.createElement('div');
      cookieItem.textContent = `Name: ${cookie.name}, Value: ${cookie.value}`;
      cookieList.appendChild(cookieItem);
    });

    if (cookies.length === 0) {
      cookieList.textContent = 'No cookies found';
    }
  } catch (error) {
    cookieList.textContent = `Unexpected error: ${error.message}`; 
  }
}

form.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
  event.preventDefault();

  clearMessage();

  let url = stringToUrl(input.value);
  if (!url) {
    setMessage('Invalid URL');
    return;
  }

  let message = await deleteDomainCookies(url.hostname);
  setMessage(message);
}

async function explainCookies(cookies) {
  // Check if there are any cookies to explain
  if (cookies.length === 0) {
    console.log("No cookies to explain.");
    return;
  }

  // Create a description of the cookies
  let cookieDescriptions = cookies.map(cookie => {
    return `Name: ${cookie.name}, Domain: ${cookie.domain}, Path: ${cookie.path}, Secure: ${cookie.secure}, HTTP Only: ${cookie.httpOnly}`;
  }).join('; ');

  // Formulate a prompt for the GPT model
  let prompt = `I have a list of web cookies with their properties: ${cookieDescriptions}. Can you explain the purpose of these cookies and what the implications are for user privacy?`;

  // This is where you would call the GPT API with the prompt
  // Since I can't actually call the API, this is a placeholder for where you would do it.
  let gptResponse = await callGptApi(prompt);

  // Process the GPT response and do something with it, for example, log it or display it in the UI
  console.log(gptResponse);
}

async function callGptApi(prompt) {
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].text.trim();
}



function stringToUrl(input) {
  // Start with treating the provided value as a URL
  try {
    return new URL(input);
  } catch {
    // ignore
  }
  // If that fails, try assuming the provided input is an HTTP host
  try {
    return new URL('http://' + input);
  } catch {
    // ignore
  }
  // If that fails ¯\_(ツ)_/¯
  return null;
}

async function deleteDomainCookies(domain) {
  let cookiesDeleted = 0;
  try {
    const cookies = await chrome.cookies.getAll({ domain });

    if (cookies.length === 0) {
      return 'No cookies found';
    }

    let pending = cookies.map(deleteCookie);
    await Promise.all(pending);

    cookiesDeleted = pending.length;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Deleted ${cookiesDeleted} cookie(s).`;
}

function deleteCookie(cookie) {
  // Cookie deletion is largely modeled off of how deleting cookies works when using HTTP headers.
  // Specific flags on the cookie object like `secure` or `hostOnly` are not exposed for deletion
  // purposes. Instead, cookies are deleted by URL, name, and storeId. Unlike HTTP headers, though,
  // we don't have to delete cookies by setting Max-Age=0; we have a method for that ;)
  //
  // To remove cookies set with a Secure attribute, we must provide the correct protocol in the
  // details object's `url` property.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Secure
  const protocol = cookie.secure ? 'https:' : 'http:';

  // Note that the final URL may not be valid. The domain value for a standard cookie is prefixed
  // with a period (invalid) while cookies that are set to `cookie.hostOnly == true` do not have
  // this prefix (valid).
  // https://developer.chrome.com/docs/extensions/reference/cookies/#type-Cookie
  const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

  return chrome.cookies.remove({
    url: cookieUrl,
    name: cookie.name,
    storeId: cookie.storeId
  });
}

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = '';
}
