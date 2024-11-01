// Add a listener to respond to messages from other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "follow" || request.action === "unfollow") {
        // Find the active tab in the current window
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];

            // Execute the script on the active tab
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: runFollowScript,
                args: [request.followLimit, request.action]
            });
        });
    }
});

// The main script that runs on the active tab
function runFollowScript(followLimit, mode = "follow") {
    (function() {
        // Helper Functions

        // Returns a random delay between the specified min and max values
        function getRandomDelay(min, max) {
            return Math.random() * (max - min) + min;
        }

        // Follow button keywords in multiple languages
        const followKeywords = [
            'follow', 'follow back', 'bağlantı kur', 'connect', 'vernetzen', 'accepter', 'añadir', 'adicionar',
            'fremde', 'agregar', 'dodać', 'dodaj', 'følg', 'connecter', 'تواصل', 'sígueme', 'add',
            'ajouter', 'conectar', 'segui', 'seguire', 'connetti', 'takip et'
        ];

        // Unfollow button keywords in multiple languages
        const unfollowKeywords = [
            'following', 'unfollow', 'entfolgen', 'desconectar', 'désabonner', 'dejar de seguir', 'unir',
            'dejar', 'décrocher', 'deconnecter', '停止关注', 'slett', 'entfernen'
        ];

        // Gets all follow buttons on the page
        function getFollowButtons() {
            return Array.from(document.querySelectorAll('button')).filter(button =>
                followKeywords.includes(button.textContent.trim().toLowerCase()) ||
                followKeywords.includes(button.getAttribute('aria-label')?.trim().toLowerCase()) ||
                Array.from(button.children).some(child => followKeywords.includes(child.textContent.trim().toLowerCase()))
            );
        }

        // Gets all unfollow buttons on the page
        function getUnfollowButtons() {
            return Array.from(document.querySelectorAll('button')).filter(button =>
                unfollowKeywords.includes(button.textContent.trim().toLowerCase()) ||
                unfollowKeywords.includes(button.getAttribute('aria-label')?.trim().toLowerCase()) ||
                Array.from(button.children).some(child => unfollowKeywords.includes(child.textContent.trim().toLowerCase()))
            );
        }

        // Clicks buttons with a random delay, up to a specified limit
        function clickButtonsWithDelay(buttons, limit) {
            let index = 0;
            let actionCount = 0;

            function clickNextButton() {
                if (index >= buttons.length || (limit !== undefined && actionCount >= limit)) {
                    console.log('Reached action limit or all buttons have been clicked.');
                    scrollToBottomAndWait();
                    return;
                }

                buttons[index].click();
                actionCount++;
                console.log(`Clicked button ${index + 1} of ${buttons.length}, Total actions: ${actionCount}`);
                index++;

                const delay = getRandomDelay(300, 1000);
                setTimeout(clickNextButton, delay);
            }

            clickNextButton();
        }

        // Scrolls to the bottom of the page and waits for new buttons to load
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

        // Main Logic
        let buttons = mode === "follow" ? getFollowButtons() : getUnfollowButtons();
        if (buttons.length > 0) {
            clickButtonsWithDelay(buttons, followLimit);
        } else {
            scrollToBottomAndWait();
        }
    })();
}
