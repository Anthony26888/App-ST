#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

#define EEPROM_SIZE 100

// ===================== CẤU HÌNH =====================
// const char* ssid = "KTNM2023";
// const char* password = "Sthuat@2023KTNM";
// const char* SERVER_HOST = "http://192.168.1.201";  // ✅ Đặt URL server tại đây

//Test
const char* ssid = "KTNM2023";
const char* password = "Sthuat@2023KTNM";
const char* SERVER_HOST = "http://192.168.2.221"; 
// ====================================================

// ⚙️ IP tĩnh cấu hình
// IPAddress local_IP(192, 168, 1, 82);
// IPAddress gateway(192, 168, 1, 1);
// IPAddress subnet(255, 255, 255, 0);
// IPAddress primaryDNS(8, 8, 8, 8);
// IPAddress secondaryDNS(8, 8, 4, 4);

// ⚙️ IP tĩnh cấu hình test
IPAddress local_IP(192, 168, 2, 82);
IPAddress gateway(192, 168, 2, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);
IPAddress secondaryDNS(8, 8, 4, 4);

WebServer server(80);

// 🟢 KHAI BÁO 2 CẢM BIẾN
const int sensorPin1 = 18;
const int sensorPin2 = 19;

unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000;

// Biến cho sensor 1
bool waitingForLow1 = false;
int lastSensorValue1 = LOW;
unsigned long lastSentTime1 = 0;

// Biến cho sensor 2
bool waitingForLow2 = false;
int lastSensorValue2 = LOW;
unsigned long lastSentTime2 = 0;

// ----------------- EEPROM Functions -----------------
void saveProjectID(String projectID) {
  for (int i = 0; i < projectID.length(); i++) EEPROM.write(i, projectID[i]);
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
  for (int i = 0; i < planID.length(); i++) EEPROM.write(52 + i, planID[i]);
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
  EEPROM.write(50, (delayVal >> 8) & 0xFF);
  EEPROM.write(51, delayVal & 0xFF);
  EEPROM.commit();
  Serial.printf("💾 Saved debounce delay: %d ms\n", delayVal);
}

int readDelay() {
  int high = EEPROM.read(50);
  int low = EEPROM.read(51);
  return (high << 8) | low;
}

// ----------------- Hàm Gửi Dữ Liệu với Retry ------------------
bool postData(String url, String payload) {
  HTTPClient http;
  http.setTimeout(10000); // timeout 10s
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(payload);
  if (httpCode <= 0) {
    Serial.printf("❌ POST failed (%d): %s. Retrying...\n", httpCode, http.errorToString(httpCode).c_str());
    delay(500);
    httpCode = http.POST(payload);
  }

  if (httpCode > 0) {
    Serial.printf("✅ Data sent. Code: %d\n", httpCode);
    String response = http.getString();
    if (response.length() > 0) Serial.println("📩 Server response: " + response);
  } else {
    Serial.printf("❌ Failed after retry. Code: %d\n", httpCode);
  }

  http.end();
  return httpCode > 0;
}

// ----------------- API Gửi Dữ Liệu ------------------
void sendSensorData(String projectID, String planID, String source) {
  String payload = "{\"input_value\":1,"
                   "\"project_id\":\"" + projectID + "\","
                   "\"plan_id\":\"" + planID + "\","
                   "\"source\":\"" + source + "\"}";
  Serial.println("📤 Sending: " + payload);
  postData(String(SERVER_HOST) + "/api/sensor", payload);
}

void sendHeartbeat() {
  String payload = "{\"device_id\":\"esp32-001\",\"status\":\"online\"}";
  bool ok = postData(String(SERVER_HOST) + "/api/heartbeat", payload);
  if (!ok) Serial.println("⚠️ Heartbeat failed!");
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

    if (doc.containsKey("project_id")) saveProjectID(doc["project_id"].as<String>());
    if (doc.containsKey("plan_id")) savePlanID(doc["plan_id"].as<String>());
    if (doc.containsKey("delay")) saveDelay(doc["delay"].as<int>());

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

  pinMode(sensorPin1, INPUT_PULLDOWN);
  pinMode(sensorPin2, INPUT_PULLDOWN);
  delay(1000);

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
  Serial.println("📡 ESP32 IP Address: " + WiFi.localIP().toString());

  lastSensorValue1 = digitalRead(sensorPin1);
  if (lastSensorValue1 == HIGH) {
    waitingForLow1 = true;
    Serial.println("🕒 Sensor 1 HIGH at start. Waiting for LOW...");
  }

  lastSensorValue2 = digitalRead(sensorPin2);
  if (lastSensorValue2 == HIGH) {
    waitingForLow2 = true;
    Serial.println("🕒 Sensor 2 HIGH at start. Waiting for LOW...");
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

  int debounceDelay = readDelay();

  // === XỬ LÝ SENSOR 1 ===
  int currentValue1 = digitalRead(sensorPin1);
  if (!waitingForLow1 && currentValue1 == HIGH && lastSensorValue1 == LOW) {
    if (now - lastSentTime1 >= debounceDelay) {
      delay(20);
      if (digitalRead(sensorPin1) == HIGH) {
        Serial.println("🚨 Sensor 1 triggered!");
        sendSensorData(readProjectID(), readPlanID(), "source_1");
        lastSentTime1 = now;
        waitingForLow1 = true;
      }
    }
  }
  if (waitingForLow1 && currentValue1 == LOW) waitingForLow1 = false;
  lastSensorValue1 = currentValue1;

  // === XỬ LÝ SENSOR 2 ===
  int currentValue2 = digitalRead(sensorPin2);
  if (!waitingForLow2 && currentValue2 == HIGH && lastSensorValue2 == LOW) {
    if (now - lastSentTime2 >= debounceDelay) {
      delay(20);
      if (digitalRead(sensorPin2) == HIGH) {
        Serial.println("🚨 Sensor 2 triggered!");
        sendSensorData(readProjectID(), readPlanID(), "source_3");
        lastSentTime2 = now;
        waitingForLow2 = true;
      }
    }
  }
  if (waitingForLow2 && currentValue2 == LOW) waitingForLow2 = false;
  lastSensorValue2 = currentValue2;

  delay(30);
}
