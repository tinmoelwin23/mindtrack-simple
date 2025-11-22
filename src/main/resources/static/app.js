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

const themeToggle = document.getElementById("theme-toggle");

const profileUsername = document.getElementById("profile-username");
const profileTotal = document.getElementById("profile-total");
const profilePositive = document.getElementById("profile-positive");
const profileNeutral = document.getElementById("profile-neutral");
const profileNegative = document.getElementById("profile-negative");
const negativeWarning = document.getElementById("negative-warning");

let currentUsername = null;
let editingId = null;
let entriesCache = [];
let moodChart = null;

async function api(path, options = {}) {
    const res = await fetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        credentials: "include"
    });
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {};
    }
    return { res, data };
}

regBtn.addEventListener("click", async () => {
    regMessage.textContent = "";
    const username = regUsername.value.trim();
    const password = regPassword.value.trim();

    if (!username || !password) {
        regMessage.textContent = "Please enter username and password.";
        return;
    }

    const { res, data } = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password })
    });

    regMessage.textContent = data.message || (res.ok ? "Registered." : "Registration failed.");
});

loginBtn.addEventListener("click", async () => {
    loginMessage.textContent = "";
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    if (!username || !password) {
        loginMessage.textContent = "Please enter username and password.";
        return;
    }

    const { res, data } = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
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
    await api("/api/auth/logout", { method: "POST" });
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

    let url = "/api/entries";
    let method = "POST";
    if (editingId !== null) {
        url = "/api/entries/" + editingId;
        method = "PUT";
    }

    const { res, data } = await api(url, {
        method: method,
        body: JSON.stringify({ content })
    });

    if (res.ok) {
        const label = data.sentimentLabel;
        entryMessage.textContent = (editingId === null ? "Entry saved. " : "Entry updated. ") + "Sentiment: " + label + ".";
        if (label === "Negative") {
            entryMessage.textContent += " Be kind to yourself and consider taking a short break or talking to someone you trust.";
        }
        editingId = null;
        entryContent.value = "";
        await loadEntries();
    } else {
        entryMessage.textContent = data.message || "Could not save entry.";
    }
});

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "Light mode";
    } else {
        document.body.classList.remove("dark-mode");
        themeToggle.textContent = "Dark mode";
    }
}

themeToggle.addEventListener("click", () => {
    const current = document.body.classList.contains("dark-mode") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
});

async function onLoggedIn() {
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    welcomeText.textContent = "Welcome, " + (currentUsername || "User");
    await loadEntries();
}

async function loadEntries() {
    entriesList.innerHTML = "";
    const { res, data } = await api("/api/entries");
    if (!res.ok) {
        entriesList.innerHTML = "<p>Could not load entries.</p>";
        return;
    }

    entriesCache = data;

    let countPos = 0;
    let countNeu = 0;
    let countNeg = 0;

    data.forEach(e => {
        if (e.sentimentLabel === "Positive") {
            countPos++;
        } else if (e.sentimentLabel === "Negative") {
            countNeg++;
        } else {
            countNeu++;
        }

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

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
            editingId = e.id;
            entryContent.value = e.content;
            entryMessage.textContent = "Editing the selected entry. Change the text and click Save Entry.";
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "delete-btn";
        delBtn.addEventListener("click", () => deleteEntry(e.id));

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        div.appendChild(header);
        div.appendChild(contentDiv);
        div.appendChild(actions);

        entriesList.appendChild(div);
    });

    statPositive.textContent = countPos;
    statNeutral.textContent = countNeu;
    statNegative.textContent = countNeg;

    updateProfileStats(countPos, countNeu, countNeg, data.length);
    updateMoodChart(data);
}

function updateProfileStats(pos, neu, neg, total) {
    profileUsername.textContent = currentUsername || "User";
    profileTotal.textContent = total;
    profilePositive.textContent = pos;
    profileNeutral.textContent = neu;
    profileNegative.textContent = neg;

    if (total === 0) {
        negativeWarning.classList.add("hidden");
        return;
    }

    const recent = entriesCache.slice(0, 3);
    let negativeCount = 0;
    recent.forEach(e => {
        if (e.sentimentLabel === "Negative") {
            negativeCount++;
        }
    });

    if (negativeCount >= 2) {
        negativeWarning.classList.remove("hidden");
    } else {
        negativeWarning.classList.add("hidden");
    }
}

function updateMoodChart(entries) {
    const byDate = {};

    entries.slice().reverse().forEach(e => {
        const dateStr = e.createdAt.slice(0, 10);
        if (!byDate[dateStr]) {
            byDate[dateStr] = { sum: 0, count: 0 };
        }
        byDate[dateStr].sum += e.sentimentScore;
        byDate[dateStr].count += 1;
    });

    const labels = Object.keys(byDate).sort();
    const values = labels.map(d => byDate[d].sum / byDate[d].count);

    const canvas = document.getElementById("moodChart");
    if (!canvas) {
        return;
    }
    const ctx = canvas.getContext("2d");

    if (moodChart) {
        moodChart.destroy();
    }

    moodChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Average mood",
                data: values
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    suggestedMin: -1,
                    suggestedMax: 1
                }
            }
        }
    });
}

async function deleteEntry(id) {
    const ok = confirm("Delete this entry?");
    if (!ok) {
        return;
    }

    const { res, data } = await api("/api/entries/" + id, {
        method: "DELETE"
    });

    if (res.ok) {
        await loadEntries();
    } else {
        alert(data.message || "Could not delete entry.");
    }
}

window.addEventListener("load", async () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);

    const { res } = await api("/api/auth/me");
    if (res.ok) {
        currentUsername = loginUsername.value || "User";
        onLoggedIn();
    }
});