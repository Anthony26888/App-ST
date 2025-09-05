#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

#define EEPROM_SIZE 100

// ===================== CẤU HÌNH =====================
const char* ssid = "KTNM2023";
const char* password = "Sthuat@2023KTNM";
const char* SERVER_HOST = "http://192.168.1.200";  // ✅ Đặt URL server tại đây
// ====================================================

// ⚙️ IP tĩnh cấu hình
IPAddress local_IP(192, 168, 1, 82);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);
IPAddress secondaryDNS(8, 8, 4, 4);

WebServer server(80);
const int sensorPin = 18;

unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000;
unsigned long lastSentTime = 0;
bool waitingForLow = false;
int lastSensorValue = LOW;

// ----------------- EEPROM Functions -----------------
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

void savePlanID(String planID) {
  for (int i = 0; i < planID.length(); i++) {
    EEPROM.write(52 + i, planID[i]);
  }
  EEPROM.write(52 + planID.length(), '\0');
  EEPROM.commit();
  Serial.println("📥 Saved plan_id: " + planID);
}

String readPlanID() {
  char planID[48];
  for (int i = 0; i < 48; i++) {
    planID[i] = EEPROM.read(52 + i);
    if (planID[i] == '\0') break;
  }
  return String(planID);
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

// ----------------- API Gửi Dữ Liệu ------------------
void sendSensorData(String projectID, String planID) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(3000);
    http.begin(String(SERVER_HOST) + "/api/sensor");
    http.addHeader("Content-Type", "application/json");

    String postData = "{\"input_value\":1,"
                      "\"project_id\":\"" + projectID + "\","
                      "\"plan_id\":\"" + planID + "\","
                      "\"source\":\"source_1\"}";

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
    http.begin(String(SERVER_HOST) + "/api/heartbeat");
    http.addHeader("Content-Type", "application/json");

    String postData = "{\"device_id\":\"esp32-001\",\"status\":\"online\"}";
    int code = http.POST(postData);
    Serial.printf("💓 Heartbeat sent. Code: %d\n", code);
    http.end();
  }
}

// ------------- API Nhận Cấu Hình POST ---------------
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

    if (doc.containsKey("plan_id")) {
      savePlanID(doc["plan_id"].as<String>());
    }

    if (doc.containsKey("delay")) {
      saveDelay(doc["delay"].as<int>());
    }

    server.send(200, "application/json", "{\"status\":\"ok\"}");
  } else {
    server.send(400, "application/json", "{\"error\":\"No body received\"}");
  }
}

// ------------- API Xem Cấu Hình GET -----------------
void handleGetConfig() {
  DynamicJsonDocument doc(256);
  doc["project_id"] = readProjectID();
  doc["plan_id"] = readPlanID();
  doc["delay"] = readDelay();

  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

// ----------------- Setup Chính ----------------------
void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);

  pinMode(sensorPin, INPUT_PULLDOWN);
  delay(1000);  // Cho cảm biến ổn định

  // ⚙️ Gán IP tĩnh trước khi kết nối WiFi
  if (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
    Serial.println("⚠️ Không thể cấu hình IP tĩnh");
  }

  WiFi.begin(ssid, password);
  Serial.print("🔌 Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  WiFi.setSleep(false);
  Serial.println("\n✅ WiFi connected");

  for (int i = 0; i < 3; i++) {
    Serial.println("📡 ESP32 IP Address: " + WiFi.localIP().toString());
    delay(5000);
  }

  lastSensorValue = digitalRead(sensorPin);
  if (lastSensorValue == HIGH) {
    waitingForLow = true;
    Serial.println("🕒 Initial sensor HIGH. Waiting for LOW...");
  }

  server.on("/set-project-delay", HTTP_POST, handleSetProjectAndDelay);
  server.on("/get-config", HTTP_GET, handleGetConfig);
  server.begin();
  Serial.println("🌐 WebServer started");
}

// ----------------- Loop Chính -----------------------
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
      delay(20);
      if (digitalRead(sensorPin) == HIGH) {
        Serial.println("🚨 Detected object!");
        sendSensorData(readProjectID(), readPlanID());
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
