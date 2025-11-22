const regUsername = document.getElementById("reg-username");
const regPassword = document.getElementById("reg-password");
const regBtn = document.getElementById("reg-btn");
const regMessage = document.getElementById("reg-message");

const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const loginMessage = document.getElementById("login-message");

const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const welcomeText = document.getElementById("welcome-text");
const logoutBtn = document.getElementById("logout-btn");

const entryContent = document.getElementById("entry-content");
const saveEntryBtn = document.getElementById("save-entry-btn");
const entryMessage = document.getElementById("entry-message");

const entriesList = document.getElementById("entries-list");

const statPositive = document.getElementById("stat-positive");
const statNeutral = document.getElementById("stat-neutral");
const statNegative = document.getElementById("stat-negative");

let currentUsername = null;

async function api(path, options = {}) {
    const res = await fetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        credentials: "include" // send cookies for session
    });
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {};
    }
    return {res, data};
}

regBtn.addEventListener("click", async () => {
    regMessage.textContent = "";
    const username = regUsername.value.trim();
    const password = regPassword.value.trim();

    if (!username || !password) {
        regMessage.textContent = "Please enter username and password.";
        return;
    }

    const {res, data} = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({username, password})
    });

    regMessage.textContent = data.message || (res.ok ? "Registered!" : "Registration failed.");
});

loginBtn.addEventListener("click", async () => {
    loginMessage.textContent = "";
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    if (!username || !password) {
        loginMessage.textContent = "Please enter username and password.";
        return;
    }

    const {res, data} = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({username, password})
    });

    if (res.ok) {
        currentUsername = username;
        loginMessage.textContent = "";
        regMessage.textContent = "";
        onLoggedIn();
    } else {
        loginMessage.textContent = data.message || "Login failed.";
    }
});

logoutBtn.addEventListener("click", async () => {
    await api("/api/auth/logout", {method: "POST"});
    currentUsername = null;
    appSection.classList.add("hidden");
    authSection.classList.remove("hidden");
});

saveEntryBtn.addEventListener("click", async () => {
    entryMessage.textContent = "";
    const content = entryContent.value.trim();
    if (!content) {
        entryMessage.textContent = "Please write something first.";
        return;
    }

    const {res, data} = await api("/api/entries", {
        method: "POST",
        body: JSON.stringify({content})
    });

    if (res.ok) {
        entryMessage.textContent = "Entry saved. Sentiment: " + data.sentimentLabel;
        entryContent.value = "";
        loadEntries();
    } else {
        entryMessage.textContent = data.message || "Could not save entry.";
    }
});

async function onLoggedIn() {
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    welcomeText.textContent = "Welcome, " + (currentUsername || "User");
    await loadEntries();
}

async function loadEntries() {
    entriesList.innerHTML = "";
    const {res, data} = await api("/api/entries");
    if (!res.ok) {
        entriesList.innerHTML = "<p>Could not load entries.</p>";
        return;
    }

    let countPos = 0, countNeu = 0, countNeg = 0;

    data.forEach(e => {
        if (e.sentimentLabel === "Positive") countPos++;
        else if (e.sentimentLabel === "Negative") countNeg++;
        else countNeu++;

        const div = document.createElement("div");
        div.className = "entry";

        const header = document.createElement("div");
        header.className = "entry-header";

        const labelSpan = document.createElement("span");
        labelSpan.className = "entry-label label-" + e.sentimentLabel;
        labelSpan.textContent = e.sentimentLabel;

        const timeSpan = document.createElement("span");
        timeSpan.className = "entry-timestamp";
        timeSpan.textContent = e.createdAt;

        header.appendChild(labelSpan);
        header.appendChild(timeSpan);

        const contentDiv = document.createElement("div");
        contentDiv.className = "entry-content";
        contentDiv.textContent = e.content;

        const actions = document.createElement("div");
        actions.className = "entry-actions";

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => deleteEntry(e.id));

        actions.appendChild(delBtn);

        div.appendChild(header);
        div.appendChild(contentDiv);
        div.appendChild(actions);

        entriesList.appendChild(div);
    });

    statPositive.textContent = countPos;
    statNeutral.textContent = countNeu;
    statNegative.textContent = countNeg;
}

async function deleteEntry(id) {
    const ok = confirm("Delete this entry?");
    if (!ok) return;

    const {res, data} = await api("/api/entries/" + id, {
        method: "DELETE"
    });

    if (res.ok) {
        await loadEntries();
    } else {
        alert(data.message || "Could not delete entry.");
    }
}

// Optional: check if already logged in when page loads
window.addEventListener("load", async () => {
    const {res} = await api("/api/auth/me");
    if (res.ok) {
        // user is logged in, show app
        currentUsername = loginUsername.value || "User";
        onLoggedIn();
    }
});
