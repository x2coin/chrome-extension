// const apiUrl = 'https://x2co.in/api';
const apiUrl = 'http://localhost:8080';
const pumpfunPostUrl = 'https://pump.fun/create?x=';

const urlParams = new URLSearchParams(window.location.search);
const xParam = urlParams.get('x');

function addX2CoinButtons() {
    if (window.location.hostname === 'x.com') {
        document.querySelectorAll('article').forEach(post => {
            if (post.querySelector('.x2coin-btn')) return;
            const button = document.createElement('button');
            button.textContent = 'Create coin';
            button.className = 'x2coin-btn';
            button.style.cssText = `
            background-color: #1DA1F2;
            color: white;
            margin: 6px;
            padding: 7px 20px;
            border: none;
            border-radius: 20px;
            font-size: 14px;
            font-family: sans-serif;
            font-weight: bold;
            cursor: pointer;
            margin-left: 8px;
            transition: background-color 0.3s ease;
        `;
            button.onmouseover = () => button.style.backgroundColor = '#0a84c1';
            button.onmouseleave = () => button.style.backgroundColor = '#1DA1F2';

            const actionBar = post.querySelector('[role="group"]');
            if (actionBar) {
                actionBar.appendChild(button);
            }

            button.addEventListener('click', () => {
                let link = post.querySelector('a[href*=\'status\']').href;
                console.log(post.innerText);
                window.open(pumpfunPostUrl + link, '_blank');
            });
        });
    }
}


function prepareTwitterLink() {
    findAllByTextAndCssSelector('show more options ↓', '.cursor-pointer')[0].click();
    let interval = setInterval(() => {
        let twitter = document.getElementById("twitter");
        if (twitter.value.length < 1) {
            simulateTyping(twitter, xParam);
        }
    }, 100)
    setTimeout(() => clearInterval(interval), 5000);
}

function prepareName() {
    const name = document.getElementById("name");
    name.parentElement.appendChild(getNewBlock("x2c-name-suggestions"));
}

function prepareTicker() {
    const ticker = document.getElementById("ticker");
    ticker.parentElement.parentElement.appendChild(getNewBlock("x2c-ticker-suggestions"));
}

function prepareLogo() {
    let showMore = findAllByTextAndCssSelector('image or video', '[for=image]')[0];
    showMore.parentElement.appendChild(getNewBlock("x2c-logo-suggestions"));
}

function findAllByTextAndCssSelector(text, cssSelector) {
    return Array.from(document.querySelectorAll(cssSelector))
        .filter(elem => elem.textContent.trim() === text)
}


function simulateTyping(inputElement, textToType) {
    let index = 0;
    for (let i = 0; i < textToType.length; i++) {
        if (index < textToType.length && inputElement) {
            const char = textToType.charAt(index);
            const keydownEvent = new KeyboardEvent('keydown', {
                key: char,
                code: `Key${char.toUpperCase()}`,
                keyCode: char.charCodeAt(0),
                bubbles: true,
            });
            const inputEvent = new Event('input', {
                bubbles: true,
            });
            inputElement.dispatchEvent(keydownEvent);
            inputElement.value += char;
            inputElement.dispatchEvent(inputEvent);
            index++;
        }
    }
}

function simulateCleaning(inputElement) {
    let length = inputElement.value.length;
    for (let i = 0; i < length; i++) {
        const keydownEvent = new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
            keyCode: 8,
            bubbles: true,
        });

        const inputEvent = new Event('input', {
            bubbles: true,
        });

        inputElement.dispatchEvent(keydownEvent);
        inputElement.value = inputElement.value.slice(0, -1);
        inputElement.dispatchEvent(inputEvent);
    }
}

function closePopupIfPresent() {
    let closeButtons = findAllByTextAndCssSelector('[close]', '.cursor-pointer');
    if (closeButtons.length > 0) {
        closeButtons[0].click();
    }
}

function simulateFileSelection(imageInput) {
    let file;
    if (imageInput.startsWith("data:image")) {
        const byteCharacters = atob(imageInput.split(',')[1]);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset++) {
            byteArrays.push(byteCharacters.charCodeAt(offset));
        }

        const byteArray = new Uint8Array(byteArrays);
        const blob = new Blob([byteArray], {type: 'image/jpeg'});
        file = new File([blob], "logo.jpg", {type: 'image/jpeg'});
    } else if (imageInput.startsWith("https://") || imageInput.startsWith("http://")) {
        fetch(imageInput)
            .then(response => response.blob())
            .then(blob => {
                const fileName = imageInput.split('/').pop().split('?')[0];
                const file = new File([blob], fileName, {type: blob.type});
                const inputElement = document.querySelector('input[type="file"]');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                inputElement.files = dataTransfer.files;
                const changeEvent = new Event('change', {bubbles: true});
                inputElement.dispatchEvent(changeEvent);
            })
            .catch(error => console.error("Error fetching image:", error));
        return;
    } else {
        console.error("Invalid input. Please provide a base64 string or a valid HTTPS image URL.");
        return;
    }

    const inputElement = document.querySelector('input[type="file"]');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputElement.files = dataTransfer.files;
    const changeEvent = new Event('change', {bubbles: true});
    inputElement.dispatchEvent(changeEvent);
}

async function startLoadingImageSuggestions() {
    const container = document.getElementById("x2c-logo-suggestions");
    container.className = 'suggestions';
    const spinner = document.createElement('div');
    spinner.innerHTML = getSpinner();
    container.appendChild(spinner);

    try {
        let postId = extractTweetId(xParam);
        const response = await fetch(apiUrl + '/suggestions/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({postId: postId})
        });

        const data = await response.json();
        if (data && data.httpUrls) {
            let logos = data.httpUrls;
            displayLogos(logos, container)
            simulateFileSelection(logos[getRandomInt(logos.length)]);
        } else {
            console.log("No logo suggestions found for this tweet.");
        }
    } catch (error) {
        console.error('Error fetching logo suggestions:', error);
        alert('Failed to fetch logo suggestions. Please try again.');
    } finally {
        container.removeChild(spinner);
    }
}

function addClickListener(elementSelector, callback) {
    const elements = document.querySelectorAll(elementSelector);
    elements.forEach(element => {
        element.addEventListener('click', () => callback(element));
    });
}

function displayLogos(logos, container) {
    logos.forEach(url => {
        const img = document.createElement('img');
        img.classList.add('logo-suggestion-item');
        img.src = url;
        container.appendChild(img);
    });

    addClickListener('.logo-suggestion-item', function (element) {
        simulateFileSelection(element.src);
    });
}

function setName(value) {
    const name = document.getElementById("name");
    simulateCleaning(name);
    simulateTyping(name, value);
}

function setTicker(value) {
    const ticker = document.getElementById("ticker");
    simulateCleaning(ticker);
    simulateTyping(ticker, value);
}

async function startLoadingTextSuggestions() {
    const nameContainer = document.getElementById("x2c-name-suggestions");
    nameContainer.className = 'suggestions';
    const nameSpinner = document.createElement('div');
    nameSpinner.innerHTML = getSpinner();
    nameContainer.appendChild(nameSpinner);

    const tickerContainer = document.getElementById("x2c-ticker-suggestions");
    tickerContainer.className = 'suggestions';
    const tickerSpinner = document.createElement('div');
    tickerSpinner.innerHTML = getSpinner();
    tickerContainer.appendChild(tickerSpinner);

    let postId = extractTweetId(xParam);

    try {
        const response = await fetch(apiUrl + '/suggestions/text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({postId: postId})
        });

        const data = await response.json();

        if (data && data.tickers) {
            nameSpinner.remove()
            data.names.forEach(name => {
                const spanName = document.createElement('div');
                spanName.classList.add('suggestion-item');
                spanName.textContent = name;
                spanName.onclick = function () {
                    setName(name);
                };
                nameContainer.appendChild(spanName);
            });

            nameContainer.querySelectorAll(".suggestion-item")[0].click();

            tickerSpinner.remove()
            data.tickers.forEach(ticker => {
                const spanTicker = document.createElement('div');
                spanTicker.classList.add('suggestion-item');
                spanTicker.textContent = ticker;
                spanTicker.onclick = function () {
                    setTicker(ticker);
                };
                tickerContainer.appendChild(spanTicker);
            });

            tickerContainer.querySelectorAll(".suggestion-item")[0].click();
        } else {
            console.log("No suggestions found for this tweet.");
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

function initStyles() {
    let node = document.createElement('style');
    node.innerHTML = `
        .logo-suggestion-item {
            width: 70px;
            height: 70px;
            border-radius: 10px;
            object-fit: contain;
            cursor: pointer;
            transition: transform 0.3s ease-in-out, border 0.3s ease-in-out;
            border: 2px solid transparent;
        }

        .logo-suggestion-item:hover {
            transform: scale(1.1);
            border: 2px solid #1da1f2;
        }
        
        .suggestions {
            margin-top: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }
        
        .suggestion-item {
            color: black;
            background: #f3f3f3;
            padding: 8px 16px;
            border-radius: 18px;
            font-size: 12px;
            box-shadow: 0px 0px 2px rgba(83, 83, 83, 0.2);
            cursor: pointer;
            transition: background 0.3s ease-in-out,
            transform 0.2s ease-in-out;
        }
        
        .suggestion-item:hover {
            background: #1da1f2;
            color: white;
            transform: scale(1.05);
        }
        
        .pump-fun-block {
            padding: 10px;
            font-size: 18px;
            display: flex;
            font-family: sans-serif;
            text-align: center;
        }
    `;
    document.head.appendChild(node);
}

function extractTweetId(url) {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
}


function getNewBlock(id) {
    const newBlock = document.createElement('div');
    newBlock.id = id;
    newBlock.className = 'pump-fun-block';
    return newBlock;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getSpinner() {
    return "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><style>.spinner_5nOS{transform-origin:center;animation:spinner_sEAn .75s infinite linear}@keyframes spinner_sEAn{100%{transform:rotate(360deg)}} .spinner_5nOS { fill: white; }</style><path d=\"M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z\" opacity=\".25\" fill=\"white\"/><path d=\"M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z\" class=\"spinner_5nOS\"/></svg>"
}

function initPumpFun() {
    initStyles()
    closePopupIfPresent();
    prepareTwitterLink();
    prepareName();
    prepareTicker();
    prepareLogo();
    startLoadingImageSuggestions();
    startLoadingTextSuggestions();
}

function waitForElement(selector) {
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(intervalId);
                resolve(element);
            }
        }, 100);
    });
}

async function addPumpFunButtons() {
    if (window.location.hostname === 'pump.fun') {
        if (window.location.pathname === '/create' && xParam) {
            await waitForElement('.cursor-pointer');
            initPumpFun()
        }
    }
}

async function toggleX2CoinButtons() {
    if (window.location.hostname === 'x2co.in') {
        if (window.location.pathname === '/post') {
            await waitForElement('#download-extension-btn');
            document.querySelector('#download-extension-btn').remove()
            document.querySelector('#launch-coin-btn').classList.remove('visually-hidden');
        }
    }
}

addX2CoinButtons();
addPumpFunButtons()
toggleX2CoinButtons()

const observer = new MutationObserver(addX2CoinButtons);
observer.observe(document.body, {childList: true, subtree: true});



