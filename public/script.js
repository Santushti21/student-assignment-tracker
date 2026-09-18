// Load assignments when the page opens
document.addEventListener("DOMContentLoaded", () => {
    loadAssignments();
});

// Add a new assignment
async function addAssignment() {
    const subject = document.getElementById("subject").value;
    const assignment = document.getElementById("assignment").value;
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

        alert("Assignment added successfully!");

        document.getElementById("subject").value = "";
        document.getElementById("assignment").value = "";
        document.getElementById("deadline").value = "";

        loadAssignments();

    } catch (error) {
        console.error("Error:", error);
        alert("Error adding assignment. Check if your server is running.");
    }
}

// Load all assignments
async function loadAssignments() {
    try {
        const response = await fetch("/api/assignments");
        const assignments = await response.json();

        const list = document.getElementById("assignmentList");
        list.innerHTML = "";

        assignments.forEach(item => {
            const div = document.createElement("div");

            div.innerHTML = `
                <p>
                    <strong>${item.subject}</strong> - ${item.assignment}
                    <br>
                    Deadline: ${item.deadline}
                    <br>
                    Status: ${item.completed ? "Completed" : "Pending"}
                </p>
                <button onclick="completeAssignment('${item._id}')">
                    Mark Completed
                </button>
                <button onclick="deleteAssignment('${item._id}')">
                    Delete
                </button>
                <hr>
            `;

            list.appendChild(div);
        });

    } catch (error) {
        console.error("Error loading assignments:", error);
    }
}

// Mark assignment as completed
async function completeAssignment(id) {
    try {
        await fetch(`/api/assignments/${id}`, {
            method: "PUT"
        });

        loadAssignments();

    } catch (error) {
        console.error("Error completing assignment:", error);
    }
}

// Delete assignment
async function deleteAssignment(id) {
    try {
        await fetch(`/api/assignments/${id}`, {
            method: "DELETE"
        });

        loadAssignments();

    } catch (error) {
        console.error("Error deleting assignment:", error);
    }
}