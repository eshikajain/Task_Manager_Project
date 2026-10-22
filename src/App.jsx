import { useEffect, useState } from "react";
import "./App.css";

const initialTasks = [
  {
    id: 1,
    title: "Finish user onboarding",
    dueDate: "",
    category: "Work",
    completed: false,
  },
  {
    id: 2,
    title: "Solve the prioritisation issue",
    dueDate: "2027-01-08",
    category: "LaunchPad",
    completed: false,
  },
  {
    id: 3,
    title: "Hold to reorder on mobile",
    dueDate: "2027-01-10",
    category: "Personal",
    completed: false,
  },
  {
    id: 4,
    title: "Update onboarding workflow templates",
    dueDate: "",
    category: "Work",
    completed: true,
  },
  {
    id: 5,
    title: "Connect time tracking with tasks",
    dueDate: "",
    category: "LaunchPad",
    completed: true,
  },
];

const categories = ["Work", "Personal", "LaunchPad", "Study"];

function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem("task-manager-tasks");
      return savedTasks ? JSON.parse(savedTasks) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  useEffect(() => {
    localStorage.setItem("task-manager-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const [currentPage, setCurrentPage] = useState("Tasks");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("Work");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Reports date filter state
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

  // Overall task statistics
  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  const totalCount = tasks.length;

  const completionRate =
    totalCount === 0
      ? 0
      : Math.round((completedCount / totalCount) * 100);

  // Filter report tasks by due date
  const reportTasks = tasks.filter((task) => {
    const dueDate = task.dueDate || "";

    if (!reportStartDate && !reportEndDate) {
      return true;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return false;
    }

    if (reportStartDate && dueDate < reportStartDate) {
      return false;
    }

    if (reportEndDate && dueDate > reportEndDate) {
      return false;
    }

    return true;
  });

  const reportTotal = reportTasks.length;

  const reportCompleted = reportTasks.filter(
    (task) => task.completed
  ).length;

  const reportPending = reportTotal - reportCompleted;

  const reportRate =
    reportTotal === 0
      ? 0
      : Math.round((reportCompleted / reportTotal) * 100);

  // Category-wise report statistics
  const categoryReports = categories.map((category) => {
    const categoryTasks = reportTasks.filter(
      (task) => task.category === category
    );

    const completed = categoryTasks.filter(
      (task) => task.completed
    ).length;

    const total = categoryTasks.length;

    return {
      name: category,
      total,
      completed,
      rate:
        total === 0
          ? 0
          : Math.round((completed / total) * 100),
    };
  });

  const bestCategory = [...categoryReports]
    .filter((category) => category.total > 0)
    .sort((a, b) => b.rate - a.rate)[0];

  // Productivity message
  const productivityMessage =
    reportTotal === 0
      ? "No tasks match this date range. Try changing your filters."
      : reportRate >= 80
        ? "Excellent progress! You are completing most of your tasks."
        : reportRate >= 50
          ? "Good progress! Keep working through your remaining tasks."
          : "Focus on a few pending tasks to improve your completion rate.";

  // Reset task form
  function resetForm() {
    setNewTitle("");
    setNewDate("");
    setNewCategory("Work");
    setEditingId(null);
    setShowForm(false);
  }

  // Add or update task
  function addTask(event) {
    event.preventDefault();

    if (!newTitle.trim()) return;

    if (editingId !== null) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingId
            ? {
                ...task,
                title: newTitle.trim(),
                dueDate: newDate,
                category: newCategory,
              }
            : task
        )
      );
    } else {
      const newTask = {
        id: Date.now(),
        title: newTitle.trim(),
        dueDate: newDate,
        category: newCategory,
        completed: false,
      };

      setTasks((currentTasks) => [newTask, ...currentTasks]);
    }

    resetForm();
  }

  // Mark task as complete or pending
  function toggleTask(id) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  // Delete task
  function deleteTask(id) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }
  }

  // Edit task
  function editTask(task) {
    setNewTitle(task.title);
    setNewDate(toInputDate(task.dueDate));
    setNewCategory(task.category);
    setEditingId(task.id);
    setShowForm(true);
  }

  // Validate date format for date inputs
  function toInputDate(value) {
    if (!value) return "";

    return /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : "";
  }

  // Check due date status
  function getDueDateStatus(dueDate) {
    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return "";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(`${dueDate}T00:00:00`);

    if (Number.isNaN(due.getTime())) return "";
    if (due < today) return "Overdue";

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (due.getTime() === today.getTime()) {
      return "Due today";
    }

    if (due.getTime() === tomorrow.getTime()) {
      return "Due tomorrow";
    }

    return "";
  }

  // Search and filter tasks
  const visibleTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Pending" && !task.completed) ||
      (filter === "Completed" && task.completed);

    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Navigate between pages
  function openPage(page) {
    setCurrentPage(page);
    setShowForm(false);
    setShowFilters(false);
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✓</div>
          <span>TaskFlow</span>
        </div>

        <div className="workspace">
          <span className="workspace-dot" />
          My Workspace
          <span className="workspace-arrow">⌄</span>
        </div>

        <p className="menu-heading">MENU</p>

        <nav className="navigation">
          <button
            className={`nav-item ${
              currentPage === "Welcome" ? "active" : ""
            }`}
            onClick={() => openPage("Welcome")}
          >
            <span>⌂</span> Welcome
          </button>

          <button
            className={`nav-item ${
              currentPage === "Dashboard" ? "active" : ""
            }`}
            onClick={() => openPage("Dashboard")}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            className={`nav-item ${
              currentPage === "Tasks" ? "active" : ""
            }`}
            onClick={() => openPage("Tasks")}
          >
            <span>☷</span> Tasks
            <span className="nav-count">{tasks.length}</span>
          </button>

          <button
            className={`nav-item ${
              currentPage === "People" ? "active" : ""
            }`}
            onClick={() => openPage("People")}
          >
            <span>♧</span> People
          </button>

          <button
            className={`nav-item ${
              currentPage === "Reports" ? "active" : ""
            }`}
            onClick={() => openPage("Reports")}
          >
            <span>▥</span> Reports
          </button>

          <button
            className={`nav-item ${
              currentPage === "Billing" ? "active" : ""
            }`}
            onClick={() => openPage("Billing")}
          >
            <span>◎</span> Billing
          </button>

          <button
            className={`nav-item ${
              currentPage === "Integrations" ? "active" : ""
            }`}
            onClick={() => openPage("Integrations")}
          >
            <span>⊞</span> Integrations
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="avatar">EJ</div>

          <div className="profile-text">
            <strong>My Account</strong>
            <span>Personal workspace</span>
          </div>

          <span className="profile-menu">•••</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            My Workspace <span>/</span>{" "}
            <strong>{currentPage}</strong>
          </div>

          <div className="topbar-right">
            <span className="today-label">
              Your productivity space
            </span>
            <div className="avatar small-avatar">EJ</div>
          </div>
        </header>

        <section className="content-area">
          {/* Welcome page */}
          {currentPage === "Welcome" && (
            <div className="simple-page">
              <p className="eyebrow">WELCOME TO TASKFLOW</p>
              <h1>Welcome</h1>

              <p>
                Organize your work, keep track of deadlines,
                and celebrate progress.
              </p>

              <button
                className="primary-button"
                onClick={() => openPage("Tasks")}
              >
                Open My Tasks
              </button>
            </div>
          )}

          {/* Dashboard page - existing task statistics */}
          {currentPage === "Dashboard" && (
            <div className="simple-page">
              <p className="eyebrow">YOUR OVERVIEW</p>
              <h1>Dashboard</h1>

              <p>Here's your task progress at a glance.</p>

              <div className="stats-container">
                <div className="stat-card">
                  <span className="stat-label">Total Tasks</span>
                  <h2>{totalCount}</h2>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Pending Tasks</span>
                  <h2>{pendingCount}</h2>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Completed Tasks</span>
                  <h2>{completedCount}</h2>
                </div>
              </div>

              <div className="report-progress">
                <p>Overall completion progress</p>
                <h2>{completionRate}%</h2>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              <button
                className="primary-button"
                onClick={() => openPage("Tasks")}
              >
                View All Tasks
              </button>
            </div>
          )}

          {/* Reports page */}
          {currentPage === "Reports" && (
            <div
              className="reports-page"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <div className="reports-heading">
                <p className="eyebrow">YOUR PERFORMANCE</p>
                <h1>Reports & Analytics</h1>
                <p className="subtitle">
                  Understand your progress and see how your work is going.
                </p>
              </div>

              {/* Date filters */}
              <div
                className="report-filter-card"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "end",
                  gap: 16,
                  padding: 20,
                  borderRadius: 16,
                  background: "var(--card-bg, #ffffff)",
                  border: "1px solid var(--border-color, #e5e7eb)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label htmlFor="report-start-date">From date</label>
                  <input
                    id="report-start-date"
                    type="date"
                    value={reportStartDate}
                    max={reportEndDate || undefined}
                    onChange={(event) =>
                      setReportStartDate(event.target.value)
                    }
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label htmlFor="report-end-date">To date</label>
                  <input
                    id="report-end-date"
                    type="date"
                    value={reportEndDate}
                    min={reportStartDate || undefined}
                    onChange={(event) =>
                      setReportEndDate(event.target.value)
                    }
                  />
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setReportStartDate("");
                    setReportEndDate("");
                  }}
                >
                  Reset dates
                </button>
              </div>

              {/* Report statistic cards */}
              <div
                className="stats-container"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 16,
                }}
              >
                <div className="stat-card">
                  <span className="stat-label">Tasks in Period</span>
                  <h2>{reportTotal}</h2>
                  <p>Tasks matching your date range</p>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Completed</span>
                  <h2>{reportCompleted}</h2>
                  <p>Finished tasks</p>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Pending</span>
                  <h2>{reportPending}</h2>
                  <p>Tasks left to complete</p>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Completion Rate</span>
                  <h2>{reportRate}%</h2>
                  <p>Overall task completion</p>
                </div>
              </div>

              {/* Charts layout */}
              <div
                className="reports-chart-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 20,
                }}
              >
                {/* Donut chart */}
                <div
                  className="report-chart-card"
                  style={{
                    padding: 24,
                    borderRadius: 18,
                    background: "var(--card-bg, #ffffff)",
                    border: "1px solid var(--border-color, #e5e7eb)",
                  }}
                >
                  <h2>Task Completion</h2>
                  <p className="subtitle">
                    Completed versus pending tasks
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 28,
                      padding: "24px 0",
                    }}
                  >
                    <div
                      role="img"
                      aria-label={`${reportRate}% completed, ${100 - reportRate}% pending`}
                      style={{
                        width: 190,
                        height: 190,
                        borderRadius: "50%",
                        background:
                          reportTotal === 0
                            ? "#e8eaf0"
                            : `conic-gradient(#6558e8 0% ${reportRate}%, #e8eaf0 ${reportRate}% 100%)`,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 132,
                          height: 132,
                          borderRadius: "50%",
                          background: "var(--card-bg, #ffffff)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <strong style={{ fontSize: 32 }}>
                          {reportRate}%
                        </strong>
                        <span style={{ fontSize: 13 }}>
                          Completed
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 4,
                            background: "#6558e8",
                          }}
                        />
                        <span>Completed ({reportCompleted})</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 4,
                            background: "#e8eaf0",
                          }}
                        />
                        <span>Pending ({reportPending})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category progress bar chart */}
                <div
                  className="report-chart-card"
                  style={{
                    padding: 24,
                    borderRadius: 18,
                    background: "var(--card-bg, #ffffff)",
                    border: "1px solid var(--border-color, #e5e7eb)",
                  }}
                >
                  <h2>Category Progress</h2>
                  <p className="subtitle">
                    Completion rate for each category
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 26 }}>
                    {categoryReports.map((category) => (
                      <div key={category.name}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 9,
                          }}
                        >
                          <strong>{category.name}</strong>
                          <span>
                            {category.completed}/{category.total} · {category.rate}%
                          </span>
                        </div>

                        <div
                          style={{
                            height: 10,
                            borderRadius: 20,
                            background: "#e8eaf0",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${category.rate}%`,
                              height: "100%",
                              borderRadius: 20,
                              background: "#6558e8",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Productivity insight */}
              <div
                className="productivity-insight"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: 24,
                  borderRadius: 18,
                  background: "#f1efff",
                  border: "1px solid #ded9ff",
                  color: "#252044",
                }}
              >
                <div style={{ fontSize: 26 }} aria-hidden="true">
                  ✦
                </div>

                <div>
                  <h2 style={{ margin: "0 0 7px", fontSize: 17 }}>
                    Productivity insight
                  </h2>

                  <p style={{ margin: 0, color: "#4e5267", lineHeight: 1.6 }}>
                    {productivityMessage}
                  </p>

                  {bestCategory && (
                    <p style={{ margin: "8px 0 0", color: "#4e5267", lineHeight: 1.6 }}>
                      Your strongest category is{" "}
                      <strong>{bestCategory.name}</strong> with a{" "}
                      {bestCategory.rate}% completion rate.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  className="primary-button"
                  onClick={() => openPage("Tasks")}
                >
                  View All Tasks
                </button>
              </div>
            </div>
          )}

          {/* Tasks page - task list stays separate from Reports */}
          {currentPage === "Tasks" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR WORKSPACE</p>
                  <h1>To-Do</h1>
                  <p className="subtitle">
                    Keep track of your work and get things done.
                  </p>
                </div>

                <div className="task-summary">
                  <div className="summary-icon">✓</div>
                  <div>
                    <strong>
                      {completedCount} of {totalCount}
                    </strong>
                    <span>tasks completed</span>
                  </div>
                </div>
              </div>

              <div className="stats-container">
                <div className="stat-card">
                  <span className="stat-label">Total Tasks</span>
                  <h2>{totalCount}</h2>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Pending Tasks</span>
                  <h2>{pendingCount}</h2>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Completed Tasks</span>
                  <h2>{completedCount}</h2>
                </div>
              </div>

              <div className="toolbar">
                <button
                  className="primary-button"
                  onClick={() => {
                    if (showForm) {
                      resetForm();
                    } else {
                      setEditingId(null);
                      setNewTitle("");
                      setNewDate("");
                      setNewCategory("Work");
                      setShowForm(true);
                    }
                  }}
                >
                  <span className="plus-icon">+</span> New Task
                </button>

                <button
                  className={`secondary-button ${
                    showFilters ? "selected" : ""
                  }`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <span>▽</span> Filters
                </button>

                <div className="search-box">
                  <span>⌕</span>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              {showFilters && (
                <div className="filter-panel">
                  <span>Show:</span>

                  {["All", "Pending", "Completed"].map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`filter-chip ${
                        filter === item ? "chosen" : ""
                      }`}
                      onClick={() => setFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {showForm && (
                <form className="task-form" onSubmit={addTask}>
                  <h2>
                    {editingId !== null
                      ? "Edit Task"
                      : "Create a new task"}
                  </h2>

                  <label htmlFor="task-title">Task name</label>
                  <input
                    id="task-title"
                    type="text"
                    placeholder="What do you need to do?"
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    required
                    autoFocus
                  />

                  <div className="form-row">
                    <div>
                      <label htmlFor="task-date">Due date</label>
                      <input
                        id="task-date"
                        type="date"
                        value={newDate}
                        onChange={(event) => setNewDate(event.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="task-category">Category</label>
                      <select
                        id="task-category"
                        value={newCategory}
                        onChange={(event) =>
                          setNewCategory(event.target.value)
                        }
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>

                    <button type="submit" className="primary-button">
                      {editingId !== null
                        ? "Save Changes"
                        : "Create Task"}
                    </button>
                  </div>
                </form>
              )}

              <div className="list-heading">
                <h2>
                  {filter === "All" ? "All Tasks" : `${filter} Tasks`}
                </h2>
                <span>{visibleTasks.length} tasks</span>
              </div>

              <div className="task-list">
                {visibleTasks.map((task) => (
                  <article
                    className={`task-card ${
                      task.completed ? "is-completed" : ""
                    }`}
                    key={task.id}
                  >
                    <input
                      className="task-checkbox"
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      aria-label={`Mark ${task.title} as ${
                        task.completed ? "incomplete" : "complete"
                      }`}
                    />

                    <div className="task-details">
                      <span className="task-title">{task.title}</span>

                      <div className="task-meta">
                        {task.dueDate && (
                          <span className="due-date">
                            <span>▦</span>{" "}
                            {toInputDate(task.dueDate)
                              ? new Date(
                                  `${task.dueDate}T00:00:00`
                                ).toLocaleDateString()
                              : task.dueDate}

                            {getDueDateStatus(task.dueDate) && (
                              <span
                                className={`due-status ${
                                  getDueDateStatus(task.dueDate) ===
                                  "Overdue"
                                    ? "overdue"
                                    : "due-soon"
                                }`}
                              >
                                {getDueDateStatus(task.dueDate)}
                              </span>
                            )}
                          </span>
                        )}

                        <span
                          className={`category-tag ${task.category.toLowerCase()}`}
                        >
                          <span className="category-dot" />
                          {task.category}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => editTask(task)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete ${task.title}`}
                      title="Delete task"
                    >
                      ×
                    </button>
                  </article>
                ))}

                {visibleTasks.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">☷</div>
                    <h3>No tasks found</h3>
                    <p>
                      Try another filter or create a new task.
                    </p>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setEditingId(null);
                        setNewTitle("");
                        setNewDate("");
                        setNewCategory("Work");
                        setShowForm(true);
                      }}
                    >
                      + New Task
                    </button>
                  </div>
                )}
              </div>

              <p className="footer-note">
                Made for a more organized day <span>♥</span>
              </p>
            </>
          )}

          {/* Other sections */}
          {["People", "Billing", "Integrations"].includes(currentPage) && (
            <div className="simple-page">
              <p className="eyebrow">MY WORKSPACE</p>
              <h1>{currentPage}</h1>

              <p>
                The {currentPage.toLowerCase()} section is not implemented yet.
                You can continue managing tasks and viewing your reports.
              </p>

              <button
                className="primary-button"
                onClick={() => openPage("Tasks")}
              >
                Back to Tasks
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;