// ===============================
// STUDENT ASSIGNMENT TRACKER
// ===============================

let allAssignments = [];
let currentFilter = "all";


// Load assignments when page opens
document.addEventListener("DOMContentLoaded", () => {
    loadAssignments();
});


// ===============================
// ADD ASSIGNMENT
// ===============================

async function addAssignment() {

    const subject = document.getElementById("subject").value.trim();
    const assignment = document.getElementById("assignment").value.trim();
    const deadline = document.getElementById("deadline").value;

    if (!subject || !assignment || !deadline) {
        alert("Please fill all fields!");
        return;
    }

    try {

        const response = await fetch("/api/assignments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                subject: subject,
                assignment: assignment,
                deadline: deadline
            })
        });

        if (!response.ok) {
            throw new Error("Failed to add assignment");
        }

        alert("Assignment added successfully! 🎉");

        document.getElementById("subject").value = "";
        document.getElementById("assignment").value = "";
        document.getElementById("deadline").value = "";

        loadAssignments();

    } catch (error) {

        console.error("Error:", error);

        alert("Error adding assignment. Check if your server is running.");
    }
}


// ===============================
// LOAD ASSIGNMENTS
// ===============================

async function loadAssignments() {

    try {

        const response = await fetch("/api/assignments");

        if (!response.ok) {
            throw new Error("Failed to load assignments");
        }

        const assignments = await response.json();

        allAssignments = assignments;

        updateDashboard();
        displayAssignments();

    } catch (error) {

        console.error("Error loading assignments:", error);

        document.getElementById("assignmentList").innerHTML = `
            <div class="empty-message">
                ⚠️ Unable to load assignments.
            </div>
        `;
    }
}


// ===============================
// DASHBOARD
// ===============================

function updateDashboard() {

    const total = allAssignments.length;

    const completed = allAssignments.filter(
        item => item.completed
    ).length;

    const pending = total - completed;

    const dueSoon = allAssignments.filter(item => {

        if (item.completed) {
            return false;
        }

        return isDueSoon(item.deadline);

    }).length;


    document.getElementById("totalCount").textContent = total;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("dueSoonCount").textContent = dueSoon;


    // Progress
    let percentage = 0;

    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }

    document.getElementById("progressPercentage").textContent =
        percentage + "%";

    document.getElementById("progressFill").style.width =
        percentage + "%";


    if (total === 0) {

        document.getElementById("progressText").textContent =
            "Start adding assignments to track your progress!";

    } else {

        document.getElementById("progressText").textContent =
            `${completed} of ${total} assignments completed`;

    }


    updateTodayFocus();
}


// ===============================
// DUE DATE FUNCTIONS
// ===============================

function getDaysRemaining(deadline) {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(deadline + "T00:00:00");

    dueDate.setHours(0, 0, 0, 0);

    const difference =
        dueDate.getTime() - today.getTime();

    return Math.ceil(
        difference / (1000 * 60 * 60 * 24)
    );
}


function isDueSoon(deadline) {

    const days = getDaysRemaining(deadline);

    return days >= 0 && days <= 3;
}


function isOverdue(deadline) {

    return getDaysRemaining(deadline) < 0;
}


function getDeadlineText(deadline) {

    const days = getDaysRemaining(deadline);

    if (days < 0) {

        const overdueDays = Math.abs(days);

        return `⚠️ Overdue by ${overdueDays} day${overdueDays === 1 ? "" : "s"}`;

    }

    if (days === 0) {
        return "🔴 Due Today";
    }

    if (days === 1) {
        return "🔥 Due Tomorrow";
    }

    if (days <= 3) {
        return `🟠 Due in ${days} days`;
    }

    return `📅 ${formatDate(deadline)}`;
}


// Format date nicely
function formatDate(dateString) {

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ===============================
// TODAY'S FOCUS
// ===============================

function updateTodayFocus() {

    const focusElement = document.getElementById("todayFocus");

    const pendingAssignments = allAssignments
        .filter(item => !item.completed)
        .sort((a, b) => {

            return new Date(a.deadline) -
                   new Date(b.deadline);

        });


    if (pendingAssignments.length === 0) {

        focusElement.innerHTML = `
            🎉 <strong>All caught up!</strong>
            <br>
            You have no pending assignments.
        `;

        return;
    }


    const focus = pendingAssignments[0];

    const days = getDaysRemaining(focus.deadline);

    let urgency = "";

    if (days < 0) {
        urgency = "⚠️ This assignment is overdue!";
    } else if (days === 0) {
        urgency = "🔴 This assignment is due today!";
    } else if (days <= 3) {
        urgency = "🔥 This one needs your attention soon!";
    } else {
        urgency = "✨ You're on track!";
    }


    focusElement.innerHTML = `
        <strong>${escapeHTML(focus.subject)}</strong>
        <br>
        ${escapeHTML(focus.assignment)}
        <br><br>
        📅 ${formatDate(focus.deadline)}
        <br>
        ${urgency}
    `;
}


// ===============================
// DISPLAY ASSIGNMENTS
// ===============================

function displayAssignments() {

    const list = document.getElementById("assignmentList");

    const searchText =
        document.getElementById("searchInput").value
            .toLowerCase()
            .trim();


    let filtered = [...allAssignments];


    // FILTER
    if (currentFilter === "pending") {

        filtered = filtered.filter(
            item => !item.completed
        );

    } else if (currentFilter === "completed") {

        filtered = filtered.filter(
            item => item.completed
        );

    } else if (currentFilter === "soon") {

        filtered = filtered.filter(
            item => !item.completed &&
                    isDueSoon(item.deadline)
        );
    }


    // SEARCH
    if (searchText) {

        filtered = filtered.filter(item =>

            item.subject.toLowerCase().includes(searchText) ||

            item.assignment.toLowerCase().includes(searchText)

        );
    }


    // SORT
    const sortType =
        document.getElementById("sortSelect").value;


    if (sortType === "deadline") {

        filtered.sort((a, b) =>
            new Date(a.deadline) -
            new Date(b.deadline)
        );

    } else if (sortType === "deadline-late") {

        filtered.sort((a, b) =>
            new Date(b.deadline) -
            new Date(a.deadline)
        );

    } else if (sortType === "subject") {

        filtered.sort((a, b) =>
            a.subject.localeCompare(b.subject)
        );

    } else if (sortType === "status") {

        filtered.sort((a, b) =>
            Number(a.completed) -
            Number(b.completed)
        );
    }


    // EMPTY RESULT
    if (filtered.length === 0) {

        list.innerHTML = `
            <div class="empty-message">
                📭 No assignments found.
            </div>
        `;

        return;
    }


    // CREATE CARDS
    list.innerHTML = "";


    filtered.forEach(item => {

        const div = document.createElement("div");

        div.className = "assignment-card";


        let statusClass = "status-pending";
        let statusText = "⏳ Pending";


        if (item.completed) {

            statusClass = "status-completed";
            statusText = "✅ Completed";

        } else if (isOverdue(item.deadline)) {

            statusClass = "status-urgent";
            statusText = "⚠️ Overdue";

        } else if (isDueSoon(item.deadline)) {

            statusClass = "status-urgent";
            statusText = "🔥 Due Soon";
        }


        div.innerHTML = `

            <div class="assignment-top">

                <div class="assignment-subject">
                    ${escapeHTML(item.subject)}
                </div>

                <span class="status-badge ${statusClass}">
                    ${statusText}
                </span>

            </div>


            <div class="assignment-name">
                ${escapeHTML(item.assignment)}
            </div>


            <div class="assignment-deadline">
                ${getDeadlineText(item.deadline)}
            </div>


            <div class="card-actions">

                ${
                    !item.completed
                    ?
                    `
                    <button
                        class="complete-button"
                        onclick="completeAssignment('${item._id}')">
                        ✓ Mark Completed
                    </button>
                    `
                    :
                    ""
                }

                <button
                    class="delete-button"
                    onclick="deleteAssignment('${item._id}')">
                    🗑 Delete
                </button>

            </div>

        `;


        list.appendChild(div);

    });
}


// ===============================
// SEARCH
// ===============================

function filterAssignments() {

    displayAssignments();

}


// ===============================
// FILTER BUTTONS
// ===============================

function setFilter(filter, button) {

    currentFilter = filter;


    document
        .querySelectorAll(".filter-button")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    button.classList.add("active");


    displayAssignments();

}


// ===============================
// SORT
// ===============================

function sortAssignments() {

    displayAssignments();

}


// ===============================
// MARK COMPLETED
// ===============================

async function completeAssignment(id) {

    try {

        const response = await fetch(
            `/api/assignments/${id}`,
            {
                method: "PUT"
            }
        );


        if (!response.ok) {
            throw new Error("Failed to complete assignment");
        }


        await loadAssignments();


    } catch (error) {

        console.error(
            "Error completing assignment:",
            error
        );

        alert("Could not mark assignment as completed.");

    }
}


// ===============================
// DELETE ASSIGNMENT
// ===============================

async function deleteAssignment(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this assignment?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response = await fetch(
            `/api/assignments/${id}`,
            {
                method: "DELETE"
            }
        );


        if (!response.ok) {
            throw new Error("Failed to delete assignment");
        }


        await loadAssignments();


    } catch (error) {

        console.error(
            "Error deleting assignment:",
            error
        );

        alert("Could not delete assignment.");

    }
}


// ===============================
// SECURITY HELPER
// ===============================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}