#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

#define EEPROM_SIZE 100

// ===================== CẤU HÌNH =====================
const char* ssid = "KTNM2023";
const char* password = "Sthuat@2023KTNM";
const char* SERVER_HOST = "https://erpst.io.vn";  // ✅ HTTPS

// ⚙️ IP tĩnh
IPAddress local_IP(192, 168, 1, 82);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);
IPAddress secondaryDNS(8, 8, 4, 4);

WebServer server(80);

// 🟢 Sensor pins
const int sensorPin1 = 18;
const int sensorPin2 = 19;

unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000;

bool waitingForLow1 = false;
int lastSensorValue1 = LOW;
unsigned long lastSentTime1 = 0;

bool waitingForLow2 = false;
int lastSensorValue2 = LOW;
unsigned long lastSentTime2 = 0;

// ===================== CHỨNG CHỈ SSL =====================
const char* rootCACertificate = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIDpzCCA0ygAwIBAgIRAM89AnitPXQ/DdIQIu2U7JEwCgYIKoZIzj0EAwIwOzEL\n" \
"MAkGA1UEBhMCVVMxHjAcBgNVBAoTFUdvb2dsZSBUcnVzdCBTZXJ2aWNlczEMMAoG\n" \
"A1UEAxMDV0UxMB4XDTI1MTAxNDA3NTczNFoXDTI2MDExMjA4NTUxNlowFjEUMBIG\n" \
"A1UEAxMLZXJwc3QuaW8udm4wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQrY8yf\n" \
"nMVP84cGUqGx5p9KZt/nkk6k43ZPQTygDQUnR43cdIhYAcMXEIkMpMaVMXfNvCzE\n" \
"BGx0wZ1TJcmnRXwko4ICVDCCAlAwDgYDVR0PAQH/BAQDAgeAMBMGA1UdJQQMMAoG\n" \
"CCsGAQUFBwMBMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFF9COJzSeRaQZO/QPM1n\n" \
"EDFWiGtzMB8GA1UdIwQYMBaAFJB3kjVnxP+ozKnme9mAeXvMk/k4MF4GCCsGAQUF\n" \
"BwEBBFIwUDAnBggrBgEFBQcwAYYbaHR0cDovL28ucGtpLmdvb2cvcy93ZTEvenow\n" \
"MCUGCCsGAQUFBzAChhlodHRwOi8vaS5wa2kuZ29vZy93ZTEuY3J0MCUGA1UdEQQe\n" \
"MByCC2VycHN0LmlvLnZugg0qLmVycHN0LmlvLnZuMBMGA1UdIAQMMAowCAYGZ4EM\n" \
"AQIBMDYGA1UdHwQvMC0wK6ApoCeGJWh0dHA6Ly9jLnBraS5nb29nL3dlMS9mSmVk\n" \
"bUwycGV0by5jcmwwggEFBgorBgEEAdZ5AgQCBIH2BIHzAPEAdgDRbqmlaAd+ZjWg\n" \
"Pzel3bwDpTxBEhTUiBj16TGzI8uVBAAAAZnh8G+2AAAEAwBHMEUCIQDcYyacYS+k\n" \
"VsvHcsajxyLESq1A3SzBFVp8N9fag5aiHAIgcnDKxJ8OxpN8DdOEAX7XENt/ltjR\n" \
"P1fjP8YNtlqzfMcAdwCWl2S/VViXrfdDh2g3CEJ36fA61fak8zZuRqQ/D8qpxgAA\n" \
"AZnh8G8SAAAEAwBIMEYCIQCosUL2Jw+kWA3p1G38XS+AjCIXSdk99kz3BMnBINjD\n" \
"LwIhAJLZmZlPKbS8q2xvlRecldH5Xoz0zew8fqTjYNrxxqWHMAoGCCqGSM49BAMC\n" \
"A0kAMEYCIQCNX+Bp8pdWCFixpVRbTUl+8IDWNF3k+U6eqw0m0LzEhAIhAJ3L9NUY\n" \
"DXJo3kXaz4Wn1GxS1goR/dCrAStv/Y6wkNc2\n" \
"-----END CERTIFICATE-----\n";

// ----------------- EEPROM -----------------
void saveProjectID(String projectID) {
  for (int i = 0; i < projectID.length(); i++) EEPROM.write(i, projectID[i]);
  EEPROM.write(projectID.length(), '\0');
  EEPROM.commit();
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
}

int readDelay() {
  int high = EEPROM.read(50);
  int low = EEPROM.read(51);
  return (high << 8) | low;
}

// ----------------- POST DATA (HTTPS) -----------------
bool postData(String url, String payload) {
  WiFiClientSecure *client = new WiFiClientSecure;
  client->setCACert(rootCACertificate);

  HTTPClient https;
  https.setTimeout(10000);
  if (!https.begin(*client, url)) {
    Serial.println("❌ HTTPS begin failed");
    delete client;
    return false;
  }

  https.addHeader("Content-Type", "application/json");
  int httpCode = https.POST(payload);
  if (httpCode <= 0) {
    Serial.printf("❌ HTTPS POST failed (%d): %s\n", httpCode, https.errorToString(httpCode).c_str());
    https.end();
    delete client;
    return false;
  }

  Serial.printf("✅ HTTPS POST OK. Code: %d\n", httpCode);
  String response = https.getString();
  if (response.length() > 0) Serial.println("📩 " + response);
  https.end();
  delete client;
  return true;
}

// ----------------- API gửi cảm biến -----------------
void sendSensorData(String projectID, String planID, String source) {
  String payload = "{\"input_value\":1,"
                   "\"project_id\":\"" + projectID + "\","
                   "\"plan_id\":\"" + planID + "\","
                   "\"source\":\"" + source + "\"}";
  Serial.println("📤 " + payload);
  postData(String(SERVER_HOST) + "/api/sensor", payload);
}

void sendHeartbeat() {
  String payload = "{\"device_id\":\"esp32-002\",\"status\":\"online\"}";
  postData(String(SERVER_HOST) + "/api/heartbeat", payload);
}

// ----------------- API local -----------------
void handleSetProjectAndDelay() {
  if (server.hasArg("plain")) {
    DynamicJsonDocument doc(256);
    if (deserializeJson(doc, server.arg("plain"))) {
      server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
      return;
    }
    if (doc.containsKey("project_id")) saveProjectID(doc["project_id"].as<String>());
    if (doc.containsKey("plan_id")) savePlanID(doc["plan_id"].as<String>());
    if (doc.containsKey("delay")) saveDelay(doc["delay"].as<int>());

    server.send(200, "application/json", "{\"status\":\"ok\"}");
  } else server.send(400, "application/json", "{\"error\":\"No body\"}");
}

void handleGetConfig() {
  DynamicJsonDocument doc(256);
  doc["project_id"] = readProjectID();
  doc["plan_id"] = readPlanID();
  doc["delay"] = readDelay();
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

// ----------------- SETUP -----------------
void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);

  pinMode(sensorPin1, INPUT_PULLDOWN);
  pinMode(sensorPin2, INPUT_PULLDOWN);

  if (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
    Serial.println("⚠️ Không thể cấu hình IP tĩnh");
  }

  WiFi.begin(ssid, password);
  Serial.print("🔌 Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  WiFi.setSleep(false);
  Serial.println("\n✅ WiFi connected");
  Serial.println(WiFi.localIP());

  lastSensorValue1 = digitalRead(sensorPin1);
  lastSensorValue2 = digitalRead(sensorPin2);

  server.on("/set-project-delay", HTTP_POST, handleSetProjectAndDelay);
  server.on("/get-config", HTTP_GET, handleGetConfig);
  server.begin();
  Serial.println("🌐 WebServer started");
}

// ----------------- LOOP -----------------
void loop() {
  server.handleClient();

  static unsigned long wifiLostTime = 0;
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiLostTime == 0) wifiLostTime = millis();
    else if (millis() - wifiLostTime > 60000) ESP.restart();
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    delay(1000);
    return;
  } else wifiLostTime = 0;

  unsigned long now = millis();
  if (now - lastHeartbeat > heartbeatInterval) {
    sendHeartbeat();
    lastHeartbeat = now;
  }

  int debounceDelay = readDelay();

  int currentValue1 = digitalRead(sensorPin1);
  if (!waitingForLow1 && currentValue1 == HIGH && lastSensorValue1 == LOW) {
    if (now - lastSentTime1 >= debounceDelay) {
      delay(20);
      if (digitalRead(sensorPin1) == HIGH) {
        sendSensorData(readProjectID(), readPlanID(), "source_4");
        lastSentTime1 = now;
        waitingForLow1 = true;
      }
    }
  }
  if (waitingForLow1 && currentValue1 == LOW) waitingForLow1 = false;
  lastSensorValue1 = currentValue1;

  int currentValue2 = digitalRead(sensorPin2);
  if (!waitingForLow2 && currentValue2 == HIGH && lastSensorValue2 == LOW) {
    if (now - lastSentTime2 >= debounceDelay) {
      delay(20);
      if (digitalRead(sensorPin2) == HIGH) {
        sendSensorData(readProjectID(), readPlanID(), "source_5");
        lastSentTime2 = now;
        waitingForLow2 = true;
      }
    }
  }
  if (waitingForLow2 && currentValue2 == LOW) waitingForLow2 = false;
  lastSensorValue2 = currentValue2;

  delay(30);
}
