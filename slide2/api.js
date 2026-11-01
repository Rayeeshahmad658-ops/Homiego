// ============================================================
// Homiego — api.js  (API-backed version of updated.js)
// All data is fetched from the FastAPI backend at localhost:8000
// ============================================================


// ──────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────

const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port === "8000" ? "" : "http://127.0.0.1:8000";

function apiErrorMessage(err) {
    if (!err) return "Request failed";
    if (typeof err.detail === "string") return err.detail;
    if (Array.isArray(err.detail)) {
        return err.detail.map(item => item.msg || item.detail || JSON.stringify(item)).join("; ");
    }
    if (typeof err.message === "string") return err.message;
    return "Request failed";
}

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("hg_token");
    const headers = { ...options.headers };
    if (!headers["Content-Type"] && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
        headers["Content-Type"] = "application/json";
    }
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(API + path, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(apiErrorMessage(err));
    }
    if (res.status === 204) return null;
    return res.json();
}


// ──────────────────────────────────────────────────────────
// GLOBALS
// ──────────────────────────────────────────────────────────

let rooms       = [];            // all properties fetched from API
let feedbacks   = [];            // all reviews fetched from API
let favoritedIds = new Set();    // property IDs that the current student has favorited
let currentUser = null;          // user object from localStorage / API

let currentRole   = "student";
let authMode      = "login";
let selectedRating = 0;
let toastTimer;


// ──────────────────────────────────────────────────────────
// SAFE HTML HELPERS
// ──────────────────────────────────────────────────────────

function makeElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

function validImage(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
}

function getRoomImage(room) {
    return validImage(room.image)
        ? room.image
        : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900";
}


// ──────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ──────────────────────────────────────────────────────────

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}


// ──────────────────────────────────────────────────────────
// AUTHENTICATION — UI
// ──────────────────────────────────────────────────────────

function showAuth(mode) {
    authMode = mode;
    document.getElementById("authSection").classList.remove("hidden");
    updateAuthUI();
    document.body.style.overflow = "hidden";
}

function closeAuth() {
    document.getElementById("authSection").classList.add("hidden");
    document.body.style.overflow = "";
}

function toggleAuth(event) {
    event.preventDefault();
    authMode = authMode === "login" ? "register" : "login";
    updateAuthUI();
}

function setRole(role) {
    currentRole = role;
    document.getElementById("studentRole").classList.toggle("active", role === "student");
    document.getElementById("ownerRole").classList.toggle("active", role === "owner");
}

function updateAuthUI() {
    const isRegister = authMode === "register";

    document.getElementById("authTitle").textContent =
        isRegister ? "Create Your Account" : "Welcome Back!";

    document.getElementById("authSubtitle").textContent = isRegister
        ? "Join Homiego and discover your perfect home."
        : "Login to continue your accommodation journey.";

    document.getElementById("nameField").classList.toggle("hidden", !isRegister);
    document.getElementById("mobileField").classList.toggle("hidden", !isRegister);

    document.getElementById("name").required   = isRegister;
    document.getElementById("mobile").required = isRegister;

    document.getElementById("authSubmit").textContent =
        isRegister ? "Create Account" : "Login";

    document.getElementById("switchMessage").textContent =
        isRegister ? "Already have an account?" : "Don't have an account?";

    document.getElementById("switchAuth").textContent =
        isRegister ? "Login" : "Register";

    document.getElementById("authMessage").textContent = "";
    document.getElementById("password").value = "";
}

function togglePassword() {
    const password = document.getElementById("password");
    const eye      = document.getElementById("passwordEye");
    if (password.type === "password") {
        password.type   = "text";
        eye.className   = "fa-solid fa-eye-slash";
    } else {
        password.type   = "password";
        eye.className   = "fa-solid fa-eye";
    }
}


// ──────────────────────────────────────────────────────────
// AUTH FORM SUBMIT
// ──────────────────────────────────────────────────────────

document.getElementById("authForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email    = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const message  = document.getElementById("authMessage");

    message.style.color = "#e05265";

    if (password.length < 6) {
        message.textContent = "Password must contain at least 6 characters.";
        return;
    }

    if (authMode === "register") {
        const name   = document.getElementById("name").value.trim();
        const mobile = document.getElementById("mobile").value.trim();

        if (!name) { message.textContent = "Please enter your full name."; return; }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            message.textContent = "Enter a valid 10-digit Indian mobile number.";
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            message.textContent = "Enter a valid email address.";
            return;
        }

        try {
            const data = await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({ name, email, mobile, password, role: currentRole }),
            });
            _saveSession(data);
            message.style.color = "#16a56a";
            message.textContent = "Account created successfully!";
            setTimeout(() => {
                closeAuth();
                showToast("Welcome " + data.user.name + "!");
                updateDashboard();
                document.getElementById(
                    data.user.role === "owner" ? "ownerDashboard" : "studentDashboard"
                ).scrollIntoView({ behavior: "smooth" });
            }, 700);
        } catch (err) {
            message.textContent = err.message;
        }
        return;
    }

    // LOGIN — must use application/x-www-form-urlencoded for OAuth2
    try {
        const params = new URLSearchParams();
        params.append("username", email);
        params.append("password", password);

        const res = await fetch(API + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Login failed" }));
            message.textContent = apiErrorMessage(err) || "Incorrect details. Please try again.";
            return;
        }

        const data = await res.json();
        _saveSession(data);
        closeAuth();
        showToast("Welcome " + data.user.name + "!");
        await updateDashboard();
        document.getElementById(
            data.user.role === "owner" ? "ownerDashboard" : "studentDashboard"
        ).scrollIntoView({ behavior: "smooth" });
    } catch (err) {
        message.textContent = err.message || "Login failed. Please try again.";
    }
});


function _saveSession(data) {
    localStorage.setItem("hg_token", data.access_token);
    localStorage.setItem("hg_user", JSON.stringify(data.user));
    currentUser = data.user;
}

function loginUser(user) {
    // Compatibility alias — called nowhere in api.js but preserved in case inline HTML uses it
    currentUser = user;
    closeAuth();
    showToast("Welcome " + user.name + "!");
    updateDashboard();
}

function logout() {
    currentUser = null;
    favoritedIds.clear();
    localStorage.removeItem("hg_token");
    localStorage.removeItem("hg_user");
    document.getElementById("studentDashboard").classList.add("hidden");
    document.getElementById("ownerDashboard").classList.add("hidden");
    updateNavbar();
    showToast("You have been logged out.");
}

async function restoreSession() {
    const token = localStorage.getItem("hg_token");
    const raw   = localStorage.getItem("hg_user");
    if (!token || !raw) return;

    try {
        currentUser = await apiFetch("/auth/me");
        // Refresh stored user in case it changed
        localStorage.setItem("hg_user", JSON.stringify(currentUser));
    } catch {
        // Token expired or invalid
        localStorage.removeItem("hg_token");
        localStorage.removeItem("hg_user");
        currentUser = null;
    }
}


// ──────────────────────────────────────────────────────────
// NAVIGATION
// ──────────────────────────────────────────────────────────

function updateNavbar() {
    const navActions = document.getElementById("navActions");
    navActions.innerHTML = "";

    if (currentUser) {
        const account = makeElement("span", "logged-user", "Hi, " + currentUser.name.split(" ")[0]);
        account.style.color      = "white";
        account.style.alignSelf  = "center";
        account.style.fontSize   = "12px";

        const logoutButton    = makeElement("button", "primary-btn", "Logout");
        logoutButton.onclick  = logout;

        navActions.append(account, logoutButton);
    } else {
        const login      = makeElement("button", "login-btn", "Login");
        login.onclick    = () => showAuth("login");

        const register   = makeElement("button", "primary-btn", "Register");
        register.onclick = () => showAuth("register");

        navActions.append(login, register);
    }
}

function toggleMenu() {
    document.getElementById("mainNav").classList.toggle("show");
}


// ──────────────────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────────────────

async function updateDashboard() {
    if (!currentUser) return;

    updateNavbar();

    const studentDashboard = document.getElementById("studentDashboard");
    const ownerDashboard   = document.getElementById("ownerDashboard");

    studentDashboard.classList.add("hidden");
    ownerDashboard.classList.add("hidden");

    if (currentUser.role === "student") {
        studentDashboard.classList.remove("hidden");
        document.getElementById("studentName").textContent = currentUser.name;

        // Fetch favorite IDs for fresh count
        try {
            const ids = await apiFetch("/favorites/ids");
            favoritedIds = new Set(ids);
        } catch { /* ignore */ }

        document.getElementById("favoriteCount").textContent      = favoritedIds.size;
        document.getElementById("studentRoomCount").textContent   = rooms.length;

    } else if (currentUser.role === "owner") {
        ownerDashboard.classList.remove("hidden");
        document.getElementById("ownerName").textContent = currentUser.name;

        let myRooms = getOwnerRooms();
        try {
            myRooms = await apiFetch("/properties/mine");
        } catch { /* fall back to listings already loaded */ }

        document.getElementById("ownerPropertyCount").textContent = myRooms.length;
        document.getElementById("ownerVacantCount").textContent   =
            myRooms.reduce((sum, r) => sum + Number(r.vacant), 0);

        displayOwnerProperties(myRooms);
    }
}


// ──────────────────────────────────────────────────────────
// FAVOURITES
// ──────────────────────────────────────────────────────────

async function getUserFavoriteIds() {
    if (!currentUser || currentUser.role !== "student") return;
    try {
        const ids    = await apiFetch("/favorites/ids");
        favoritedIds = new Set(ids);
    } catch { /* ignore */ }
}

function isFavorite(id) {
    return favoritedIds.has(Number(id));
}

async function toggleFavorite(id) {
    if (!currentUser) {
        showToast("Please login to save favourite rooms.");
        showAuth("login");
        return;
    }
    if (currentUser.role !== "student") {
        showToast("Only students can save favourite rooms.");
        return;
    }

    const numId = Number(id);
    try {
        if (favoritedIds.has(numId)) {
            await apiFetch("/favorites/" + numId, { method: "DELETE" });
            favoritedIds.delete(numId);
            showToast("Removed from favourites.");
        } else {
            await apiFetch("/favorites/" + numId, { method: "POST" });
            favoritedIds.add(numId);
            showToast("Added to favourites!");
        }
    } catch (err) {
        showToast(err.message);
        return;
    }

    displayRooms(getFilteredRooms());
    document.getElementById("favoriteCount").textContent = favoritedIds.size;
}


// ──────────────────────────────────────────────────────────
// ROOM RATINGS (computed from local feedbacks array)
// ──────────────────────────────────────────────────────────

function getRoomReviews(roomId) {
    return feedbacks.filter(f => Number(f.property_id) === Number(roomId));
}

function getRoomRating(room) {
    const reviews = getRoomReviews(room.id);
    if (reviews.length === 0) return Number(room.rating) || 0;
    return reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
}

function getStarHTML(rating) {
    const rounded = Math.round(rating);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}


// ──────────────────────────────────────────────────────────
// SEARCH & FILTERS (client-side on top of API results)
// ──────────────────────────────────────────────────────────

function getFilteredRooms() {
    const query        = document.getElementById("searchInput").value.trim().toLowerCase();
    const propertyType = document.getElementById("propertyTypeFilter").value;
    const bed          = document.getElementById("bedFilter").value;
    const ac           = document.getElementById("acFilter").value;
    const food         = document.getElementById("foodFilter").value;
    const electricity  = document.getElementById("electricityFilter").value;
    const availability = document.getElementById("availabilityFilter").value;
    const maxRent      = document.getElementById("maxRent").value;

    return rooms.filter(room => {
        const searchable = [room.title, room.location, room.university, room.description]
            .join(" ").toLowerCase();

        const matchesSearch      = !query        || searchable.includes(query);
        const matchesType        = !propertyType || (room.propertyType || "PG") === propertyType;
        const matchesBed         = !bed          || room.bed === bed;
        const matchesAC          = !ac           || room.ac === ac;
        const matchesFood        = !food         || room.food === food;
        const matchesElectricity = !electricity  || room.electricity === electricity;
        const matchesAvailability =
            !availability ||
            (availability === "Available" ? Number(room.vacant) > 0 : Number(room.vacant) === 0);
        const matchesRent        = !maxRent || Number(room.rent) <= Number(maxRent);

        return matchesSearch && matchesType && matchesBed && matchesAC &&
               matchesFood && matchesElectricity && matchesAvailability && matchesRent;
    });
}

async function searchRooms() {
    // For live API filtering we could pass query params; for simplicity we filter locally
    // since all rooms are already loaded.
    displayRooms(getFilteredRooms());
}

function resetFilters() {
    document.getElementById("searchInput").value        = "";
    document.getElementById("propertyTypeFilter").value = "";
    document.getElementById("bedFilter").value          = "";
    document.getElementById("acFilter").value           = "";
    document.getElementById("foodFilter").value         = "";
    document.getElementById("electricityFilter").value  = "";
    document.getElementById("availabilityFilter").value = "";
    document.getElementById("maxRent").value            = "";
    displayRooms(rooms);
    showToast("All filters cleared.");
}


// ──────────────────────────────────────────────────────────
// ROOM CARD CREATION
// ──────────────────────────────────────────────────────────

function createRoomCard(room, index) {
    const card = makeElement("article", "room-card");
    card.style.animationDelay = Math.min(index * 0.06, 0.4) + "s";

    // IMAGE
    const imageWrap = makeElement("div", "room-image-wrap");

    const image    = makeElement("img");
    image.src      = getRoomImage(room);
    image.alt      = room.title;
    image.loading  = "lazy";
    image.onclick  = () => openImage(getRoomImage(room), room.title);
    image.onerror  = function () {
        this.onerror = null;
        this.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900";
    };

    const badge = makeElement(
        "span",
        "availability-badge" + (room.vacant === 0 ? " full-badge" : ""),
        room.vacant > 0 ? "AVAILABLE" : "FULL"
    );

    const favorite = makeElement(
        "button",
        "favorite-btn" + (isFavorite(room.id) ? " active" : ""),
        isFavorite(room.id) ? "♥" : "♡"
    );
    favorite.type    = "button";
    favorite.title   = "Save to favourites";
    favorite.onclick = () => toggleFavorite(room.id);

    const hint = makeElement("span", "image-hint", "Click to view image");
    imageWrap.append(image, badge, favorite, hint);

    // ROOM INFO
    const info     = makeElement("div", "room-info");
    const titleRow = makeElement("div", "room-title-row");
    const title    = makeElement("h3", "", room.title);

    const rating      = makeElement("div", "rating-mini");
    const ratingValue = getRoomRating(room);
    const reviewCount = getRoomReviews(room.id).length;

    rating.textContent = ratingValue > 0
        ? getStarHTML(ratingValue) + " "
        : "☆☆☆☆☆ ";

    const ratingCount = makeElement(
        "span", "",
        ratingValue > 0
            ? ratingValue.toFixed(1) + (reviewCount ? " (" + reviewCount + ")" : "")
            : "New"
    );

    rating.appendChild(ratingCount);
    titleRow.append(title, rating);

    const location = makeElement("p", "room-location",
        "📍 " + room.location + " | " + room.university);

    const price = makeElement("div", "room-price");
    price.textContent = "₹" + Number(room.rent).toLocaleString("en-IN") + " ";
    price.appendChild(makeElement("small", "", "/ month"));

    const features    = makeElement("div", "room-features");
    const featureItems = [
        room.propertyType || "PG",
        room.bed + " Bed",
        room.ac,
        room.food === "Yes" ? "Food Included" : "No Food",
        room.electricity === "Yes" ? "Electricity Included" : "Electricity Extra",
    ];
    featureItems.forEach(item => features.appendChild(makeElement("span", "feature-tag", item)));

    const vacancy = makeElement(
        "p",
        "vacancy-text" + (room.vacant === 0 ? " full" : ""),
        room.vacant > 0
            ? room.vacant + " rooms vacant out of " + room.total
            : "Fully occupied – No vacancy"
    );

    const description = makeElement("p", "room-description", room.description);
    const owner       = makeElement("div", "owner-info",
        "Property Owner: " + (room.ownerName || "Owner"));

    const actions = makeElement("div", "room-actions");
    const contact = makeElement("a", "contact-btn");
    contact.href  = "tel:" + room.contact;
    contact.textContent = "☎ Contact Owner";
    if (room.vacant <= 0) {
        contact.style.opacity = ".5";
        contact.title = "No vacant rooms currently";
    }

    const review    = makeElement("button", "review-btn", "★ Review");
    review.onclick  = () => {
        document.getElementById("feedbackRoom").value = String(room.id);
        document.getElementById("feedback").scrollIntoView({ behavior: "smooth" });
        showToast("Selected " + room.title + " for review.");
    };

    actions.append(contact, review);
    info.append(titleRow, location, price, features, vacancy, description, owner, actions);
    card.append(imageWrap, info);
    return card;
}


// ──────────────────────────────────────────────────────────
// DISPLAY ROOMS
// ──────────────────────────────────────────────────────────

function displayRooms(list) {
    const grid = document.getElementById("roomGrid");
    grid.replaceChildren();

    document.getElementById("resultCount").textContent =
        list.length + (list.length === 1 ? " property found" : " properties found");

    document.getElementById("totalListings").textContent   = rooms.length;
    document.getElementById("availableRooms").textContent  =
        rooms.reduce((sum, r) => sum + Number(r.vacant), 0);

    if (list.length === 0) {
        const empty   = makeElement("div", "empty-state");
        const icon    = makeElement("i", "fa-solid fa-house-circle-xmark");
        const heading = makeElement("h3", "", "No properties found");
        const text    = makeElement("p",  "", "Try another location or change your filters.");
        empty.append(icon, heading, text);
        grid.appendChild(empty);
        return;
    }

    list.forEach((room, idx) => grid.appendChild(createRoomCard(room, idx)));
    populateFeedbackRooms();
}


// ──────────────────────────────────────────────────────────
// OWNER PROPERTY FORM
// ──────────────────────────────────────────────────────────

document.getElementById("propertyForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "owner") {
        showToast("Please login as a room owner.");
        return;
    }

    const total   = Number(document.getElementById("totalRooms").value);
    const vacant  = Number(document.getElementById("vacantRooms").value);
    const rent    = Number(document.getElementById("propertyRent").value);
    const contact = document.getElementById("ownerContact").value.trim();
    const imgInput = document.getElementById("propertyImage").value.trim();

    if (total < 1 || vacant < 0 || vacant > total) {
        showToast("Vacant rooms cannot exceed total rooms.");
        return;
    }
    if (rent <= 0) { showToast("Enter a valid monthly rent."); return; }
    if (!/^[6-9]\d{9}$/.test(contact)) {
        showToast("Enter a valid 10-digit mobile number.");
        return;
    }
    if (imgInput && !validImage(imgInput)) {
        showToast("Please enter a valid HTTP or HTTPS image URL.");
        return;
    }

    const body = {
        title:        document.getElementById("propertyTitle").value.trim(),
        location:     document.getElementById("propertyLocation").value.trim(),
        university:   document.getElementById("propertyUniversity").value.trim(),
        property_type: document.getElementById("propertyType").value,
        rent,
        bed:          document.getElementById("propertyBed").value,
        ac:           document.getElementById("propertyAC").value,
        food:         document.getElementById("propertyFood").value,
        electricity:  document.getElementById("propertyElectricity").value,
        total:         total,
        vacant:       vacant,
        contact,
        image:        imgInput || "",
        description:  document.getElementById("propertyDescription").value.trim(),
    };

    try {
        const created = await apiFetch("/properties", {
            method: "POST",
            body: JSON.stringify(body),
        });
        rooms.unshift(created);
        this.reset();
        displayRooms(getFilteredRooms());
        await updateDashboard();
        showToast("Your property has been published successfully!");
        document.getElementById("rooms").scrollIntoView({ behavior: "smooth" });
    } catch (err) {
        showToast(err.message);
    }
});


// ──────────────────────────────────────────────────────────
// OWNER PROPERTY MANAGEMENT
// ──────────────────────────────────────────────────────────

function getOwnerRooms() {
    if (!currentUser) return [];
    return rooms.filter(r =>
        r.ownerEmail === currentUser.email || Number(r.owner_id) === Number(currentUser.id)
    );
}

function displayOwnerProperties(myRooms) {
    const list = document.getElementById("ownerProperties");
    list.replaceChildren();
    if (!currentUser) return;

    myRooms = myRooms || getOwnerRooms();

    if (myRooms.length === 0) {
        list.appendChild(makeElement("p", "", "You haven't published any properties yet."));
        return;
    }

    myRooms.forEach(room => {
        const item         = makeElement("div", "owner-property-item");
        const title        = makeElement("h4", "", room.title);
        const location     = makeElement("p", "", "📍 " + room.location);
        const rent         = makeElement("p", "", "Rent: ₹" + Number(room.rent).toLocaleString("en-IN") + "/month");
        const availability = makeElement("p", "", "Vacant: " + room.vacant + " / " + room.total);
        const deleteButton = makeElement("button", "delete-btn", "Delete Listing");
        deleteButton.onclick = () => deleteProperty(room.id);
        item.append(title, location, rent, availability, deleteButton);
        list.appendChild(item);
    });
}

async function deleteProperty(id) {
    if (!currentUser || currentUser.role !== "owner") return;

    const room = rooms.find(r => r.id === Number(id));
    const ownsRoom = room && (
        room.ownerEmail === currentUser.email ||
        Number(room.owner_id) === Number(currentUser.id)
    );
    if (!ownsRoom) {
        showToast("You cannot delete this property.");
        return;
    }
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
        await apiFetch("/properties/" + id, { method: "DELETE" });
        rooms = rooms.filter(r => r.id !== Number(id));
        feedbacks = feedbacks.filter(f => Number(f.property_id) !== Number(id));
        displayRooms(getFilteredRooms());
        displayFeedback();
        await updateDashboard();
        showToast("Property deleted successfully.");
    } catch (err) {
        showToast(err.message);
    }
}


// ──────────────────────────────────────────────────────────
// IMAGE PREVIEW
// ──────────────────────────────────────────────────────────

function openImage(src, title) {
    document.getElementById("largeImage").src        = src;
    document.getElementById("imageCaption").textContent = title;
    document.getElementById("imageModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeImage() {
    document.getElementById("imageModal").classList.add("hidden");
    document.body.style.overflow = "";
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeImage();
        closeAuth();
    }
});


// ──────────────────────────────────────────────────────────
// STAR RATING PICKER
// ──────────────────────────────────────────────────────────

document.querySelectorAll("#ratingPicker button").forEach(button => {
    button.addEventListener("click", function () {
        selectedRating = Number(this.dataset.rating);
        document.getElementById("feedbackRating").value = selectedRating;
        updateStarPicker();
    });
    button.addEventListener("mouseenter", function () {
        updateStarPicker(Number(this.dataset.rating));
    });
});

document.getElementById("ratingPicker").addEventListener("mouseleave", function () {
    updateStarPicker();
});

function updateStarPicker(hoverRating = 0) {
    const rating = hoverRating || selectedRating;
    document.querySelectorAll("#ratingPicker button").forEach(button => {
        button.classList.toggle("active", Number(button.dataset.rating) <= rating);
    });
}


// ──────────────────────────────────────────────────────────
// FEEDBACK ROOM SELECT
// ──────────────────────────────────────────────────────────

function populateFeedbackRooms() {
    const select   = document.getElementById("feedbackRoom");
    const previous = select.value;

    select.replaceChildren();

    const defaultOption  = makeElement("option", "", "Select Room to Rate");
    defaultOption.value  = "";
    select.appendChild(defaultOption);

    rooms.forEach(room => {
        const option  = makeElement("option", "", room.title + " - " + room.location);
        option.value  = String(room.id);
        select.appendChild(option);
    });

    if (rooms.some(r => String(r.id) === previous)) {
        select.value = previous;
    }
}


// ──────────────────────────────────────────────────────────
// FEEDBACK FORM SUBMIT
// ──────────────────────────────────────────────────────────

document.getElementById("feedbackForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "student") {
        showToast("Please login as a student to submit feedback.");
        showAuth("login");
        return;
    }

    const propertyId = Number(document.getElementById("feedbackRoom").value);
    const rating     = Number(document.getElementById("feedbackRating").value);
    const message    = document.getElementById("feedbackText").value.trim();
    const room       = rooms.find(r => Number(r.id) === propertyId);

    if (!room)    { showToast("Please select a valid property."); return; }
    if (rating < 1 || rating > 5) { showToast("Please select a star rating."); return; }
    if (!message) { showToast("Please write your feedback."); return; }

    try {
        await apiFetch("/reviews", {
            method: "POST",
            body: JSON.stringify({ room_id: propertyId, rating, message }),
        });

        // Prefill name field if present
        const nameField = document.getElementById("feedbackName");
        if (nameField) nameField.value = currentUser.name;

        showToast("Thank you for your review!");
        this.reset();
        selectedRating = 0;
        updateStarPicker();

        // Refresh reviews from server
        feedbacks = (await apiFetch("/reviews")).map(r => ({ ...r, property_id: r.room_id }));
        displayFeedback();
        displayRooms(getFilteredRooms());
    } catch (err) {
        showToast(err.message);
    }
});


// ──────────────────────────────────────────────────────────
// DISPLAY FEEDBACK
// ──────────────────────────────────────────────────────────

function displayFeedback() {
    const list = document.getElementById("feedbackList");
    list.replaceChildren();

    if (feedbacks.length === 0) {
        list.appendChild(makeElement("p", "", "No reviews yet. Be the first student to share an experience!"));
        return;
    }

    feedbacks.slice(0, 12).forEach(review => {
        const room = rooms.find(r => Number(r.id) === Number(review.property_id));
        const card = makeElement("div", "feedback-item");

        const name     = makeElement("h4", "", review.author_name || review.name || "Student");
        const dateStr  = review.created_at
            ? new Date(review.created_at).toLocaleDateString("en-IN")
            : "";
        const date     = makeElement("small", "", dateStr);
        const stars    = makeElement("div", "stars", getStarHTML(review.rating));
        const roomName = makeElement("small", "", room ? "Room: " + room.title : "Property review");
        const msg      = makeElement("p", "", review.message);

        card.append(name, date, stars, roomName, msg);
        list.appendChild(card);
    });
}


// ──────────────────────────────────────────────────────────
// INITIALIZE WEBSITE
// ──────────────────────────────────────────────────────────

async function initializeWebsite() {
    // 1. Restore session (verify token with server)
    await restoreSession();
    updateNavbar();

    // 2. Fetch all properties
    try {
        rooms = await apiFetch("/properties");
    } catch (err) {
        showToast("Could not load properties: " + err.message);
        rooms = [];
    }

    // 3. Fetch all reviews
    try {
        feedbacks = (await apiFetch("/reviews")).map(r => ({ ...r, property_id: r.room_id }));
    } catch {
        feedbacks = [];
    }

    // 4. Fetch favourite IDs if student is logged in
    if (currentUser && currentUser.role === "student") {
        await getUserFavoriteIds();
    }

    // 5. Render
    displayRooms(rooms);
    displayFeedback();
    populateFeedbackRooms();
    updateStarPicker();

    // 6. Update dashboard if user is logged in
    if (currentUser) {
        await updateDashboard();
    }
}

initializeWebsite();
