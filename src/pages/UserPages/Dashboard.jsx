import React, { useEffect, useState, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserSidebar from "./UserSidebar";
import Column from "./Column";
import SortableItem from "./SortableItem";
import notificationSound from "./notification.mp3";

const UserDashboard = () => {
  const [tasks, setTasks] = useState({
    "To Do": [],
    "In Progress": [],
    Completed: [],
  });

  const [filteredTasks, setFilteredTasks] = useState({
    "To Do": [],
    "In Progress": [],
    Completed: [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "completed", "incomplete"
  const [notes, setNotes] = useState(localStorage.getItem("notes") || "");
  const audioRef = useRef(new Audio(notificationSound));

  // 🔹 Ensure page starts from top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const categorizedTasks = {
      "To Do": storedTasks.filter((task) => task.progress <= 40),
      "In Progress": storedTasks.filter((task) => task.progress > 40 && task.progress <= 80),
      Completed: storedTasks.filter((task) => task.progress > 80),
    };
    setTasks(categorizedTasks);
    setFilteredTasks(categorizedTasks);
    checkDeadlines(storedTasks);
  }, []);

  // Apply filters whenever search term or status filter changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, tasks]);

  const applyFilters = () => {
    let filtered = { ...tasks };

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      Object.keys(filtered).forEach((column) => {
        filtered[column] = filtered[column].filter((task) =>
          task.title.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter === "completed") {
      filtered = {
        "To Do": [],
        "In Progress": [],
        Completed: filtered.Completed,
      };
    } else if (statusFilter === "incomplete") {
      filtered = {
        "To Do": filtered["To Do"],
        "In Progress": filtered["In Progress"],
        Completed: [],
      };
    }

    setFilteredTasks(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFilteredTasks(tasks);
  };

  useEffect(() => {
    localStorage.setItem("notes", notes);
  }, [notes]);

  const checkDeadlines = (tasks) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    tasks.forEach((task) => {
      if (task.deadline === today) {
        showNotification(`🚨 Task Due Today: "${task.title}"`, "bg-red-500 text-white");
      } else if (task.deadline === tomorrowStr) {
        showNotification(`⏳ Task Due Tomorrow: "${task.title}"`, "bg-yellow-500 text-black");
      }
    });
  };

  const showNotification = (message, bgClass) => {
    toast(
      <div className={`p-2 rounded-lg shadow-md font-semibold text-lg ${bgClass}`}>
        {message}
      </div>,
      { position: "top-right", autoClose: 5000, hideProgressBar: false }
    );
    audioRef.current.play();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceColumn = Object.keys(tasks).find((column) =>
      tasks[column].some((task) => task.id === active.id)
    );
    const targetColumn = Object.keys(tasks).find((column) => tasks[column].some((task) => task.id === over.id)) || over.id;

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) return;

    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };
      const movedTask = updatedTasks[sourceColumn].find((task) => task.id === active.id);
      updatedTasks[sourceColumn] = updatedTasks[sourceColumn].filter((task) => task.id !== active.id);
      updatedTasks[targetColumn] = [...(updatedTasks[targetColumn] || []), movedTask];

      return updatedTasks;
    });

    localStorage.setItem("tasks", JSON.stringify([...tasks["To Do"], ...tasks["In Progress"], ...tasks["Completed"]]));
  };

  // Task Analytics Chart Data (Bar Graph)
  const chartData = {
    labels: ["To Do", "In Progress", "Completed"],
    datasets: [
      {
        label: "Number of Tasks",
        data: [
          filteredTasks["To Do"].length,
          filteredTasks["In Progress"].length,
          filteredTasks.Completed.length,
        ],
        backgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"],
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-gray-100">
      <UserSidebar />

      <div className="flex-1 p-6">
        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          🚀 User Dashboard
        </h2>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar />

        {/* Task Filters Section */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🔍 Task Filters</h3>
          
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search tasks by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("incomplete")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === "incomplete"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Incomplete
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === "completed"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Completed
              </button>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={clearFilters}
                className="p-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                <FaTimes aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== "all") && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Search: "{searchTerm}"
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  Status: {statusFilter === "completed" ? "Completed Only" : "Incomplete Only"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Kanban Board */}
        <div className="glassmorphism p-4 rounded-xl shadow-lg bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-lg border border-white/20">
          <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(filteredTasks).map((columnKey) => (
                <Column key={columnKey} title={columnKey} id={columnKey} className="w-[280px]">
                  <SortableContext items={filteredTasks[columnKey].map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    {filteredTasks[columnKey].map((task) => (
                      <SortableItem key={task.id} id={task.id} task={task} />
                    ))}
                  </SortableContext>
                </Column>
              ))}
            </div>
          </DndContext>
        </div>

        {/* Task Analytics & Notes Section */}
        <div className="mt-10 flex flex-col lg:flex-row items-start gap-6">
          {/* Task Analytics Chart */}
          <div className="p-6 w-full lg:w-1/2 bg-white shadow-lg rounded-xl border border-gray-300">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center tracking-wide uppercase">
              📊 Task Analytics
            </h2>
            
            {/* Filtered Results Summary */}
            {(searchTerm || statusFilter !== "all") && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  Showing {filteredTasks["To Do"].length + filteredTasks["In Progress"].length + filteredTasks.Completed.length} filtered tasks
                  {searchTerm && ` matching "${searchTerm}"`}
                  {statusFilter !== "all" && ` (${statusFilter === "completed" ? "completed" : "incomplete"} only)`}
                </p>
              </div>
            )}
            
            <Bar data={chartData} />
          </div>

          {/* Notes */}
          <div className="p-6 w-full lg:w-[590px] bg-green-900 text-white rounded-xl border-[12px] border-[#8B4501] shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2 text-center">📌 Notes</h2>

            {/* Notes Input Field - Enlarged to match Task Analytics */}
            <textarea
              className="flex-1 bg-transparent border-none outline-none text-white text-lg p-7"
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
              style={{
                fontFamily: "Chalkduster, Comic Sans MS, cursive",
                height: "320px",
                minHeight: "280px",
                textAlign: "left",
                resize: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
