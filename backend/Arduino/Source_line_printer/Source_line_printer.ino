#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

#define EEPROM_SIZE 100

// ===================== CẤU HÌNH =====================
const char* ssid = "[ST]-INTERNAL";
const char* password = "NoiBoST@2023";
const char* SERVER_HOST = "http://192.168.100.76:3000";  // ✅ Đặt URL server tại đây
// ====================================================

WebServer server(80);
const int sensorPin = 18;

unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000;
unsigned long lastSentTime = 0;
bool waitingForLow = false;
int lastSensorValue = LOW;

// ----- EEPROM functions giữ nguyên -----
void saveProjectID(String projectID) {
  for (int i = 0; i < projectID.length(); i++) {
    EEPROM.write(i, projectID[i]);
  }
  EEPROM.write(projectID.length(), '\0');
  EEPROM.commit();
  Serial.println("📥 Saved project_id: " + projectID);
}

String readProjectID() {
  char projectID[50];
  for (int i = 0; i < 50; i++) {
    projectID[i] = EEPROM.read(i);
    if (projectID[i] == '\0') break;
  }
  return String(projectID);
}

void saveDelay(int delayVal) {
  EEPROM.write(50, (delayVal >> 8) & 0xFF);  // High byte
  EEPROM.write(51, delayVal & 0xFF);         // Low byte
  EEPROM.commit();
  Serial.printf("💾 Saved debounce delay: %d ms\n", delayVal);
}

int readDelay() {
  int high = EEPROM.read(50);
  int low = EEPROM.read(51);
  return (high << 8) | low;
}

// ----- API gửi dữ liệu cảm biến -----
void sendSensorData(String projectID) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(3000);
    http.begin(String(SERVER_HOST) + "/api/sensor");  // ✅ sử dụng biến IP
    http.addHeader("Content-Type", "application/json");

    String postData = "{\"input_value\":1,\"project_id\":\"" + projectID + "\",\"source\":\"source_1\"}";
    Serial.println("📤 Sending: " + postData);
    int code = http.POST(postData);
    Serial.printf("✅ Sensor data sent. Code: %d\n", code);
    http.end();
  }
}

void sendHeartbeat() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(3000);
    http.begin(String(SERVER_HOST) + "/api/heartbeat");  // ✅ sử dụng biến IP
    http.addHeader("Content-Type", "application/json");

    String postData = "{\"device_id\":\"esp32-001\",\"status\":\"online\"}";
    int code = http.POST(postData);
    Serial.printf("💓 Heartbeat sent. Code: %d\n", code);
    http.end();
  }
}

// ----- Nhận API cấu hình project_id + delay -----
void handleSetProjectAndDelay() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    DynamicJsonDocument doc(256);
    DeserializationError err = deserializeJson(doc, body);

    if (err) {
      server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
      return;
    }

    if (doc.containsKey("project_id")) {
      saveProjectID(doc["project_id"].as<String>());
    }

    if (doc.containsKey("delay")) {
      saveDelay(doc["delay"].as<int>());
    }

    server.send(200, "application/json", "{\"status\":\"ok\"}");
  } else {
    server.send(400, "application/json", "{\"error\":\"No body received\"}");
  }
}

// ----- Setup chính -----
void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  pinMode(sensorPin, INPUT);

  WiFi.begin(ssid, password);
  Serial.print("🔌 Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  WiFi.setSleep(false);
  Serial.println("\n✅ WiFi connected");
  Serial.print("📡 ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  server.on("/set-project-delay", HTTP_POST, handleSetProjectAndDelay);
  server.begin();
  Serial.println("🌐 WebServer started");
}

// ----- Loop chính -----
void loop() {
  server.handleClient();

  static unsigned long wifiLostTime = 0;
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiLostTime == 0) wifiLostTime = millis();
    else if (millis() - wifiLostTime > 60000) {
      Serial.println("⚠️ WiFi failed too long. Restarting ESP...");
      ESP.restart();
    }

    Serial.println("🔌 WiFi lost. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    delay(1000);
    return;
  } else {
    wifiLostTime = 0;
  }

  unsigned long now = millis();
  if (now - lastHeartbeat > heartbeatInterval) {
    sendHeartbeat();
    lastHeartbeat = now;
  }

  int currentSensorValue = digitalRead(sensorPin);
  int debounceDelay = readDelay();

  if (!waitingForLow && currentSensorValue == HIGH && lastSensorValue == LOW) {
    if (now - lastSentTime >= debounceDelay) {
      delay(20); // chống nhiễu nhanh
      if (digitalRead(sensorPin) == HIGH) {
        Serial.println("🚨 Detected object!");
        sendSensorData(readProjectID());
        lastSentTime = now;
        waitingForLow = true;
      }
    } else {
      Serial.println("⏱ Too fast, skipping...");
    }
  }

  if (waitingForLow && currentSensorValue == LOW) {
    waitingForLow = false;
  }

  lastSensorValue = currentSensorValue;
  delay(30);
}
