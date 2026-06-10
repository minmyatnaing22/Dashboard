const POMODORO_TIME = 1500;
const pomodoro_minute = 25;  // For Focus Time
let timeleft = POMODORO_TIME;
let isRunning = false;

let tasks =
JSON.parse(
    localStorage.getItem("tasks")
) || [];

let pomodoroCount =
Number(
    localStorage.getItem(
        "pomodoroCount"
    )
) || 0;


let weeklyData =
JSON.parse(
    localStorage.getItem("weeklyData")
) || [0,0,0,0,0,0,0];


let lastResetDate = localStorage.getItem("lastResetDate");

// let weeklyData = [
//     4,
//     2,
//     6,
//     3,
//     5,
//     1,
//     4
// ];


const days = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun"
];


//====================================================================
//DOM SELECTIOR
//====================================================================

const taskForm =
document.getElementById("task-form");

const taskInput =
document.getElementById("task-input");

const taskList =
document.getElementById("task-list");

const filterButtons =
document.querySelectorAll(".filter-buttons button");

//===================================================================
const timerDisplay = document.getElementById( "timer-display");

const startBtn = document.getElementById("start-btn");

const pauseBtn = document.getElementById("pause-btn");

const resetBtn = document.getElementById("reset-btn");

// ================================================================


const progressFill = document.getElementById("progress-fill");

const progressPercent = document.getElementById("progress-percent");

//=================================================================

const themeToggle = document.getElementById( "theme-toggle");
//====================================================================

//====================================================================

const heroQuote = document.getElementById("hero-quote");

const heroAuthor = document.getElementById("hero-author");

const newQuoteBtn = document.getElementById("new-quote-btn");

//=====================================================================
//ANALYTICS 
const analyticsCompleted = document.getElementById("analytics-completed");

const analyticsTotal =document.getElementById("analytics-total");

const analyticsRate = document.getElementById("analytics-rate");

//=====================================================================

const analyticsPomodoros = document.getElementById( "analytics-pomodoros");
const analyticsFocusTime = document.getElementById("analytics-focus-time");
const weeklyChart =document.getElementById("weekly-chart");

//=====================================================================

const toastContainer = document.getElementById( "toast-container");





//====================================================================
//CREATE TASK Element/ DONE/DELETE/EIDT AREA
//====================================================================

function createTaskElement(task) {

    const li = document.createElement("li");
    li.classList.add("task-card");

    li.dataset.id= task.id;

    // TASK TEXT

    if (task.isEditing){
        const editInput = document.createElement("input");

        editInput.value = task.text;

        editInput.classList.add("edit-input");

        li.appendChild(editInput);

        editInput.dataset.id = task.id;

        editInput.addEventListener("blur", (e) => {

        task.text = e.target.value;

        task.isEditing = false;

        saveTasks()
        renderTasks();

        });


    }else{
        const taskText = document.createElement("span");
        taskText.classList.add("task-text");

        taskText.textContent = task.text;
        li.appendChild(taskText);
    }

   
    // ACTION BUTTON AREA

    const actions = document.createElement("div");
    actions.classList.add("task-actions");

    // DELETE BUTTON

    const deleteBtn = document.createElement("button");

    deleteBtn.textContent = "Delete";

    deleteBtn.classList.add("delete-btn");

    // DELETE EVENT LISTENER ******************replaced by event delegation
    deleteBtn.dataset.action = "delete";




    // ADD COMPLETE FUNCTION
    const completeBtn = document.createElement("button");

    completeBtn.textContent = task.completed ? "Undo" : "Done";

    completeBtn.classList.add("complete-btn");

    // COMPLETE EVENT LISTENER *******************
    completeBtn.dataset.action = "complete";

    if(task.completed){

    li.classList.add("completed");

    }

    // Create Edit Button*****************
    const editBtn = document.createElement("button");

    editBtn.textContent = "Edit";

    editBtn.classList.add("edit-btn");

    editBtn.dataset.action = "edit";

   

    // APPEND BUTTON INTO ACTIONS

    actions.appendChild(completeBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(editBtn);

    // APPEND EVERYTHING INTO CARD



    li.appendChild(actions);

    return li;
} 

//====================================================================
//Filter Button
//====================================================================

let currentFilter = "all";

filterButtons.forEach((button) => {

    button.addEventListener("click", () => {

        currentFilter =
        button.dataset.filter;

        //Active Filter Button
        filterButtons.forEach((btn) => {
        btn.classList.remove("active");
    });

    button.classList.add("active");

        renderTasks();

    });

});

function updateAnalyticsUI() {

    analyticsPomodoros.textContent = pomodoroCount;

    const focusMinutes = pomodoroCount * pomodoro_minute;
    analyticsFocusTime.textContent = `${focusMinutes} min`;

    updateAnalytics(); // keep everything synced
}

//====================================================================
//RENDER TASKS
//====================================================================

function renderTasks() {
    taskList.innerHTML = "";

     // FILTER SYSTEM

    let filteredTasks = tasks;

    if(currentFilter === "completed"){

        filteredTasks =
        tasks.filter(task => task.completed);

    }

    if(currentFilter === "pending"){

        filteredTasks =
        tasks.filter(task => !task.completed);

    }

    if (tasks.length === 0) {
        const empty = document.createElement("li");
        empty.textContent = "📝 No tasks yet. Add your first study task.";
        empty.classList.add("empty-state");

        taskList.appendChild(empty);
         
        updateAnalytics();
        return;
    }

    filteredTasks.forEach((task) => {
        taskList.appendChild(createTaskElement(task));
    });

    updateAnalytics();
}

//====================================================================
//FORM SUBMIT
//====================================================================
taskForm.addEventListener("submit", (e) =>{
    e.preventDefault();

    const taskText = taskInput.value.trim();

    if(taskText === ""){
    return;
    }

    const newTask = {
        id: Date.now(),

        text: taskText,

        completed : false,

        isEditing : false

    };

    tasks.push(newTask);
    showToast("Task Added", "success");

    saveTasks();
    renderTasks();
    updateAnalytics();
    taskInput.value = ""
})


//====================================================================
//EVENT DELEGATION [EDIT/DELETE/DONE]
//====================================================================

taskList.addEventListener("click", (e) => {

    const button =
    e.target.closest("button");

    if(!button){
        return;
    }

    const action = button.dataset.action;

    const li =
    button.closest("li");

    const id =
    Number(li.dataset.id);

    if(action === "delete"){

        tasks = tasks.filter(
            task => task.id !== id
        );
        saveTasks();
        showToast("Task Deleted", "danger");
    }

    if(action === "complete"){

        const task =
        tasks.find(
            task => task.id === id
        );

        task.completed = !task.completed;
        const todayIndex = getTodayIndex();
    

       if(task.completed){

        if(!task.countedToday){

        weeklyData[todayIndex]++;

        task.countedToday = true;

        saveWeeklyData();

        renderWeeklyChart();

        }

    }

        if(task.completed){

            showToast(
                "🎉 Task Completed",
                "success"
            );

        }
        else{

            showToast(
                "↩️ Task Reopened",
                "info"
            );

        }

        saveTasks();

     

    }

    if(action === "edit"){

        const task =
        tasks.find(task => task.id === id);

        task.isEditing =
        !task.isEditing;

        saveTasks();

    }

    renderTasks();

});
 

function saveTasks(){

    localStorage.setItem(
        "tasks",
        JSON.stringify(tasks)
    );

}

renderTasks();




// ========================TIMER======================================
//TIMER
//====================================================================
let intervalId;

function updateTimerDisplay(){
    const minutes = Math.floor(timeleft / 60);
    const seconds = timeleft % 60;

    timerDisplay.textContent =
    `${minutes}:${seconds .toString() .padStart(2,"0")}`;   //************ */

}

//====================================================================
//START BUTTON FUNCTION
//====================================================================
startBtn.addEventListener("click", () => {

    if(isRunning){
        return;
    }

    isRunning = true;

    showToast("Timer Started", "info");

    intervalId =
    setInterval(() => {      //Repeat code forever with time delay

        if(timeleft > 0){

            timeleft--;

            updateTimerDisplay();

        }
       else{

    clearInterval(intervalId);

    isRunning = false;

    pomodoroCount++;

    localStorage.setItem(
        "pomodoroCount",
        pomodoroCount
    );

    updateAnalytics();

    showToast(
        "🍅 Pomodoro Completed!",
        "success"
    );

    }

    }, 1000);

});


pauseBtn.addEventListener("click", () => {

    clearInterval(intervalId);

    isRunning = false;

});

resetBtn.addEventListener("click", () => {
    clearInterval(intervalId);

    isRunning = false;

    timeleft = POMODORO_TIME;

    updateTimerDisplay();
});




//====================================================================
// DARK-LIGHT TOGGLE
//====================================================================
let currentTheme = "dark";

themeToggle.addEventListener("click",() => {

    document.body.classList.toggle(
        "light-mode"
    );

    if(
        document.body.classList.contains(
            "light-mode"
        )
    ){
        themeToggle.textContent =
        "Dark Mode";
    }
    else{
        themeToggle.textContent =
        "Light Mode";
    }

});

//=====================================================================
//QUOTES FORM API
//====================================================================
async function fetchQuote(){

    heroQuote.textContent = "Loading...";
    heroAuthor.textContent = "";

    try{

        const response =
        await fetch(
            "https://dummyjson.com/quotes/random"
        );

        const data =
        await response.json();

        heroQuote.textContent =
        `"${data.quote}"`;

        heroAuthor.textContent =
        `— ${data.author}`;

    }
    catch(error){

        heroQuote.textContent =
        "Failed to load quote.";

        heroAuthor.textContent = "";

    }

}


newQuoteBtn.addEventListener(
    "click",
    () => {

        fetchQuote();

        showToast(
            "✨ New motivation loaded",
            "info"
        );
     }
    
);




//==============================================================
//NOTIFCATIONS POPS UP
//===============================================================



function showToast(message, type="info"){

    const toast =
    document.createElement("div");

    toast.classList.add("toast");
    toast.classList.add(type);

    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {

    toast.classList.add("fade-out");

    setTimeout(() => {

        toast.remove();

    }, 300);

}, 3000);

}

//===========================================================================
//GOAL SETTING
//===========================================================================

let goals =
JSON.parse(
    localStorage.getItem("goals")
) || [];

//=============================================
const goalForm = document.getElementById("goal-form");

const goalInput = document.getElementById("goal-input");

const goalList = document.getElementById("goal-list");
//=========================================================

function createGoalElement(goal){

    const li = document.createElement("li");
    li.classList.add("goal-item");

    const span = document.createElement("span");
    span.textContent = goal.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.classList.add("goal-delete");

    deleteBtn.addEventListener("click", () => {

    goals = goals.filter(
        g => g.id !== goal.id
    );

    saveGoals();

    renderGoals();

    showToast(
        "🎯 Goal Removed",
        "danger"
    );
});

    li.appendChild(span);;
    li.appendChild(deleteBtn);

    return li;


}

function renderGoals(){

    goalList.innerHTML = "";

    goals.forEach((goal) => {

        goalList.appendChild(
            createGoalElement(goal)
        );

    });
   

}



goalForm.addEventListener(
    "submit",
    (e) => {

        e.preventDefault();

        const goalText =
        goalInput.value.trim();

        if(goalText === ""){
            return;
        }

         if(goals.length >= 5){

            showToast(
                "🎯 Maximum 5 goals allowed",
                "info"
            );

            return;
        }

        const newGoal = {

            id: Date.now(),

            text: goalText

        };

        goals.push(newGoal);
        
        saveGoals();

        renderGoals();

        goalInput.value = "";

    }
);



function saveGoals(){

    localStorage.setItem(
        "goals",
        JSON.stringify(goals)
    );

}

renderGoals();

//==================================================================================
//ANALYTICS FUNCTION


function updateAnalytics(){

    const focusMinutes = pomodoroCount * pomodoro_minute;

    const total = tasks.length;

    const completed =
    tasks.filter(
        task => task.completed
    ).length;

    const rate =
    total === 0
    ? 0
    : Math.round(
        (completed / total) * 100
    );

    analyticsCompleted.textContent =
    completed;

    analyticsTotal.textContent =
    total;

    analyticsRate.textContent =
    `${rate}%`;

    analyticsPomodoros.textContent =
    pomodoroCount;

    analyticsFocusTime.textContent =
    `${focusMinutes} min`;
}


function renderWeeklyChart(){
    weeklyChart.innerHTML = "";

    weeklyData.forEach((value, index) => {

        const row = document.createElement("div");
        row.classList.add("chart-row");

        // label
        const label = document.createElement("span");
        label.textContent = days[index];
        label.classList.add("chart-label");

        // bar wrapper (NEW)
        const barWrapper = document.createElement("div");
        barWrapper.classList.add("bar-wrapper");

        // bar
        const bar = document.createElement("div");
        bar.classList.add("chart-bar");

        bar.style.width = `${value * 20}px`;


        // value text (NEW)
        const valueText = document.createElement("span");
        valueText.classList.add("bar-value");
        valueText.textContent = value;

        barWrapper.appendChild(bar);
        barWrapper.appendChild(valueText);

        row.appendChild(label);
        row.appendChild(barWrapper);

        weeklyChart.appendChild(row);
    });
}



function saveWeeklyData(){

    localStorage.setItem(
        "weeklyData",
        JSON.stringify(weeklyData)
    );

}

function getTodayIndex(){

    const day =
    new Date().getDay();

    return day === 0
        ? 6
        : day - 1;

}


//AUTOMATICALLY REFRESH AFTER ONE DAY

function getTodayDateString(){
    return new Date().toDateString();
}

function checkDailyReset(){

    const today = getTodayDateString();

    if(lastResetDate !== today){

        // reset your analytics
        pomodoroCount = 0;

        // save reset state
        lastResetDate = today;
        localStorage.setItem("lastResetDate", today);

        localStorage.setItem("pomodoroCount", pomodoroCount);
        

        console.log("Daily analytics reset ✔");

        updateAnalyticsUI(); // re-render your card
    }
}

function forceResetAnalytics(){

    pomodoroCount = 0;

    localStorage.setItem("pomodoroCount", pomodoroCount);
    

    // also update reset date so system stays consistent
    lastResetDate = getTodayDateString();
    localStorage.setItem("lastResetDate", lastResetDate);

    updateAnalyticsUI();

    showToast("🔄 Analytics reset successfully", "danger");
}


document.getElementById("force-reset-btn")
.addEventListener("click", forceResetAnalytics);



//===============================================================

//WEEKLY CHART RESET

const resetChartBtn =
document.getElementById(
    "reset-chart-btn"
);

resetChartBtn.addEventListener(
    "click",
    () => {

        const confirmed =
        confirm(
            "Reset weekly activity chart?"
        );

        if(!confirmed){
            return;
        }

        weeklyData =
        [0,0,0,0,0,0,0];

        saveWeeklyData();

        renderWeeklyChart();

        showToast(
            "📊 Weekly chart reset",
            "success"
        );

    }
);
renderWeeklyChart();
updateTimerDisplay();
fetchQuote();   
checkDailyReset();
