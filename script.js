let bleDevice;
let characteristicsArray = []; // Declare an array to store characteristics

const deviceName = "APS"; // Change this to your device's name
const bleService = "00001995-0000-1000-8000-00805f9b34fb"; // Replace with your service UUID

const CommandsCharacteristic_uuid = "00001996-0000-1000-8000-00805f9b34fb";
const SpeedCharacteristic_uuid = "00001997-0000-1000-8000-00805f9b34fb";
const TimerCharacteristic_uuid = "00001998-0000-1000-8000-00805f9b34fb";
const StatusCharacteristic_uuid = "00001999-0000-1000-8000-00805f9b34fb";
// Array of UUIDs to subscribe to
const targetSubscribeUUIDs = [StatusCharacteristic_uuid];

function onDisconnected(event) {
  console.log("Device disconnected:", event.target);
  bleDevice = null;
}
function handleNotifications(event) {
  const characteristic = event.target; // The characteristic that triggered the event
  const value = characteristic.value; // Get the value of the characteristic

  // Optionally, decode the value depending on your data format
  const decoder = new TextDecoder();
  const receivedData = decoder.decode(value);
  // Log the characteristic UUID and the received data to differentiate them
  if (characteristic.uuid === StatusCharacteristic_uuid) {
    if (receivedData === "0") {
      updateStatus(false);
    } else if (receivedData === "1") {
      updateStatus(true);
    }
  }
  console.log(
    `Notification from characteristic: ${characteristic.uuid} : ${receivedData}`
  );
}
function readCharacteristic(targetUUID) {
  if (!characteristicsArray || characteristicsArray.length === 0) {
    console.log("No characteristics available!");
    return;
  }

  // Find the characteristic with the given UUID in the existing array
  const characteristicToRead = characteristicsArray.find(
    (char) => char.uuid === targetUUID
  );

  if (!characteristicToRead) {
    console.log(`Characteristic with UUID ${targetUUID} not found!`);
    return;
  }

  // Read the value from the found characteristic
  characteristicToRead
    .readValue()
    .then((value) => {
      const decoder = new TextDecoder();
      const receivedData = decoder.decode(value);

      speedValueDisplay.textContent = `Speed : ${receivedData}`;
      speedSlider.value = receivedData;

      console.log(`Data received from UUID ${targetUUID}: ${receivedData}`);
    })
    .catch((error) => {
      console.error("Error reading characteristic:", error);
    });
}

// Connect Button
function connectToBLEDevice(callback) {
  if (bleDevice) {
    bleDevice.gatt.disconnect();
    bleDevice = null;
    console.log("Disconnected from device.");
    return;
  }

  if (!navigator.bluetooth) {
    console.log("Web Bluetooth API is not available in this browser/device!");
    return;
  }

  navigator.bluetooth
    .requestDevice({
      filters: [{ name: deviceName }],
      // acceptAllDevices: true, // if you want to scan without filter
      optionalServices: [bleService],
    })
    .then((device) => {
      bleDevice = device;
      const connectionStatus = document.getElementById("connectionStatus");
      connectionStatus.textContent = "Connecting...";
      console.log("Connecting to device...");
      device.addEventListener("gattserverdisconnected", onDisconnected);
      return device.gatt.connect();
    })
    .then((server) => {
      console.log("Connected!");
      return server.getPrimaryService(bleService);
    })
    .then((service) => {
      // Retrieve all characteristics from the service
      return service.getCharacteristics();
    })
    .then((characteristics) => {
      // Store the characteristics in the array
      characteristicsArray = characteristics;
      console.log("Characteristics array:", characteristicsArray);

      // Iterate over the array of UUIDs
      targetSubscribeUUIDs.forEach((targetSubscribeUUIDs) => {
        // Find the characteristic that matches the UUID
        const targetCharacteristic = characteristicsArray.find(
          (char) => char.uuid === targetSubscribeUUIDs
        );

        if (targetCharacteristic) {
          // Start notifications on the characteristic
          targetCharacteristic
            .startNotifications()
            .then(() => {
              targetCharacteristic.addEventListener(
                "characteristicvaluechanged",
                handleNotifications
              );
              console.log(
                `Subscribed to notifications for characteristic: ${targetCharacteristic.uuid}`
              );
            })
            .catch((error) => {
              console.error("Error starting notifications:", error);
            });
        } else {
          console.log(`Characteristic with UUID ${targetUUID} not found.`);
        }
      });

      // Optionally, call the callback function after subscribing
      if (callback) {
        callback(); // Call the callback function once all subscriptions are done
      }
    })
    .catch((error) => {
      console.error("Bluetooth Error:", error);
      connectionStatus.textContent = "Connection failed!";
    });
}

function readURLCharacteristic(targetUUID) {
  if (!characteristicsArray || characteristicsArray.length === 0) {
    console.log("No characteristics available!");
    return;
  }

  // Find the characteristic with the given UUID in the existing array
  const characteristicToRead = characteristicsArray.find(
    (char) => char.uuid === targetUUID
  );

  if (!characteristicToRead) {
    console.log(`Characteristic with UUID ${targetUUID} not found!`);
    return;
  }

  // Read the value from the found characteristic
  characteristicToRead
    .readValue()
    .then((value) => {
      const decoder = new TextDecoder();
      const receivedData = decoder.decode(value);

      document.getElementById("center-image").src = receivedData;
      console.log(`Data received from UUID ${targetUUID}: ${receivedData}`);
    })
    .catch((error) => {
      console.error("Error reading characteristic:", error);
    });
}

function writeCharacteristic(targetUUID, data) {
  if (!characteristicsArray || characteristicsArray.length === 0) {
    console.log("No characteristics available!");
    return;
  }

  // Find the characteristic with the given UUID in the existing array
  const characteristicToWrite = characteristicsArray.find(
    (char) => char.uuid === targetUUID
  );

  if (!characteristicToWrite) {
    console.log(`Characteristic with UUID ${targetUUID} not found!`);
    return;
  }

  // Convert the data into a buffer using TextEncoder
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Write the data to the characteristic
  characteristicToWrite
    .writeValue(dataBuffer)
    .then(() => {
      console.log(`Data sent to UUID ${targetUUID} successfully!`);
    })
    .catch((error) => {
      console.error("Bluetooth Error:", error);
    });
}

function connect() {
  connectToBLEDevice(() => {
    // readCharacteristic("00001997-0000-1000-8000-00805f9b34fb");
    // readURLCharacteristic(URLCharacteristic_uuid);

    const connectionContainer = document.querySelector(".connection-container");
    connectionContainer.style.display = "none";
    console.log("Device connected successfully!");
  });
}

function startWithTimer() {
  const customTime = document.getElementById("minutes").value;
  if (!customTime) {
    return alert("Please enter valid time");
  }
  const countdownContainer = document.querySelector(".countdown-container");
  countdownContainer.style.display = "flex";
  updateCountdown(customTime * 60);
  writeCharacteristic(TimerCharacteristic_uuid, customTime * 60); // Send the countdown time to the device
}

function updateStatus(isRunning) {
  const startBtn = document.getElementById("start-btn");
  const stopBtn = document.getElementById("stop-btn");
  const el = document.getElementById("statusDisplay");

  el.textContent = isRunning ? "Running" : "Stopped";
  el.className = isRunning ? "status-running" : "status-stopped";
  if (isRunning) {
    startBtn.style.backgroundColor = "#4caf50";
    stopBtn.style.backgroundColor = "#1976d2";
  } else {
    startBtn.style.backgroundColor = "#1976d2";
    stopBtn.style.backgroundColor = "#f44336";
  }
}

let countdownInterval = null; // store interval ID globally

function updateCountdown(durationInSeconds) {
  const el = document.getElementById("countdownDisplay");

  // Clear previous countdown if it exists
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  const endTime = Date.now() + durationInSeconds * 1000;

  function tick() {
    const now = Date.now();
    let remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    let m = Math.floor(remaining / 60);
    let s = remaining % 60;
    el.textContent = `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      el.textContent = "done!";

      //reset the countdown display after 1 second
      setTimeout(() => {
        const countdownContainer = document.querySelector(
          ".countdown-container"
        );
        countdownContainer.style.display = "none";
      }, 1000);
    }
  }

  tick(); // run immediately
  countdownInterval = setInterval(tick, 1000);
}

let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    console.log("Wake lock is active");

    // Reacquire lock on visibility change (e.g., user switches tabs)
    document.addEventListener("visibilitychange", async () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        wakeLock = await navigator.wakeLock.request("screen");
      }
    });
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

function selectTime(time) {
  const customTime = document.getElementById("minutes");
  const _15MinBtn = document.getElementById("15-min-btn");
  const _30MinBtn = document.getElementById("30-min-btn");
  const _60MinBtn = document.getElementById("60-min-btn");

  if (time === "custom") {
    _15MinBtn.style.background = "#939ea7";
    _30MinBtn.style.background = "#939ea7";
    _60MinBtn.style.background = "#939ea7";
    customTime.value = "";
  } else if (time === "15") {
    _15MinBtn.style.background = "#4caf50";
    _30MinBtn.style.background = "#939ea7";
    _60MinBtn.style.background = "#939ea7";
    customTime.value = "15";
  } else if (time === "30") {
    _15MinBtn.style.background = "#939ea7";
    _30MinBtn.style.background = "#4caf50";
    _60MinBtn.style.background = "#939ea7";
    customTime.value = "30";
  } else if (time === "60") {
    _15MinBtn.style.background = "#939ea7";
    _30MinBtn.style.background = "#939ea7";
    _60MinBtn.style.background = "#4caf50";
    customTime.value = "60";
  }
}

function startStopCommand(cmd) {
  writeCharacteristic(CommandsCharacteristic_uuid, cmd);
  if (cmd === "0") {
    updateCountdown(0);
  }
}
function togglePerfume(checked) {
  writeCharacteristic(CommandsCharacteristic_uuid, checked ? "2" : "3");
}

const slider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");

slider.addEventListener("input", () => {
  speedValue.textContent = `${slider.value}`;
});

slider.addEventListener("mouseup", () => {
  updateSpeed(slider.value);
});

// For mobile devices (touchscreens)
slider.addEventListener("touchend", () => {
  updateSpeed(slider.value);
});
function updateSpeed(value) {
  writeCharacteristic(SpeedCharacteristic_uuid, value);
}

// Call this once your page loads or when needed3
requestWakeLock();
