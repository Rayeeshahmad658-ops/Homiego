
// ==========================================
// STAYFINDER - COMPLETE WEBSITE JAVASCRIPT
// ==========================================

// STORAGE
const STORAGE = {
    users: "sf_users",
    rooms: "sf_rooms",
    feedbacks: "sf_feedbacks",
    favorites: "sf_favorites",
    session: "sf_session"
};

function loadData(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
}

let users = loadData(STORAGE.users, []);
let rooms = loadData(STORAGE.rooms, []);
let feedbacks = loadData(STORAGE.feedbacks, []);
let favorites = loadData(STORAGE.favorites, {});
let currentUser = null;

let currentRole = "student";
let authMode = "login";
let selectedRating = 0;
let toastTimer;


// ==========================================
// DEMO PROPERTY DATA
// ==========================================

const demoRooms = [
    {
        id: 1001,
        title: "Premium Student PG",
        location: "Sector 32, Chandigarh",
        university: "Panjab University",
        rent: 6500,
        bed: "Single",
        ac: "AC",
        food: "Yes",
        electricity: "Yes",
        total: 20,
        vacant: 5,
        contact: "9876543210",
        ownerName: "Amit Sharma",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900",
        description: "Fully furnished rooms with Wi-Fi, comfortable beds and a peaceful environment.",
        rating: 4.5
    },
    {
        id: 1002,
        title: "Affordable Boys Hostel",
        location: "Sector 15, Chandigarh",
        university: "Panjab University",
        rent: 4500,
        bed: "Double",
        ac: "Non-AC",
        food: "No",
        electricity: "No",
        total: 15,
        vacant: 3,
        contact: "9876543211",
        ownerName: "Rahul Verma",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900",
        description: "Budget-friendly student accommodation close to college and markets.",
        rating: 4.2
    },
    {
        id: 1003,
        title: "Luxury Student Rooms",
        location: "Phagwara, Punjab",
        university: "Lovely Professional University",
        rent: 8500,
        bed: "Single",
        ac: "AC",
        food: "Yes",
        electricity: "No",
        total: 12,
        vacant: 0,
        contact: "9876543212",
        ownerName: "Rohit Kumar",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900",
        description: "Premium rooms with modern furniture and a comfortable atmosphere.",
        rating: 4.8
    },
    {
        id: 1004,
        title: "Comfort Living PG",
        location: "Ludhiana, Punjab",
        university: "Punjab Agricultural University",
        rent: 5500,
        bed: "Double",
        ac: "AC",
        food: "Yes",
        electricity: "Yes",
        total: 18,
        vacant: 7,
        contact: "9876543213",
        ownerName: "Sandeep Singh",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1560185008-b033106af5c3?w=900",
        description: "Clean rooms, home-style food and a friendly student environment.",
        rating: 4.4
    },
    {
        id: 1005,
        title: "Modern Girls Hostel",
        location: "Jalandhar, Punjab",
        university: "DAV University",
        rent: 7000,
        bed: "Single",
        ac: "Non-AC",
        food: "Yes",
        electricity: "No",
        total: 25,
        vacant: 9,
        contact: "9876543214",
        ownerName: "Priya Sharma",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900",
        description: "Comfortable accommodation with furnished rooms and food facilities.",
        rating: 4.6
    },
    {
        id: 1006,
        title: "Student Budget Rooms",
        location: "Amritsar, Punjab",
        university: "Guru Nanak Dev University",
        rent: 3500,
        bed: "Double",
        ac: "Non-AC",
        food: "No",
        electricity: "Yes",
        total: 10,
        vacant: 4,
        contact: "9876543215",
        ownerName: "Manpreet Singh",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900",
        description: "Affordable rooms with essential facilities for students.",
        rating: 4.1
    },
    {
        id: 1007,
        title: "Maple Corner Student PG",
        propertyType: "PG",
        location: "Sector 34, Chandigarh",
        university: "Panjab University",
        rent: 6000,
        bed: "Single",
        ac: "AC",
        food: "Yes",
        electricity: "No",
        total: 14,
        vacant: 4,
        contact: "9876543216",
        ownerName: "Neha Gupta",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900",
        description: "Bright furnished rooms with Wi-Fi and optional home-style meals.",
        rating: 4.3
    },
    {
        id: 1008,
        title: "Green Nest Girls PG",
        propertyType: "PG",
        location: "Sector 15, Chandigarh",
        university: "Panjab University",
        rent: 7200,
        bed: "Double",
        ac: "Non-AC",
        food: "Yes",
        electricity: "Yes",
        total: 16,
        vacant: 5,
        contact: "9876543217",
        ownerName: "Simran Kaur",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900",
        description: "A well-kept shared stay with meals, study space and secure entry.",
        rating: 4.5
    },
    {
        id: 1009,
        title: "Campus View Hostel",
        propertyType: "Hostel",
        location: "Phagwara, Punjab",
        university: "Lovely Professional University",
        rent: 5000,
        bed: "Double",
        ac: "Non-AC",
        food: "No",
        electricity: "No",
        total: 30,
        vacant: 8,
        contact: "9876543218",
        ownerName: "Harpreet Singh",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900",
        description: "Simple, budget-friendly hostel rooms a short ride from campus.",
        rating: 4.2
    },
    {
        id: 1010,
        title: "Sunny 2BHK Campus Flat",
        propertyType: "2BHK Flat",
        location: "Sector 44, Chandigarh",
        university: "Panjab University",
        rent: 18000,
        bed: "Double",
        ac: "AC",
        food: "No",
        electricity: "No",
        total: 1,
        vacant: 1,
        contact: "9876543219",
        ownerName: "Karan Mehta",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900",
        description: "A bright two-bedroom flat with a living room and equipped kitchen.",
        rating: 4.6
    },
    {
        id: 1011,
        title: "Spacious 3BHK Family Flat",
        propertyType: "3BHK Flat",
        location: "Sector 70, Mohali",
        university: "Chandigarh University",
        rent: 24000,
        bed: "Double",
        ac: "AC",
        food: "No",
        electricity: "No",
        total: 1,
        vacant: 1,
        contact: "9876543220",
        ownerName: "Aman Bedi",
        ownerEmail: "",
        image: "https://images.unsplash.com/photo-1560185008-b033106af5c3?w=900",
        description: "A roomy three-bedroom flat suited to students sharing together.",
        rating: 4.7
    }
];

const existingRoomIds = new Set(rooms.map(room => Number(room.id)));
const addedDemoRooms = demoRooms.filter(room => !existingRoomIds.has(room.id));
const propertyTypeById = {
    1001: "PG",
    1002: "Hostel",
    1003: "PG",
    1004: "PG",
    1005: "Hostel",
    1006: "PG"
};
let roomDataChanged = addedDemoRooms.length > 0;

rooms = [...rooms, ...addedDemoRooms].map(room => {
    if (room.propertyType) return room;

    roomDataChanged = true;
    return { ...room, propertyType: propertyTypeById[room.id] || "PG" };
});

if (roomDataChanged) {
    saveData();
}


// ==========================================
// SAVE DATA
// ==========================================

function saveData() {
    localStorage.setItem(STORAGE.users, JSON.stringify(users));
    localStorage.setItem(STORAGE.rooms, JSON.stringify(rooms));
    localStorage.setItem(STORAGE.feedbacks, JSON.stringify(feedbacks));
    localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites));
}


// ==========================================
// SAFE HTML HELPERS
// ==========================================

function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
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


// ==========================================
// TOAST NOTIFICATION
// ==========================================

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


// ==========================================
// AUTHENTICATION
// ==========================================

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

    document.getElementById("studentRole")
        .classList.toggle("active", role === "student");

    document.getElementById("ownerRole")
        .classList.toggle("active", role === "owner");
}

function updateAuthUI() {
    const isRegister = authMode === "register";

    document.getElementById("authTitle").textContent =
        isRegister ? "Create Your Account" : "Welcome Back!";

    document.getElementById("authSubtitle").textContent =
        isRegister
            ? "Join StayFinder and discover your perfect home."
            : "Login to continue your accommodation journey.";

    document.getElementById("nameField")
        .classList.toggle("hidden", !isRegister);

    document.getElementById("mobileField")
        .classList.toggle("hidden", !isRegister);

    document.getElementById("name").required = isRegister;
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
    const eye = document.getElementById("passwordEye");

    if (password.type === "password") {
        password.type = "text";
        eye.className = "fa-solid fa-eye-slash";
    } else {
        password.type = "password";
        eye.className = "fa-solid fa-eye";
    }
}


// ==========================================
// REGISTER AND LOGIN
// ==========================================

document.getElementById("authForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const message = document.getElementById("authMessage");

    message.style.color = "#e05265";

    if (password.length < 6) {
        message.textContent = "Password must contain at least 6 characters.";
        return;
    }

    if (authMode === "register") {

        const name = document.getElementById("name").value.trim();
        const mobile = document.getElementById("mobile").value.trim();

        if (!name) {
            message.textContent = "Please enter your full name.";
            return;
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            message.textContent = "Enter a valid 10-digit Indian mobile number.";
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            message.textContent = "Enter a valid email address.";
            return;
        }

        const exists = users.some(user =>
            user.email === email ||
            user.mobile === mobile
        );

        if (exists) {
            message.textContent = "Email or mobile number already registered.";
            return;
        }

        users.push({
            id: Date.now(),
            name,
            email,
            mobile,
            password,
            role: currentRole
        });

        saveData();

        message.style.color = "#16a56a";
        message.textContent = "Account created successfully! Please login.";

        setTimeout(() => {
            authMode = "login";
            updateAuthUI();
            showToast("Registration successful!");
        }, 900);

        return;
    }

    const identifier = email;

    const user = users.find(u =>
        (u.email === identifier || u.mobile === identifier) &&
        u.password === password &&
        u.role === currentRole
    );

    if (!user) {
        message.textContent =
            "Incorrect details or account type. Please try again.";
        return;
    }

    loginUser(user);
});


function loginUser(user) {
    currentUser = user;

    // Demo session persistence.
    // Real applications should use secure server-side sessions.
    localStorage.setItem(STORAGE.session, JSON.stringify({
        id: user.id
    }));

    closeAuth();

    showToast("Welcome " + user.name + "!");

    updateDashboard();

    document.getElementById(
        user.role === "owner" ? "ownerDashboard" : "studentDashboard"
    ).scrollIntoView({ behavior: "smooth" });
}


function logout() {
    currentUser = null;

    localStorage.removeItem(STORAGE.session);

    document.getElementById("studentDashboard").classList.add("hidden");
    document.getElementById("ownerDashboard").classList.add("hidden");

    updateNavbar();

    showToast("You have been logged out.");
}


// ==========================================
// SESSION RESTORE
// ==========================================

function restoreSession() {
    const session = loadData(STORAGE.session, null);

    if (!session) return;

    const user = users.find(u => u.id === session.id);

    if (user) {
        currentUser = user;
        updateDashboard();
    } else {
        localStorage.removeItem(STORAGE.session);
    }
}


// ==========================================
// NAVIGATION
// ==========================================

function updateNavbar() {
    const navActions = document.getElementById("navActions");

    navActions.innerHTML = "";

    if (currentUser) {
        const account = makeElement(
            "span",
            "logged-user",
            "Hi, " + currentUser.name.split(" ")[0]
        );

        account.style.color = "white";
        account.style.alignSelf = "center";
        account.style.fontSize = "12px";

        const logoutButton = makeElement("button", "primary-btn", "Logout");
        logoutButton.onclick = logout;

        navActions.append(account, logoutButton);
    } else {
        const login = makeElement("button", "login-btn", "Login");
        login.onclick = () => showAuth("login");

        const register = makeElement("button", "primary-btn", "Register");
        register.onclick = () => showAuth("register");

        navActions.append(login, register);
    }
}

function toggleMenu() {
    document.getElementById("mainNav").classList.toggle("show");
}


// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {
    if (!currentUser) return;

    updateNavbar();

    const studentDashboard = document.getElementById("studentDashboard");
    const ownerDashboard = document.getElementById("ownerDashboard");

    studentDashboard.classList.add("hidden");
    ownerDashboard.classList.add("hidden");

    if (currentUser.role === "student") {

        studentDashboard.classList.remove("hidden");

        document.getElementById("studentName").textContent =
            currentUser.name;

        const saved = getUserFavorites();

        document.getElementById("favoriteCount").textContent = saved.length;
        document.getElementById("studentRoomCount").textContent =
            rooms.length;

    } else {

        ownerDashboard.classList.remove("hidden");

        document.getElementById("ownerName").textContent =
            currentUser.name;

        const myRooms = rooms.filter(room =>
            room.ownerEmail === currentUser.email
        );

        document.getElementById("ownerPropertyCount").textContent =
            myRooms.length;

        document.getElementById("ownerVacantCount").textContent =
            myRooms.reduce((sum, room) => sum + Number(room.vacant), 0);

        displayOwnerProperties();
    }
}


// ==========================================
// FAVOURITE ROOMS
// ==========================================

function getUserFavorites() {
    if (!currentUser) return [];

    return favorites[currentUser.id] || [];
}

function isFavorite(id) {
    return getUserFavorites().includes(Number(id));
}

function toggleFavorite(id) {
    if (!currentUser) {
        showToast("Please login to save favourite rooms.");
        showAuth("login");
        return;
    }

    if (currentUser.role !== "student") {
        showToast("Only students can save favourite rooms.");
        return;
    }

    const saved = getUserFavorites();

    if (saved.includes(Number(id))) {
        favorites[currentUser.id] = saved.filter(item => item !== Number(id));
        showToast("Removed from favourites.");
    } else {
        favorites[currentUser.id] = [...saved, Number(id)];
        showToast("Added to favourites!");
    }

    saveData();
    displayRooms(getFilteredRooms());
    updateDashboard();
}


// ==========================================
// ROOM RATINGS
// ==========================================

function getRoomReviews(roomId) {
    return feedbacks.filter(f =>
        Number(f.roomId) === Number(roomId)
    );
}

function getRoomRating(room) {
    const reviews = getRoomReviews(room.id);

    if (reviews.length === 0) {
        return Number(room.rating) || 0;
    }

    return reviews.reduce(
        (sum, review) => sum + Number(review.rating), 0
    ) / reviews.length;
}

function getStarHTML(rating) {
    const rounded = Math.round(rating);

    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}


// ==========================================
// ROOM SEARCH AND FILTERS
// ==========================================

function getFilteredRooms() {
    const query = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const propertyType = document.getElementById("propertyTypeFilter").value;
    const bed = document.getElementById("bedFilter").value;
    const ac = document.getElementById("acFilter").value;
    const food = document.getElementById("foodFilter").value;
    const electricity = document.getElementById("electricityFilter").value;
    const availability = document.getElementById("availabilityFilter").value;
    const maxRent = document.getElementById("maxRent").value;

    return rooms.filter(room => {

        const searchableText = [
            room.title,
            room.location,
            room.university,
            room.description
        ].join(" ").toLowerCase();

        const matchesSearch = !query || searchableText.includes(query);

        const matchesPropertyType =
            !propertyType || room.propertyType === propertyType;
        const matchesBed = !bed || room.bed === bed;
        const matchesAC = !ac || room.ac === ac;
        const matchesFood = !food || room.food === food;

        const matchesElectricity =
            !electricity || room.electricity === electricity;

        const matchesAvailability =
            !availability ||
            (availability === "Available"
                ? Number(room.vacant) > 0
                : Number(room.vacant) === 0);

        const matchesRent =
            !maxRent || Number(room.rent) <= Number(maxRent);

        return matchesSearch &&
            matchesPropertyType &&
            matchesBed &&
            matchesAC &&
            matchesFood &&
            matchesElectricity &&
            matchesAvailability &&
            matchesRent;
    });
}

function searchRooms() {
    displayRooms(getFilteredRooms());
}

function resetFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("propertyTypeFilter").value = "";
    document.getElementById("bedFilter").value = "";
    document.getElementById("acFilter").value = "";
    document.getElementById("foodFilter").value = "";
    document.getElementById("electricityFilter").value = "";
    document.getElementById("availabilityFilter").value = "";
    document.getElementById("maxRent").value = "";

    displayRooms(rooms);

    showToast("All filters cleared.");
}


// ==========================================
// ROOM CARD CREATION
// ==========================================

function createRoomCard(room, index) {

    const card = makeElement("article", "room-card");
    card.style.animationDelay = Math.min(index * 0.06, 0.4) + "s";

    // IMAGE
    const imageWrap = makeElement("div", "room-image-wrap");

    const image = makeElement("img");
    image.src = getRoomImage(room);
    image.alt = room.title;
    image.loading = "lazy";
    image.onclick = () => openImage(getRoomImage(room), room.title);

    image.onerror = function() {
        this.onerror = null;
        this.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900";
    };

    // VACANCY BADGE
    const badge = makeElement(
        "span",
        "availability-badge" + (room.vacant === 0 ? " full-badge" : ""),
        room.vacant > 0 ? "AVAILABLE" : "FULL"
    );

    // FAVOURITE
    const favorite = makeElement(
        "button",
        "favorite-btn" + (isFavorite(room.id) ? " active" : ""),
        isFavorite(room.id) ? "♥" : "♡"
    );

    favorite.type = "button";
    favorite.title = "Save to favourites";
    favorite.onclick = () => toggleFavorite(room.id);

    const hint = makeElement("span", "image-hint", "Click to view image");

    imageWrap.append(image, badge, favorite, hint);

    // ROOM INFORMATION
    const info = makeElement("div", "room-info");

    const titleRow = makeElement("div", "room-title-row");

    const title = makeElement("h3", "", room.title);

    const rating = makeElement("div", "rating-mini");

    const ratingValue = getRoomRating(room);
    const reviewCount = getRoomReviews(room.id).length;

    rating.textContent = ratingValue > 0
        ? getStarHTML(ratingValue) + " "
        : "☆☆☆☆☆ ";

    const ratingCount = makeElement(
        "span",
        "",
        ratingValue > 0
            ? ratingValue.toFixed(1) + (reviewCount ? " (" + reviewCount + ")" : "")
            : "New"
    );

    rating.appendChild(ratingCount);
    titleRow.append(title, rating);

    const location = makeElement(
        "p",
        "room-location",
        "📍 " + room.location + " | " + room.university
    );

    const price = makeElement("div", "room-price");

    price.textContent =
        "₹" + Number(room.rent).toLocaleString("en-IN") + " ";

    const priceSmall = makeElement("small", "", "/ month");
    price.appendChild(priceSmall);

    const features = makeElement("div", "room-features");

    const featureItems = [
        room.propertyType || "PG",
        room.bed + " Bed",
        room.ac,
        room.food === "Yes" ? "Food Included" : "No Food",
        room.electricity === "Yes" ? "Electricity Included" : "Electricity Extra"
    ];

    featureItems.forEach(item => {
        features.appendChild(makeElement("span", "feature-tag", item));
    });

    const vacancy = makeElement(
        "p",
        "vacancy-text" + (room.vacant === 0 ? " full" : ""),
        room.vacant > 0
            ? room.vacant + " rooms vacant out of " + room.total
            : "Fully occupied – No vacancy"
    );

    const description = makeElement(
        "p",
        "room-description",
        room.description
    );

    const owner = makeElement(
        "div",
        "owner-info",
        "Property Owner: " + (room.ownerName || "Owner")
    );

    const actions = makeElement("div", "room-actions");

    const contact = makeElement("a", "contact-btn");

    contact.href = "tel:" + room.contact;
    contact.textContent = "☎ Contact Owner";

    if (room.vacant <= 0) {
        contact.style.opacity = ".5";
        contact.title = "No vacant rooms currently";
    }

    const review = makeElement("button", "review-btn", "★ Review");
    review.onclick = () => {
        document.getElementById("feedbackRoom").value = String(room.id);
        document.getElementById("feedback").scrollIntoView({
            behavior: "smooth"
        });
        showToast("Selected " + room.title + " for review.");
    };

    actions.append(contact, review);

    info.append(
        titleRow,
        location,
        price,
        features,
        vacancy,
        description,
        owner,
        actions
    );

    card.append(imageWrap, info);

    return card;
}


// ==========================================
// DISPLAY ROOMS
// ==========================================

function displayRooms(list) {

    const grid = document.getElementById("roomGrid");

    grid.replaceChildren();

    document.getElementById("resultCount").textContent =
        list.length + (list.length === 1 ? " property found" : " properties found");

    document.getElementById("totalListings").textContent = rooms.length;

    document.getElementById("availableRooms").textContent =
        rooms.reduce((sum, room) => sum + Number(room.vacant), 0);

    if (list.length === 0) {

        const empty = makeElement("div", "empty-state");

        const icon = makeElement("i", "fa-solid fa-house-circle-xmark");
        const heading = makeElement("h3", "", "No properties found");
        const text = makeElement(
            "p",
            "",
            "Try another location or change your filters."
        );

        empty.append(icon, heading, text);
        grid.appendChild(empty);

        return;
    }

    list.forEach((room, index) => {
        grid.appendChild(createRoomCard(room, index));
    });

    populateFeedbackRooms();
}


// ==========================================
// OWNER PROPERTY FORM
// ==========================================

document.getElementById("propertyForm").addEventListener("submit", function(e) {

    e.preventDefault();

    if (!currentUser || currentUser.role !== "owner") {
        showToast("Please login as a room owner.");
        return;
    }

    const total = Number(document.getElementById("totalRooms").value);
    const vacant = Number(document.getElementById("vacantRooms").value);

    const rent = Number(document.getElementById("propertyRent").value);

    const contact = document.getElementById("ownerContact").value.trim();

    const imageInput = document.getElementById("propertyImage").value.trim();

    if (total < 1 || vacant < 0 || vacant > total) {
        showToast("Vacant rooms cannot exceed total rooms.");
        return;
    }

    if (rent <= 0) {
        showToast("Enter a valid monthly rent.");
        return;
    }

    if (!/^[6-9]\d{9}$/.test(contact)) {
        showToast("Enter a valid 10-digit mobile number.");
        return;
    }

    if (imageInput && !validImage(imageInput)) {
        showToast("Please enter a valid HTTP or HTTPS image URL.");
        return;
    }

    const room = {
        id: Date.now(),
        title: document.getElementById("propertyTitle").value.trim(),
        location: document.getElementById("propertyLocation").value.trim(),
        university: document.getElementById("propertyUniversity").value.trim(),
        propertyType: document.getElementById("propertyType").value,
        rent,
        bed: document.getElementById("propertyBed").value,
        ac: document.getElementById("propertyAC").value,
        food: document.getElementById("propertyFood").value,
        electricity: document.getElementById("propertyElectricity").value,
        total,
        vacant,
        contact,
        ownerName: currentUser.name,
        ownerEmail: currentUser.email,
        image: imageInput || getRoomImage({}),
        description: document.getElementById("propertyDescription").value.trim(),
        rating: 0
    };

    rooms.unshift(room);

    saveData();

    this.reset();

    displayRooms(getFilteredRooms());
    updateDashboard();

    showToast("Your property has been published successfully!");

    document.getElementById("rooms").scrollIntoView({
        behavior: "smooth"
    });
});


// ==========================================
// OWNER PROPERTY MANAGEMENT
// ==========================================

function displayOwnerProperties() {

    const list = document.getElementById("ownerProperties");

    list.replaceChildren();

    if (!currentUser) return;

    const myRooms = rooms.filter(room =>
        room.ownerEmail === currentUser.email
    );

    if (myRooms.length === 0) {
        list.appendChild(makeElement(
            "p",
            "",
            "You haven't published any properties yet."
        ));
        return;
    }

    myRooms.forEach(room => {

        const item = makeElement("div", "owner-property-item");

        const title = makeElement("h4", "", room.title);

        const location = makeElement(
            "p",
            "",
            "📍 " + room.location
        );

        const rent = makeElement(
            "p",
            "",
            "Rent: ₹" + Number(room.rent).toLocaleString("en-IN") + "/month"
        );

        const availability = makeElement(
            "p",
            "",
            "Vacant: " + room.vacant + " / " + room.total
        );

        const deleteButton = makeElement(
            "button",
            "delete-btn",
            "Delete Listing"
        );

        deleteButton.onclick = () => deleteProperty(room.id);

        item.append(title, location, rent, availability, deleteButton);

        list.appendChild(item);
    });
}

function deleteProperty(id) {

    if (!currentUser || currentUser.role !== "owner") return;

    const room = rooms.find(r => r.id === Number(id));

    if (!room || room.ownerEmail !== currentUser.email) {
        showToast("You cannot delete this property.");
        return;
    }

    if (!confirm("Are you sure you want to delete this property?")) {
        return;
    }

    rooms = rooms.filter(r => r.id !== Number(id));

    feedbacks = feedbacks.filter(f => Number(f.roomId) !== Number(id));

    Object.keys(favorites).forEach(userId => {
        favorites[userId] = favorites[userId].filter(
            item => Number(item) !== Number(id)
        );
    });

    saveData();

    displayRooms(getFilteredRooms());
    displayFeedback();
    updateDashboard();

    showToast("Property deleted successfully.");
}


// ==========================================
// IMAGE PREVIEW
// ==========================================

function openImage(src, title) {

    document.getElementById("largeImage").src = src;

    document.getElementById("imageCaption").textContent = title;

    document.getElementById("imageModal").classList.remove("hidden");

    document.body.style.overflow = "hidden";
}

function closeImage() {

    document.getElementById("imageModal").classList.add("hidden");

    document.body.style.overflow = "";
}

document.addEventListener("keydown", function(e) {

    if (e.key === "Escape") {
        closeImage();
        closeAuth();
    }

});


// ==========================================
// STAR RATING PICKER
// ==========================================

document.querySelectorAll("#ratingPicker button").forEach(button => {

    button.addEventListener("click", function() {

        selectedRating = Number(this.dataset.rating);

        document.getElementById("feedbackRating").value = selectedRating;

        updateStarPicker();
    });

    button.addEventListener("mouseenter", function() {
        updateStarPicker(Number(this.dataset.rating));
    });

});

document.getElementById("ratingPicker").addEventListener("mouseleave", function() {
    updateStarPicker();
});

function updateStarPicker(hoverRating = 0) {

    const rating = hoverRating || selectedRating;

    document.querySelectorAll("#ratingPicker button").forEach(button => {

        const number = Number(button.dataset.rating);

        button.classList.toggle("active", number <= rating);

    });
}


// ==========================================
// FEEDBACK ROOM SELECT
// ==========================================

function populateFeedbackRooms() {

    const select = document.getElementById("feedbackRoom");

    const previous = select.value;

    select.replaceChildren();

    const defaultOption = makeElement(
        "option",
        "",
        "Select Room to Rate"
    );

    defaultOption.value = "";

    select.appendChild(defaultOption);

    rooms.forEach(room => {

        const option = makeElement(
            "option",
            "",
            room.title + " - " + room.location
        );

        option.value = String(room.id);

        select.appendChild(option);
    });

    if (rooms.some(room => String(room.id) === previous)) {
        select.value = previous;
    }
}


// ==========================================
// SUBMIT FEEDBACK
// ==========================================

document.getElementById("feedbackForm").addEventListener("submit", function(e) {

    e.preventDefault();

    if (!currentUser || currentUser.role !== "student") {
        showToast("Please login as a student to submit feedback.");
        showAuth("login");
        return;
    }

    const roomId = Number(document.getElementById("feedbackRoom").value);

    const rating = Number(document.getElementById("feedbackRating").value);

    const message = document.getElementById("feedbackText").value.trim();

    const room = rooms.find(r => Number(r.id) === roomId);

    if (!room) {
        showToast("Please select a valid property.");
        return;
    }

    if (rating < 1 || rating > 5) {
        showToast("Please select a star rating.");
        return;
    }

    if (!message) {
        showToast("Please write your feedback.");
        return;
    }

    // One review per student per room in this prototype
    const existingReview = feedbacks.find(f =>
        f.roomId === roomId && f.userId === currentUser.id
    );

    if (existingReview) {
        existingReview.rating = rating;
        existingReview.message = message;
        existingReview.date = new Date().toLocaleDateString("en-IN");

        showToast("Your review has been updated!");
    } else {

        feedbacks.unshift({
            id: Date.now(),
            roomId,
            userId: currentUser.id,
            name: currentUser.name,
            rating,
            message,
            date: new Date().toLocaleDateString("en-IN")
        });

        showToast("Thank you for your review!");
    }

    saveData();

    this.reset();

    selectedRating = 0;
    updateStarPicker();

    displayFeedback();
    displayRooms(getFilteredRooms());
});


// ==========================================
// DISPLAY FEEDBACK
// ==========================================

function displayFeedback() {

    const list = document.getElementById("feedbackList");

    list.replaceChildren();

    if (feedbacks.length === 0) {

        list.appendChild(makeElement(
            "p",
            "",
            "No reviews yet. Be the first student to share an experience!"
        ));

        return;
    }

    feedbacks.slice(0, 12).forEach(review => {

        const room = rooms.find(r =>
            Number(r.id) === Number(review.roomId)
        );

        const card = makeElement("div", "feedback-item");

        const name = makeElement("h4", "", review.name);

        const date = makeElement(
            "small",
            "",
            review.date || ""
        );

        const stars = makeElement(
            "div",
            "stars",
            getStarHTML(review.rating)
        );

        const roomName = makeElement(
            "small",
            "",
            room ? "Room: " + room.title : "Property review"
        );

        const message = makeElement(
            "p",
            "",
            review.message
        );

        card.append(name, date, stars, roomName, message);

        list.appendChild(card);
    });
}


// ==========================================
// INITIALIZE WEBSITE
// ==========================================

function initializeWebsite() {

    displayRooms(rooms);

    displayFeedback();

    populateFeedbackRooms();

    restoreSession();

    updateNavbar();

    updateStarPicker();

}

initializeWebsite();
