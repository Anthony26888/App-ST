#define SENSOR_PIN 2  // Cảm biến nối vào chân D2

bool previousState = HIGH;

void setup() {
  pinMode(SENSOR_PIN, INPUT);
  Serial.begin(9600);
}

void loop() {
  bool currentState = digitalRead(SENSOR_PIN);

  // Cảm biến phát hiện vật (LOW), và chỉ gửi 1 lần khi chuyển từ HIGH → LOW
  if (previousState == HIGH && currentState == LOW) {
    Serial.println("1");  // chỉ gửi 1 mỗi lần vật đi qua
    delay(100);           // tránh rung (debounce)
  }

  previousState = currentState;
}
