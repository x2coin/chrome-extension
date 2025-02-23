const x2coin_post_url = 'https://x2co.in/post?x=';

function addX2CoinButtons() {
    document.querySelectorAll('article').forEach(post => {
        if (post.querySelector('.x2coin-btn')) return;
        const button = document.createElement('button');
        button.textContent = 'Create Coin';
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
            window.open(x2coin_post_url + link, '_blank');
        });
    });
}

addX2CoinButtons();

const observer = new MutationObserver(addX2CoinButtons);
observer.observe(document.body, {childList: true, subtree: true});
