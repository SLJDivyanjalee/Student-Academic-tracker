/* ==========================================================================
HELP feature
   ========================================================================== */

(function () {
    "use strict";

    var COMMON_SECTIONS = [
        {
            icon: "bi-compass",
            title: "Finding your way around",
            html:
                "<p>The left sidebar is your main menu — it links to every page: Dashboard, Calendar, Tasks, Assignments, Exams, Study Sessions, Attendance, Study Planner, Progress and Settings.</p>" +
                "<p>On smaller screens, tap the menu icon in the top bar to open the sidebar, and tap outside it or the close icon to hide it again.</p>" +
                "<p>The bell icon in the top bar opens your notifications panel, and your profile picture/name in the top bar takes you to Settings.</p>"
        },
        {
            icon: "bi-search",
            title: "Search and filters",
            html:
                "<p>Most list pages (Tasks, Assignments &amp; Exams, Attendance log) have a search icon in the top-right of the card — click it to type and instantly filter the list.</p>" +
                "<p>Filter bars let you narrow items by subject, status, urgency or date range. Clearing a filter (choosing the blank/\"All\" option) shows every item again.</p>"
        }
    ];

    var HELP_CONTENT = {
        "dashboard.html": {
            icon: "bi-grid-fill",
            title: "Dashboard help",
            subtitle: "Your daily overview at a glance",
            sections: [
                {
                    icon: "bi-info-circle",
                    title: "What this page shows",
                    html:
                        "<p>The Dashboard summarizes your day: quick stats (assignments, exams, sessions, completed tasks), your mini calendar with upcoming events, and a snapshot of your recent progress.</p>"
                },
                {
                    icon: "bi-list-check",
                    title: "Getting started checklist",
                    html:
                        "<p>New here? The \"Getting Started\" card walks you through the first few things to set up, such as adding subjects and your timetable. Complete each step and it will be checked off automatically as you use the app.</p>"
                },
                {
                    icon: "bi-alarm",
                    title: "Study session timer",
                    html:
                        "<p>Use the timer to run a focused study session:</p>" +
                        "<ul>" +
                        "<li>Enter hours / minutes / seconds for how long you want to study.</li>" +
                        "<li>Pick an alarm sound and preview it if you like, then press <strong>Set</strong> to start the countdown.</li>" +
                        "<li>Use <strong>Reset</strong> to stop and clear the timer at any point.</li>" +
                        "</ul>" +
                        "<div class='help-tip'><i class='bi bi-lightbulb'></i><span>Completed sessions are automatically added to your Study Sessions history and count toward your Progress stats.</span></div>"
                },
                {
                    icon: "bi-calendar3",
                    title: "Mini calendar & events",
                    html:
                        "<p>The calendar widget highlights days with tasks, assignments, exams or planned study sessions. Click a date to see that day's events listed beside it, or click an arrow to move between months.</p>"
                }
            ]
        },

        "calendar.html": {
            icon: "bi-calendar3",
            title: "Calendar help",
            subtitle: "See everything scheduled, by day",
            sections: [
                {
                    icon: "bi-info-circle",
                    title: "How to read the calendar",
                    html:
                        "<p>Every task, assignment, exam and planned study session you've added shows up here on its due or scheduled date, so you get one combined view of your workload.</p>"
                },
                {
                    icon: "bi-arrow-left-right",
                    title: "Navigating months",
                    html:
                        "<p>Use the left/right arrows above the calendar grid to move to the previous or next month. Click any date to view that day's items in the panel beside the calendar.</p>"
                },
                {
                    icon: "bi-dot",
                    title: "Understanding the markers",
                    html:
                        "<p>Days with a colored dot or highlight have something due or planned. Click into the day to see exactly what it is and jump to that item's page if you need to edit it.</p>"
                }
            ]
        },

        "tasks.html": {
            icon: "bi-list-check",
            title: "Tasks help",
            subtitle: "Track your to-dos from start to finish",
            sections: [
                {
                    icon: "bi-plus-circle",
                    title: "Adding a task",
                    html:
                        "<p>Click <strong>Add Task</strong> to open the entry form, then fill in:</p>" +
                        "<ul>" +
                        "<li><strong>Task name</strong> — a short description of what needs doing.</li>" +
                        "<li><strong>Subject</strong> — pick from your existing subjects, or type a new one.</li>" +
                        "<li><strong>Due date</strong> — when it needs to be finished.</li>" +
                        "<li><strong>Urgency</strong> — how high a priority it is.</li>" +
                        "</ul>" +
                        "<p>Save it and the task appears in your list right away.</p>"
                },
                {
                    icon: "bi-pencil-square",
                    title: "Editing or completing a task",
                    html:
                        "<p>Click a task to open the edit form and update its name, subject, due date or urgency. Use the checkbox or status control on the task row to mark it complete once you're done.</p>"
                },
                {
                    icon: "bi-funnel",
                    title: "Filtering and searching",
                    html:
                        "<p>Use the filter bar to narrow tasks by due date, status, subject or urgency, or use the search icon to find a task by name. Filters can be combined for a very specific view.</p>"
                }
            ]
        },

        "assignments-exams.html": {
            icon: "bi-journal-text",
            title: "Assignments & Exams help",
            subtitle: "Keep every deadline in one place",
            sections: [
                {
                    icon: "bi-toggle2-on",
                    title: "Switching between Assignments and Exams",
                    html:
                        "<p>Use the tabs at the top of the page to switch between your Assignments list and your Exams list — the same page handles both, so the add/edit form adapts to whichever tab you're on.</p>"
                },
                {
                    icon: "bi-plus-circle",
                    title: "Adding an entry",
                    html:
                        "<p>Click <strong>Add</strong> and fill in the name, subject, type (assignment or exam), and the due/exam date. Save it and it will appear in the list and on your Calendar and Dashboard automatically.</p>"
                },
                {
                    icon: "bi-pencil-square",
                    title: "Editing an entry",
                    html:
                        "<p>Click any item in the list to open its edit form and change its name, subject, type or date.</p>"
                },
                {
                    icon: "bi-funnel",
                    title: "Filtering and searching",
                    html:
                        "<p>Narrow the list by subject or a date range using the filter bar, or use the search icon to look up an item by name.</p>"
                }
            ]
        },

        "attendance.html": {
            icon: "bi-clipboard2-check",
            title: "Attendance help",
            subtitle: "Log lectures and track your attendance %",
            sections: [
                {
                    icon: "bi-calendar-plus",
                    title: "Setting up your timetable",
                    html:
                        "<p>Click <strong>Add Lecture</strong> to add a recurring lecture to your weekly timetable: choose the subject, day of week, and start/end time. This timetable is what powers your \"Today's Lectures\" quick-mark list.</p>" +
                        "<div class='help-tip'><i class='bi bi-lightbulb'></i><span>If a new lecture's time overlaps an existing one, you'll be asked whether to keep the existing lecture or replace it with the new one.</span></div>"
                },
                {
                    icon: "bi-check2-square",
                    title: "Quick-marking today's lectures",
                    html:
                        "<p>Lectures scheduled for today appear in the \"Today's Lectures\" card. Tap Present or Absent next to each one to log it instantly — no need to fill in a separate form for everyday marking.</p>"
                },
                {
                    icon: "bi-graph-up",
                    title: "Per-subject attendance",
                    html:
                        "<p>The subject list shows your running attendance percentage for each subject, so you can see at a glance which ones need more attention.</p>"
                },
                {
                    icon: "bi-table",
                    title: "Attendance log & search",
                    html:
                        "<p>The attendance log lists every recorded lecture with its date and status. Use the search icon above the table to quickly find a specific entry.</p>"
                }
            ]
        },

        "studyplanner.html": {
            icon: "bi-calendar2-week",
            title: "Study Planner help",
            subtitle: "An auto-generated weekly study schedule",
            sections: [
                {
                    icon: "bi-magic",
                    title: "How the schedule is built",
                    html:
                        "<p>The planner automatically packs study sessions into your week based on your upcoming tasks, assignments and exams, fitted around the working hours you've set and any lectures on your timetable.</p>"
                },
                {
                    icon: "bi-clock",
                    title: "Setting your working hours",
                    html:
                        "<p>Use the day-start and day-end fields to tell the planner when you're generally available to study, then click <strong>Apply</strong> so future schedules respect that window.</p>"
                },
                {
                    icon: "bi-arrow-repeat",
                    title: "Regenerating a week",
                    html:
                        "<p>Click <strong>Regenerate Week</strong> if you want a fresh schedule — you'll be asked whether to build it with more rest breaks between sessions or packed with no rest, depending on how intensely you want to study that week.</p>"
                },
                {
                    icon: "bi-arrows-move",
                    title: "Moving a session",
                    html:
                        "<p>Click a session in the table to open the move dialog, then pick a new day and time slot for it if the auto-generated placement doesn't suit you.</p>"
                },
                {
                    icon: "bi-palette",
                    title: "Reading the legend",
                    html:
                        "<p>Each subject gets its own color in the schedule, shown in the legend below the table, so you can see your study balance across subjects at a glance.</p>"
                }
            ]
        },

        "progress.html": {
            icon: "bi-graph-up-arrow",
            title: "Progress help",
            subtitle: "Your study stats and trends over time",
            sections: [
                {
                    icon: "bi-bar-chart",
                    title: "The charts",
                    html:
                        "<p>This page turns your activity into visuals:</p>" +
                        "<ul>" +
                        "<li><strong>Study hours chart</strong> — how much time you've studied over recent days/weeks.</li>" +
                        "<li><strong>Attendance chart</strong> — your attendance trend across subjects.</li>" +
                        "<li><strong>Productivity chart</strong> — how consistently you're completing tasks and sessions.</li>" +
                        "</ul>" +
                        "<p>All charts update automatically as you log study sessions, attendance and completed tasks elsewhere in the app.</p>"
                },
                {
                    icon: "bi-fire",
                    title: "Your streak",
                    html:
                        "<p>The streak card counts consecutive days you've stayed active in the app (studying, completing tasks, or marking attendance). The weekly view shows which days kept the streak going, and milestones mark notable streak lengths.</p>"
                },
                {
                    icon: "bi-list-ul",
                    title: "Recent progress list",
                    html:
                        "<p>The progress list below the charts shows a running feed of your recent completed items, so you can quickly review what you've gotten done.</p>"
                }
            ]
        },

        "settings.html": {
            icon: "bi-gear",
            title: "Settings help",
            subtitle: "Manage your profile, security and data",
            sections: [
                {
                    icon: "bi-person-circle",
                    title: "Editing your profile",
                    html:
                        "<p>Update your name, email, faculty and semester in the profile card, then click <strong>Save</strong>. Click your avatar to upload a new profile picture.</p>"
                },
                {
                    icon: "bi-shield-lock",
                    title: "Changing your password",
                    html:
                        "<p>Enter your current password along with a new password (and confirmation) in the security section, then save to update it. You'll need your current password to authorize the change.</p>"
                },
                {
                    icon: "bi-bell",
                    title: "Notifications & theme",
                    html:
                        "<p>Use the toggles on this page to turn notifications on or off, and to switch between light and dark theme for the whole app.</p>"
                },
                {
                    icon: "bi-exclamation-triangle",
                    title: "Reset data or delete account",
                    html:
                        "<p>The danger zone lets you wipe your app data (tasks, sessions, attendance, etc.) while keeping your account, or permanently delete your account entirely. Both actions ask you to confirm — and confirm with your password — before anything happens, since they can't be undone.</p>"
                }
            ]
        }
    };

    /* ---------------------------------------------------------------- */
    /* Build widget markup                                               */
    /* ---------------------------------------------------------------- */

    function currentPageKey() {
        var path = window.location.pathname.split("/").pop();
        if (!path) path = "dashboard.html";
        return HELP_CONTENT[path] ? path : null;
    }

    function buildSectionsHtml(sections) {
        return sections.map(function (section, i) {
            return (
                '<div class="help-section" data-index="' + i + '">' +
                    '<button type="button" class="help-section-toggle" aria-expanded="false">' +
                        '<i class="bi ' + section.icon + ' help-section-icon"></i>' +
                        '<span class="help-section-label">' + section.title + '</span>' +
                        '<i class="bi bi-chevron-down help-chevron"></i>' +
                    '</button>' +
                    '<div class="help-section-content">' + section.html + '</div>' +
                '</div>'
            );
        }).join("");
    }

    function init() {
        var pageKey = currentPageKey();
        var pageData = pageKey ? HELP_CONTENT[pageKey] : {
            icon: "bi-question-circle",
            title: "Help",
            subtitle: "Guidance for using LevelUp",
            sections: []
        };

        var allSections = pageData.sections.concat(COMMON_SECTIONS);

        // Floating button
        var fab = document.createElement("button");
        fab.type = "button";
        fab.className = "help-fab";
        fab.setAttribute("aria-label", "Open help");
        fab.setAttribute("aria-haspopup", "dialog");
        fab.innerHTML = '<span class="help-fab-ping"></span><i class="bi bi-question-lg"></i>';

        // Overlay
        var overlay = document.createElement("div");
        overlay.className = "help-overlay";

        // Panel
        var panel = document.createElement("div");
        panel.className = "help-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-label", pageData.title);
        panel.innerHTML =
            '<div class="help-panel-header">' +
                '<div class="help-panel-icon"><i class="bi ' + pageData.icon + '"></i></div>' +
                '<div class="help-panel-titles">' +
                    '<h5>' + pageData.title + '</h5>' +
                    '<small>' + pageData.subtitle + '</small>' +
                '</div>' +
                '<button type="button" class="help-panel-close" aria-label="Close help"><i class="bi bi-x-lg"></i></button>' +
            '</div>' +
            '<div class="help-tabs" role="tablist">' +
                '<button type="button" class="help-tab active" data-tab="guide" role="tab" aria-selected="true"><i class="bi bi-book"></i> Guide</button>' +
                '<button type="button" class="help-tab" data-tab="ai" role="tab" aria-selected="false"><i class="bi bi-stars"></i> Ask AI</button>' +
            '</div>' +
            '<div class="help-panel-body">' +
                '<div class="help-tab-pane active" data-pane="guide">' +
                    '<p class="help-intro">Quick guidance for what\'s on this page — how to enter information and where to find your results. Tap a topic to expand it.</p>' +
                    '<div class="help-search">' +
                        '<i class="bi bi-search"></i>' +
                        '<input type="text" placeholder="Search help topics..." aria-label="Search help topics">' +
                    '</div>' +
                    '<div class="help-sections">' + buildSectionsHtml(allSections) + '</div>' +
                    '<div class="help-no-results"><i class="bi bi-emoji-neutral"></i><br>No matching help topics found.</div>' +
                '</div>' +
                '<div class="help-tab-pane help-ai-pane" data-pane="ai">' +
                    '<p class="help-intro">Ask how to use LevelUp, or get advice based on your own tasks, deadlines and attendance.</p>' +
                    '<div class="help-ai-messages"></div>' +
                    '<div class="help-ai-suggestions">' +
                        '<button type="button" class="help-ai-chip">How do I add a task?</button>' +
                        '<button type="button" class="help-ai-chip">What should I focus on this week?</button>' +
                        '<button type="button" class="help-ai-chip">How is my attendance?</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="help-panel-footer help-panel-footer-guide">Still stuck? Check the relevant page again or reach out to support.</div>' +
            '<div class="help-ai-inputbar">' +
                '<input type="text" class="help-ai-input" placeholder="Type your question..." aria-label="Ask the AI assistant" maxlength="500">' +
                '<button type="button" class="help-ai-send" aria-label="Send question"><i class="bi bi-send-fill"></i></button>' +
            '</div>';

        document.body.appendChild(fab);
        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        var searchInput = panel.querySelector(".help-search input");
        var noResults = panel.querySelector(".help-no-results");
        var sectionEls = Array.prototype.slice.call(panel.querySelectorAll(".help-section"));

        /* ---- Tab switching ---- */
        var tabButtons = Array.prototype.slice.call(panel.querySelectorAll(".help-tab"));
        var panes = Array.prototype.slice.call(panel.querySelectorAll(".help-tab-pane"));
        var footerGuide = panel.querySelector(".help-panel-footer-guide");
        var aiInputBar = panel.querySelector(".help-ai-inputbar");

        function setActiveTab(name) {
            tabButtons.forEach(function (btn) {
                var active = btn.getAttribute("data-tab") === name;
                btn.classList.toggle("active", active);
                btn.setAttribute("aria-selected", active ? "true" : "false");
            });
            panes.forEach(function (pane) {
                pane.classList.toggle("active", pane.getAttribute("data-pane") === name);
            });
            footerGuide.style.display = name === "guide" ? "" : "none";
            aiInputBar.style.display = name === "ai" ? "" : "none";
            if (name === "ai") {
                setTimeout(function () { aiInput.focus(); }, 200);
            }
        }

        tabButtons.forEach(function (btn) {
            btn.addEventListener("click", function () { setActiveTab(btn.getAttribute("data-tab")); });
        });
        aiInputBar.style.display = "none";

        /* ---- Ask AI chat ---- */
        var aiMessages = panel.querySelector(".help-ai-messages");
        var aiInput = panel.querySelector(".help-ai-input");
        var aiSendBtn = panel.querySelector(".help-ai-send");
        var aiChips = Array.prototype.slice.call(panel.querySelectorAll(".help-ai-chip"));
        var aiBusy = false;

        function appendMessage(role, text) {
            var row = document.createElement("div");
            row.className = "help-ai-msg help-ai-msg-" + role;
            var bubble = document.createElement("div");
            bubble.className = "help-ai-bubble";
            bubble.textContent = text;
            row.appendChild(bubble);
            aiMessages.appendChild(row);
            aiMessages.scrollTop = aiMessages.scrollHeight;
            return bubble;
        }

        function appendTyping() {
            var row = document.createElement("div");
            row.className = "help-ai-msg help-ai-msg-assistant help-ai-typing-row";
            row.innerHTML = '<div class="help-ai-bubble help-ai-typing"><span></span><span></span><span></span></div>';
            aiMessages.appendChild(row);
            aiMessages.scrollTop = aiMessages.scrollHeight;
            return row;
        }

        function sendQuestion(question) {
            question = (question || "").trim();
            if (!question || aiBusy) return;

            var suggestions = panel.querySelector(".help-ai-suggestions");
            if (suggestions) suggestions.remove();

            appendMessage("user", question);
            aiInput.value = "";
            aiBusy = true;
            aiSendBtn.disabled = true;
            var typingRow = appendTyping();

            var pageKey2 = currentPageKey() || "";
            (typeof AiHelpApi !== "undefined" ? AiHelpApi.ask(question, pageKey2) : Promise.reject(new Error("AI client not loaded")))
                .then(function (data) {
                    typingRow.remove();
                    appendMessage("assistant", (data && data.answer) || "Sorry, I didn't get a response. Try again.");
                })
                .catch(function (err) {
                    typingRow.remove();
                    appendMessage("assistant", "Sorry, something went wrong reaching the AI assistant. " + (err && err.message ? err.message : "Please try again."));
                })
                .finally(function () {
                    aiBusy = false;
                    aiSendBtn.disabled = false;
                });
        }

        aiSendBtn.addEventListener("click", function () { sendQuestion(aiInput.value); });
        aiInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") sendQuestion(aiInput.value);
        });
        aiChips.forEach(function (chip) {
            chip.addEventListener("click", function () { sendQuestion(chip.textContent); });
        });

        function openPanel() {
            overlay.classList.add("show");
            panel.classList.add("show");
            fab.setAttribute("aria-expanded", "true");
            document.addEventListener("keydown", onKeydown);
            setTimeout(function () { searchInput.focus(); }, 300);
        }

        function closePanel() {
            overlay.classList.remove("show");
            panel.classList.remove("show");
            fab.setAttribute("aria-expanded", "false");
            document.removeEventListener("keydown", onKeydown);
        }

        function onKeydown(e) {
            if (e.key === "Escape") closePanel();
        }

        fab.addEventListener("click", function () {
            var ping = fab.querySelector(".help-fab-ping");
            if (ping) ping.remove();
            openPanel();
        });
        overlay.addEventListener("click", closePanel);
        panel.querySelector(".help-panel-close").addEventListener("click", closePanel);

        sectionEls.forEach(function (sectionEl) {
            var toggle = sectionEl.querySelector(".help-section-toggle");
            toggle.addEventListener("click", function () {
                var isOpen = sectionEl.classList.contains("open");
                sectionEls.forEach(function (other) {
                    other.classList.remove("open");
                    other.querySelector(".help-section-toggle").setAttribute("aria-expanded", "false");
                });
                if (!isOpen) {
                    sectionEl.classList.add("open");
                    toggle.setAttribute("aria-expanded", "true");
                }
            });
        });

        searchInput.addEventListener("input", function () {
            var q = searchInput.value.trim().toLowerCase();
            var visibleCount = 0;
            sectionEls.forEach(function (sectionEl) {
                var text = sectionEl.textContent.toLowerCase();
                var matches = !q || text.indexOf(q) !== -1;
                sectionEl.style.display = matches ? "" : "none";
                if (matches) visibleCount++;
                if (q && matches) {
                    sectionEl.classList.add("open");
                    sectionEl.querySelector(".help-section-toggle").setAttribute("aria-expanded", "true");
                } else if (!q) {
                    sectionEl.classList.remove("open");
                    sectionEl.querySelector(".help-section-toggle").setAttribute("aria-expanded", "false");
                }
            });
            noResults.classList.toggle("show", visibleCount === 0);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
