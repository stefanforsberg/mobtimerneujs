Neutralino.init();

const timerValueElement = document.getElementById("timerValue");
const timerDisplayElement = document.getElementById("timerDisplay");
const startButtonElement = document.getElementById("startButton");

let activeUser = 1;
let running = false;
let clockIntervalId = "";
let timerValue = timerValueElement.value;
let timerValueDefault = timerValueElement.value;

function updateTimeDisplay() {
  const divisor_for_minutes = timerValue % (60 * 60);
  const minutes = Math.floor(divisor_for_minutes / 60);

  const divisor_for_seconds = divisor_for_minutes % 60;
  const seconds = Math.ceil(divisor_for_seconds);

  timerDisplayElement.innerText = `${minutes > 9 ? minutes : "0" + minutes}:${seconds > 9 ? seconds : "0" + seconds}`;
}

async function setCurrentUser() {
  document.querySelectorAll(".user input[type=text]").forEach((e) => e.parentElement.classList.remove("current"));
  let currentUser = document.querySelector(".user[data-index='" + activeUser + "']");
  currentUser.classList.add("current");

  startButtonElement.innerText = `Start session for ${currentUser.children[1].value}`;

  await Neutralino.os.setTray({
    icon: "/resources/icons/trayIcon.png",
    menuItems: [{ id: "currentUser", text: `Driver: ${currentUser.children[1].value}` }],
  });
}

async function runningTimer() {
  timerValue--;
  updateTimeDisplay();
  if (timerValue <= 0) {
    running = false;
    const allUsers = Array.from(document.querySelectorAll(".user"));

    let checkUser = activeUser;

    for (let i = 0; i < allUsers.length; i++) {
      checkUser = (activeUser + i + 1) % (allUsers.length + 1);

      if (document.querySelector(".user[data-index='" + checkUser + "'] input[type=checkbox]:checked")) {
        activeUser = parseInt(document.querySelector(".user[data-index='" + checkUser + "']").dataset.index);
        break;
      }
    }

    await setCurrentUser();

    clearInterval(clockIntervalId);

    timerValue = timerValueDefault;
    updateTimeDisplay();

    await Neutralino.window.show();
  }
}

timerValueElement.addEventListener("change", (e) => {
  timerValue = Math.max(1, e.target.value);
  e.target.value = timerValue;
  timerValueDefault = timerValue;
  updateTimeDisplay();
});

startButtonElement.addEventListener("click", async () => {
  if (running) {
    await Neutralino.window.hide();
    return false;
  }

  startButtonElement.innerText = `Session running ????. Double click other user to switch/restart.`;

  running = true;

  let currentUser = document.querySelector(".user.current input[type=text]");
  await Neutralino.os.showNotification("New session", `Let's go ${currentUser.value} ????`);

  await Neutralino.window.hide();

  clockIntervalId = setInterval(runningTimer, 1000);
});

let initApp = async () => {
  let mobUsers = {};

  try {
    mobUsers = JSON.parse(await Neutralino.storage.getData("mobUsers"));
  } catch (err) {
    mobUsers = ["User 1", "User 2", "User 3", "User 4", "User 5", "Break"];
  }

  let mobUserHtml = "";

  mobUsers.forEach((m, i) => {
    mobUserHtml += `<div class="grid user" data-index="${i + 1}">
      <input type="checkbox" role="switch" checked />
      <input type="text" placeholder="User 1" value="${m}" />
    </div>`;
  });

  document.getElementById("mobUsers").innerHTML = mobUserHtml;

  document.querySelectorAll(".user input[type=text]").forEach((u) => {
    u.addEventListener("change", async () => {
      await Neutralino.storage.setData("mobUsers", JSON.stringify(Array.from(document.querySelectorAll(".user input[type=text]")).map((x) => x.value)));
    });

    u.addEventListener("dblclick", async (udbclick) => {
      if (!udbclick.target.previousElementSibling.checked) {
        return;
      }
      clearInterval(clockIntervalId);
      running = false;
      activeUser = parseInt(udbclick.target.parentElement.dataset.index);
      await setCurrentUser();
      timerValue = timerValueDefault;
      updateTimeDisplay();
    });
  });

  updateTimeDisplay();
  await setCurrentUser();

  await Neutralino.events.on("trayMenuItemClicked", async (e) => {
    await Neutralino.window.show();
  });
};

initApp();
