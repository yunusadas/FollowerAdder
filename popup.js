document.getElementById("followButton").addEventListener("click", () => {
    const followLimit = document.getElementById("followLimit").value;
    chrome.runtime.sendMessage({ action: "follow", followLimit: parseInt(followLimit) });
    document.getElementById("status").textContent = "Following started...";
});

document.getElementById("unfollowButton").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "unfollow" });
    document.getElementById("status").textContent = "Unfollowing started...";
});
