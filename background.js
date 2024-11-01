chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "follow" || request.action === "unfollow") {
        // Aktif sekmeyi buluyoruz
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];

            // `chrome.scripting.executeScript` ile kodu aktif sekmede çalıştırıyoruz
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: runFollowScript,
                args: [request.followLimit, request.action]
            });
        });
    }
});

function runFollowScript(followLimit, mode = "follow") {
    (function() {
        function getRandomDelay(min, max) {
            return Math.random() * (max - min) + min;
        }

        function getFollowButtons() {
            return Array.from(document.querySelectorAll('button')).filter(button =>
                button.textContent.trim().toLowerCase() === 'follow'
            );
        }

        function getUnfollowButtons() {
            return Array.from(document.querySelectorAll('button')).filter(button =>
                button.textContent.trim().toLowerCase() === 'following'
            );
        }

        function clickButtonsWithDelay(buttons, limit) {
            let index = 0;
            let followCount = 0;

            function clickNextButton() {
                if (index >= buttons.length || (limit !== undefined && followCount >= limit)) {
                    console.log('Reached follow limit or all buttons have been clicked.');
                    scrollToBottomAndWait();
                    return;
                }

                buttons[index].click();
                followCount++;
                console.log(`Clicked button ${index + 1} of ${buttons.length}, Total actions: ${followCount}`);
                index++;

                const delay = getRandomDelay(300, 1000);
                setTimeout(clickNextButton, delay);
            }

            clickNextButton();
        }

        function scrollToBottomAndWait() {
            window.scrollTo(0, document.body.scrollHeight);
            console.log('Scrolled to the bottom of the page. Waiting for new buttons...');

            setTimeout(() => {
                let newButtons = mode === 'follow' ? getFollowButtons() : getUnfollowButtons();
                if (newButtons.length > 0) {
                    console.log(`Found ${newButtons.length} new buttons. Starting to click them...`);
                    clickButtonsWithDelay(newButtons, mode === 'follow' ? followLimit : undefined);
                } else {
                    scrollToBottomAndWait();
                }
            }, 5000);
        }

        let followButtons = mode === "follow" ? getFollowButtons() : getUnfollowButtons();
        if (followButtons.length > 0) {
            clickButtonsWithDelay(followButtons, followLimit);
        } else {
            scrollToBottomAndWait();
        }
    })();
}
