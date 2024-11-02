chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "follow" || request.action === "unfollow") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            const followLimit = request.action === "follow" ? request.followLimit : 0;
            const mode = request.action;

            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: runFollowScript,
                args: [followLimit, mode]
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
                    if (followCount >= limit) {
                        chrome.runtime.sendMessage({ notification: "Limit reached" });
                    }
                    console.log('Reached follow/unfollow limit or all buttons have been clicked.');
                    scrollToBottomAndWait(true); // Başa dönmek için true değeri gönder
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

        let scrollCount = 0;
        const maxScrolls = 10;

        function scrollToBottomAndWait(reset = false) {
            if (reset) {
                scrollCount = 0;
            }

            if (scrollCount >= maxScrolls) {
                console.log('Reached max scroll limit. Stopping...');
                return;
            }

            window.scrollTo(0, document.body.scrollHeight);
            console.log(`Scrolled to the bottom of the page. Waiting for new buttons... (Scroll ${scrollCount + 1}/${maxScrolls})`);
            scrollCount++;

            setTimeout(() => {
                let newButtons = mode === 'follow' ? getFollowButtons() : getUnfollowButtons();
                if (newButtons.length > 0) {
                    console.log(`Found ${newButtons.length} new buttons. Starting to click them...`);
                    clickButtonsWithDelay(newButtons, mode === 'follow' ? followLimit : undefined);
                } else {
                    console.log('No new buttons found. Stopping...');
                }
            }, 5000);
        }

        let initialButtons = mode === "follow" ? getFollowButtons() : getUnfollowButtons();
        if (initialButtons.length > 0) {
            clickButtonsWithDelay(initialButtons, followLimit);
        } else {
            scrollToBottomAndWait();
        }
    })();
}

// Bildirim gönderme fonksiyonu
chrome.runtime.onMessage.addListener((request) => {
    if (request.notification === "Limit reached") {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Limit Reached",
            message: "Follow/unfollow limit reached. Restarting..."
        });
    }
});
