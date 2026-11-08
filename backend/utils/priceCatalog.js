const PASSIVE_PATTERNS = [
  "01005", "0201", "0402", "0603", "0805", "1206", "1210", "1411",
  "1812", "2010", "2512", "2917", "1506", "1505", "1515", "1020",
  "1005", "1608", "2012", "3216", "3225", "4532", "5025", "6332",
];

const DIODE_PATTERNS = ["DO-*", "SOD-*", "SMA", "SMB", "SMC", "MELF"];
const SOT_PATTERNS = ["SOT-*", "TO-*"];
const DIP_PATTERNS = ["DIP-*", "PDIP-*", "SIP-*"];
const IC_SMALL_PATTERNS = [
  "SOIC-*", "TSSOP-*", "MSOP-*", "SSOP-*", "HSOP-*", "ESOP-*", "SOP-*",
  "QFN-*", "DFN-*", "VQFN-*", "WQFN-*", "TQFN-*",
];
const IC_MED_PATTERNS = [
  ...IC_SMALL_PATTERNS, "QFP-*", "LQFP-*", "TQFP-*",
];
const IC_LARGE_PATTERNS = [
  "QFP-*", "LQFP-*", "TQFP-*", "BGA-*", "LGA-*", "WLCSP-*",
];
const IC_XLARGE_PATTERNS = [
  "QFP-*", "LQFP-*", "TQFP-*", "BGA-*", "FBGA-*", "LGA-*", "WLCSP-*",
];

const DEFAULT_GROUP = {
  mount: "SMT",
  unit: "con",
  pin_mode: "fixed",
  pin_count: null,
  pin_min: null,
  pin_max: null,
  patterns: [],
  category: "OTHER",
  negative_keywords: "",
  requires_keyword: 0,
  requires_review: 0,
  replace_patterns: false,
};

const g = (code, name, price, priority, keywords, overrides = {}) => ({
  ...DEFAULT_GROUP,
  code,
  name,
  price,
  priority,
  keywords,
  ...overrides,
});

const STANDARD_PRICE_GROUPS = [
  // ============================================================
  // PASSIVE
  // ============================================================
  g("RES", "Điện trở", 200, 120,
    "RES,RESISTOR,RESISTORS,ĐIỆN TRỞ,CHIP RESISTOR,CHIP RESISTORS,SMD RESISTOR,SMD RESISTORS,SHUNT,CURRENT SENSE", {
      category: "PASSIVE",
      negative_keywords: "ARRAY,NETWORK,THERMISTOR,NTC,PTC,POTENTIOMETER,TRIMPOT",
      requires_keyword: 1,
      patterns: PASSIVE_PATTERNS,
      replace_patterns: true,
    }),
  g("CAP", "Tụ điện", 200, 120,
    "CAP,CAPACITOR,CAPACITORS,TỤ,TỤ ĐIỆN,MLCC,CERAMIC CAPACITOR,CERAMIC CAPACITORS,ELECTROLYTIC CAPACITOR,ELECTROLYTIC CAPACITORS,TANTALUM CAPACITOR,TANTALUM CAPACITORS,FILM CAPACITOR,FILM CAPACITORS,SUPERCAP,SUPERCAPACITOR", {
      category: "PASSIVE",
      negative_keywords: "ARRAY,NETWORK,CAPACITOR NETWORK",
      requires_keyword: 1,
      patterns: PASSIVE_PATTERNS,
      replace_patterns: true,
    }),
  g("IND", "Cuộn cảm", 800, 115,
    "INDUCTOR,INDUCTORS,CUỘN CẢM,COIL,COILS,POWER INDUCTOR,POWER INDUCTORS,CHIP INDUCTOR,CHIP INDUCTORS,CHOKE,CHOKES", {
      category: "PASSIVE",
      negative_keywords: "COMMON MODE,LINE FILTER,EMI",
      requires_keyword: 1,
      patterns: PASSIVE_PATTERNS,
      replace_patterns: true,
    }),
  g("FERRITE", "Ferrite bead", 500, 115,
    "FERRITE,FERRITES,FERRITE BEAD,FERRITE BEADS,BEAD,BEADS,CHIP BEAD,CHIP BEADS,CUỘN LỌC", {
      category: "PASSIVE",
      negative_keywords: "COMMON MODE,LINE FILTER",
      requires_keyword: 1,
      patterns: PASSIVE_PATTERNS,
      replace_patterns: true,
    }),
  g("RES_ARRAY", "Điện trở dãy", 1200, 124,
    "RES ARRAY,RES ARRAYS,RESISTOR ARRAY,RESISTOR ARRAYS,RESISTOR NETWORK,RES NETWORK,R NETWORK,RN,MẠNG ĐIỆN TRỞ,ĐIỆN TRỞ DÃY", {
      category: "PASSIVE",
      pin_mode: "manual",
    }),
  g("CAP_ARRAY", "Tụ dãy", 1500, 123,
    "CAP ARRAY,CAP ARRAYS,CAPACITOR ARRAY,CAPACITOR ARRAYS,CAP NETWORK,CAPACITOR NETWORK,TỤ DÃY,MẠNG TỤ", {
      category: "PASSIVE",
      pin_mode: "manual",
    }),
  g("THERMISTOR", "Nhiệt trở", 800, 121,
    "THERMISTOR,THERMISTORS,NTC,PTC THERMISTOR,NTC THERMISTOR,NHIỆT TRỞ,ĐIỆN TRỞ NHIỆT", {
      category: "PASSIVE",
      pin_count: 2,
    }),
  g("POT", "Biến trở", 2500, 107,
    "POTENTIOMETER,POTENTIOMETERS,TRIMMER,TRIMPOT,TRIMPOTS,VARIABLE RESISTOR,VARIABLE RESISTORS,RHEOSTAT,ROTARY POT,BIẾN TRỞ", {
      category: "PASSIVE",
      mount: "Hàn tay",
      pin_mode: "manual",
    }),
  g("EMI", "Lọc nhiễu", 1500, 116,
    "EMI,EMI FILTER,EMI FILTERS,LINE FILTER,LINE FILTERS,COMMON MODE,COMMON MODE CHOKE,COMMON MODE FILTER,LỌC NHIỄU,CUỘN KHÁNG", {
      category: "PASSIVE",
      negative_keywords: "SHIELD",
      pin_mode: "manual",
    }),

  // ============================================================
  // DISCRETE
  // ============================================================
  g("DIODE", "Đi ốt", 800, 113,
    "DIODE,DIODES,ĐI ỐT,ĐIỐT,RECTIFIER,RECTIFIERS,ZENER,ZENER DIODE,SCHOTTKY,SCHOTTKY DIODE,FAST RECOVERY DIODE,ULTRA FAST DIODE,BRIDGE RECTIFIER,VARACTOR,VARACTOR DIODE,SWITCHING DIODE", {
      category: "DISCRETE",
      negative_keywords: "TVS,ESD,PHOTO,LED,OPTO,SUPPRESSOR",
      pin_mode: "parse",
      patterns: DIODE_PATTERNS,
      replace_patterns: true,
    }),
  g("LED", "LED", 300, 113,
    "LED,LEDS,ĐÈN LED,RGB LED,RGB LEDS,WS2812,WS2811,WS2812B,SK6812,NEOPIXEL,IR LED,UV LED,ĐÈN BÁO", {
      category: "DISCRETE",
      negative_keywords: "DRIVER,DISPLAY,SEGMENT",
      pin_count: 2,
    }),
  g("DISPLAY", "Màn hình", 30000, 114,
    "LCD,OLED,TFT,DISPLAY,DISPLAYS,7-SEGMENT,SEVEN SEGMENT,LED DISPLAY,LCD DISPLAY,OLED DISPLAY,TFT DISPLAY,MÀN HÌNH,MÀN HÌNH LCD,MÀN HÌNH OLED", {
      category: "DISCRETE",
      negative_keywords: "DRIVER,CONTROLLER",
      mount: "Gắp tay",
      pin_mode: "manual",
    }),
  g("OPTO", "Opto / cách ly", 3000, 108,
    "OPTOCOUPLER,OPTOCOUPLERS,PHOTOCOUPLER,PHOTOCOUPLERS,PHOTODIODE,PHOTOTRANSISTOR,OPTO,OPTO ISOLATOR,OPTOISOLATOR,CÁCH LY,CÁCH LY QUANG", {
      category: "DISCRETE",
      pin_mode: "parse",
    }),
  g("TRANSISTOR", "Transistor", 800, 112,
    "TRANSISTOR,TRANSISTORS,BJT,BIPOLAR TRANSISTOR,IGBT,DARLINGTON,DARLINGTON TRANSISTOR,JFET,TRIAC,SCR,THYRISTOR", {
      category: "DISCRETE",
      negative_keywords: "MOSFET,DRIVER,MODULE",
      pin_mode: "parse",
    }),
  g("MOSFET", "MOSFET", 1200, 112,
    "MOSFET,MOSFETS,P-CHANNEL MOSFET,N-CHANNEL MOSFET,POWER MOSFET,HEXFET", {
      category: "DISCRETE",
      negative_keywords: "DRIVER,MODULE,ARRAY",
      pin_mode: "parse",
    }),
  g("PROTECTION", "Bảo vệ quá áp", 1500, 116,
    "TVS,TVS DIODE,TVS DIODES,MOV,VARISTOR,ESD SUPPRESSOR,ESD PROTECTION,GDT,SURGE,SURGE PROTECTION,CHỐNG SÉT,BẢO VỆ QUÁ ÁP", {
      category: "DISCRETE",
      pin_mode: "parse",
    }),
  g("FUSE", "Cầu chì", 1000, 114,
    "FUSE,FUSES,PTC FUSE,RESETTABLE FUSE,FUSE HOLDER,CẦU CHÌ,CẦU CHÌ TỰ PHỤC HỒI", {
      category: "DISCRETE",
      pin_count: 2,
    }),
  g("CRYSTAL", "Crystal / Oscillator", 1500, 110,
    "CRYSTAL,CRYSTALS,OSCILLATOR,OSCILLATORS,RESONATOR,RESONATORS,THẠCH ANH,XTAL,TCXO,VCXO,OCXO,CERAMIC RESONATOR", {
      category: "DISCRETE",
      pin_mode: "manual",
    }),

  // ============================================================
  // IC
  // ============================================================
  g("POWER_IC", "IC nguồn / driver", 3000, 110,
    "POWER IC,PMIC,LDO,LDO REGULATOR,REGULATOR,REGULATORS,VOLTAGE REGULATOR,SWITCHING REGULATOR,BUCK,BUCK CONVERTER,BOOST,BOOST CONVERTER,BUCK BOOST,CHARGE PUMP,LED DRIVER,MOTOR DRIVER,MOTOR CONTROLLER,GATE DRIVER,BATTERY CHARGER,CHARGER IC,BATTERY MANAGEMENT,POWER SWITCH,LOAD SWITCH,DC-DC,DC DC CONVERTER", {
      category: "IC",
      negative_keywords: "MODULE",
      pin_mode: "parse",
    }),
  g("IC_MEMORY", "IC bộ nhớ", 4000, 109,
    "MEMORY IC,EEPROM,EEPROM IC,FLASH,FLASH MEMORY,SRAM,DRAM,DDR,DDR2,DDR3,DDR4,DDR5,NAND,NOR,FRAM,MRAM,EPROM,OTP", {
      category: "IC",
      negative_keywords: "MODULE,CARD,GATE",
      pin_mode: "parse",
    }),
  g("IC_SMALL", "IC nhỏ (1-16 chân)", 1500, 100, "", {
    category: "IC",
    pin_mode: "parse",
    pin_min: 1,
    pin_max: 16,
    patterns: IC_SMALL_PATTERNS,
    replace_patterns: true,
  }),
  g("IC_MED", "IC trung (17-64 chân)", 2500, 100, "", {
    category: "IC",
    pin_mode: "parse",
    pin_min: 17,
    pin_max: 64,
    patterns: IC_MED_PATTERNS,
    replace_patterns: true,
  }),
  g("IC_LARGE", "IC lớn (65-128 chân)", 4000, 100, "", {
    category: "IC",
    pin_mode: "parse",
    pin_min: 65,
    pin_max: 128,
    patterns: IC_LARGE_PATTERNS,
    replace_patterns: true,
  }),
  g("IC_XLARGE", "IC rất lớn (129+ chân)", 8000, 102, "", {
    category: "IC",
    pin_mode: "parse",
    pin_min: 129,
    patterns: IC_XLARGE_PATTERNS,
    replace_patterns: true,
  }),
  g("IC_THT", "IC hàn tay (DIP/SIP)", 3000, 105, "", {
    category: "IC",
    mount: "Hàn tay",
    pin_mode: "parse",
    patterns: DIP_PATTERNS,
    replace_patterns: true,
  }),
  g("IC_GENERIC", "IC khác (chưa rõ package)", 2500, 80,
    "IC,ICS,MCU,MCUS,FPGA,CPLD,DSP,SOC,TRANSCEIVER,TRANSCEIVERS,ADC,DAC,COMPARATOR,OP AMP,OPERATIONAL AMPLIFIER,AMPLIFIER,AMPLIFIERS,LOGIC,LOGIC GATE,GATE,MUX,MULTIPLEXER,PORT EXPANSION,I2C,SPI,UART,CAN,RS485,ETHERNET,PHY,USB HUB,CODEC,AUDIO AMP,AUDIO AMPLIFIER,PLL,SUPERVISOR,VOLTAGE REFERENCE,RTC,CONTROLLER,CONTROLLERS,BRIDGE,DISPLAY DRIVER,VI ĐIỀU KHIỂN,CHUYỂN ĐỔI,KHUẾCH ĐẠI,TRUYỀN NHẬN", {
      category: "IC",
      negative_keywords: "MODULE,POWER,REGULATOR,FLASH,MEMORY,EEPROM,SRAM,DDR",
      pin_mode: "manual",
    }),

  // ============================================================
  // CONNECTOR
  // ============================================================
  g("CONN_SMT", "Connector SMT", 3000, 110,
    "SMT CONNECTOR,SMD CONNECTOR,USB-C,USB TYPE-C,TYPE-C,MICRO USB,MINI USB,FFC CONNECTOR,FPC CONNECTOR,BOARD TO BOARD,WIRE TO BOARD,JST,MOLEX,WAFER,CONNECTOR SMT", {
      category: "CONNECTOR",
      negative_keywords: "THT,THROUGH HOLE",
      pin_mode: "manual",
    }),
  g("CONN_THT", "Connector THT", 3000, 110,
    "THT CONNECTOR,THROUGH HOLE CONNECTOR,PIN HEADER,BOX HEADER,TERMINAL BLOCK,IC SOCKET,DIP SOCKET,PLUG HEADER,CONNECTOR THT,BARREL JACK,DC JACK,AUDIO JACK,USB-C THT,USB TYPE-C THT,TYPE-C THT,USB THT,JST THT", {
      category: "CONNECTOR",
      negative_keywords: "SMT,SMD",
      mount: "Hàn tay",
      pin_mode: "manual",
    }),
  g("CONN_SPECIAL", "Connector đặc biệt", 5000, 115,
    "BATTERY CONNECTOR,RF CONNECTOR,SMA CONNECTOR,SMA JACK,BNC CONNECTOR,BNC JACK,POGO,POGO PIN,CARD EDGE,EDGE CONNECTOR,HDMI CONNECTOR,RJ45,RJ11,SIM CONNECTOR,SIM SOCKET,MICROSD,MICRO SD,SD CARD SOCKET,SPRING TERMINAL,SCREW TERMINAL", {
      category: "CONNECTOR",
      negative_keywords: "CABLE",
      pin_mode: "manual",
    }),
  g("CABLE", "Cable / FFC / FPC", 3000, 105,
    "CABLE,CABLES,FFC,FPC,CABLE ASSEMBLY,WIRE,WIRES,WIRE HARNESS,HARNESS,RIBBON CABLE,FLAT CABLE,COAX,COAXIAL,JUMPER WIRE,USB CABLE,POWER CABLE", {
      category: "CONNECTOR",
      mount: "Gắp tay",
      pin_mode: "manual",
    }),

  // ============================================================
  // MECH
  // ============================================================
  g("HEATSINK", "Tản nhiệt", 2000, 106,
    "HEATSINK,HEATSINKS,HEAT SINK,HEAT SINKS,TẢN NHIỆT,TẢN NHIỆT NHÔM,COOLER", {
      category: "MECH",
      mount: "Gắp tay",
      pin_mode: "manual",
    }),
  g("SHIELD", "Shield / chắn nhiễu", 3000, 106,
    "SHIELD,SHIELDS,SHIELDING,SHIELD CAN,RF SHIELD,EMI SHIELD,TẤM CHẮN,TẤM CHẮN NHIỄU", {
      category: "MECH",
      negative_keywords: "CABLE,WIRE",
      mount: "Gắp tay",
      pin_mode: "manual",
    }),
  g("INSULATOR", "Cách điện / cách nhiệt", 500, 106,
    "INSULATOR,INSULATORS,INSULATING,THERMAL INSULATOR,CÁCH ĐIỆN,CÁCH NHIỆT", {
      category: "MECH",
      pin_mode: "manual",
    }),
  g("ENCLOSURE", "Vỏ / hộp", 10000, 106,
    "ENCLOSURE,ENCLOSURES,CASE,BOX,COVER,HOUSING,CHASSIS,VỎ HỘP,HỘP", {
      category: "MECH",
      mount: "Gắp tay",
      pin_mode: "manual",
    }),
  g("ADHESIVE", "Keo / chất dán", 1000, 106,
    "ADHESIVE,ADHESIVES,GLUE,EPOXY,THERMAL GLUE,SILICONE,SEALANT,KEO,KEO DÁN,KEO TẢN NHIỆT", {
      category: "MECH",
      pin_mode: "manual",
    }),
  g("MECH", "Cơ khí khác", 1000, 100,
    "SCREW,SCREWS,NUT,NUTS,STANDOFF,STANDOFFS,WASHER,WASHERS,BRACKET,SPACER,GASKET,O-RING,RIVET,SPRING,KNOB,THERMAL PAD,CABLE TIE,HEAT SHRINK,MAGNET,ỐC,VÍT", {
      category: "MECH",
      mount: "Gắp tay",
      pin_mode: "manual",
    }),

  // ============================================================
  // DEVICE / MODULE
  // ============================================================
  g("TRANSFORMER", "Biến áp", 20000, 112,
    "TRANSFORMER,TRANSFORMERS,MÁY BIẾN ÁP,BIẾN ÁP XUNG,BIẾN ÁP ETHERNET,LAN TRANSFORMER,POWER TRANSFORMER,CURRENT TRANSFORMER,FLYBACK,FLYBACK TRANSFORMER", {
      category: "MODULE",
      mount: "Hàn tay",
      pin_mode: "manual",
    }),
  g("SENSOR", "Cảm biến", 10000, 111,
    "SENSOR,SENSORS,ACCELEROMETER,GYROSCOPE,PIR,HALL,HALL EFFECT,PRESSURE SENSOR,HUMIDITY SENSOR,TEMPERATURE SENSOR,ULTRASONIC,CẢM BIẾN,CẢM BIẾN NHIỆT ĐỘ,CẢM BIẾN ÁP SUẤT,CẢM BIẾN GIA TỐC", {
      category: "MODULE",
      mount: "Gắp tay",
      pin_mode: "manual",
    }),
  g("AUDIO", "Âm thanh", 5000, 109,
    "BUZZER,BUZZERS,SPEAKER,SPEAKERS,MICROPHONE,MICROPHONES,MIC,LOA,CÒI,CHUÔNG,ÂM THANH", {
      category: "MODULE",
      negative_keywords: "AMPLIFIER,CODEC,DRIVER",
      mount: "Hàn tay",
      pin_mode: "manual",
    }),
  g("BATTERY", "Pin / ắc quy", 10000, 109,
    "BATTERY,BATTERIES,COIN CELL,CR2032,CR2016,CR2025,18650,14500,LIPO,LITHIUM BATTERY,BATTERY HOLDER,ẮC QUY,PIN SẠC,PIN CR2032", {
      category: "MODULE",
      negative_keywords: "CHARGER,BATTERY MANAGEMENT",
      mount: "Gắp tay",
      pin_mode: "manual",
    }),
  g("MOTOR", "Động cơ / quạt", 15000, 109,
    "MOTOR,MOTORS,FAN,FANS,SERVO,SERVOS,STEPPER,STEPPER MOTOR,BLOWER,ĐỘNG CƠ,ĐỘNG CƠ BƯỚC,QUẠT", {
      category: "MODULE",
      negative_keywords: "DRIVER,CONTROLLER",
      mount: "Hàn tay",
      pin_mode: "manual",
    }),
  g("RELAY", "Rơ le", 10000, 108,
    "RƠ LE,RELAY,RELAYS,SSR,SOLID STATE RELAY,REED RELAY,CONTACTOR", {
      category: "MODULE",
      mount: "Hàn tay",
      pin_mode: "manual",
    }),
  g("SWITCH", "Switch / Button", 2000, 107,
    "SWITCH,SWITCHES,SWITCH TACTILE,SWITCH SLIDE,TACTILE,TACTILE SWITCH,BUTTON,BUTTONS,SPDT,SPST,NÚT BẤM,NHẤN NHẢ,CÔNG TẮC,DIP SWITCH,ROTARY SWITCH,LIMIT SWITCH,MICRO SWITCH,PUSH BUTTON,SLIDE SWITCH,TOGGLE,TOGGLE SWITCH,ROCKER,ROCKER SWITCH,ENCODER", {
      category: "MODULE",
      negative_keywords: "DRIVER",
      mount: "Hàn tay",
      pin_mode: "manual",
    }),
  g("MODULE", "Module", 5000, 105,
    "MODULE,MODULES,MOD,ADAPTER,ADAPTERS,WIFI,BLUETOOTH,BLE,GPS,GNSS,LORA,ZIGBEE,NB-IOT,GSM,4G,RF MODULE,POWER MODULE,DC-DC MODULE,RELAY MODULE,DEV BOARD,EVAL BOARD,BREAKOUT,CAMERA MODULE,RTC MODULE", {
      category: "MODULE",
      negative_keywords: "SENSOR,RELAY,SHIELD,CHOKE,COMMON MODE",
      mount: "Gắp tay",
      pin_mode: "manual",
    }),
  g("TESTPOINT", "Test point / Clip", 800, 105,
    "TEST POINT,TEST POINTS,TEST CLIP,TEST CLIPS,ALLIGATOR,CROCODILE,TEST PIN,PROBE,ĐIỂM TEST", {
      category: "MODULE",
      negative_keywords: "PAD",
      mount: "Hàn tay",
      pin_mode: "manual",
    }),

  // ============================================================
  // LEGACY / FALLBACK
  // ============================================================
  g("PASSIVE2", "Linh kiện 2 chân (R/C/L)", 200, 50,
    "PASSIVE,PASSIVE 2 CHÂN,RES,RESISTOR,RESISTORS,CAP,CAPACITOR,CAPACITORS,FERRITE,TỤ ĐIỆN,ĐIỆN TRỞ", {
      category: "LEGACY",
      pin_count: 2,
      patterns: PASSIVE_PATTERNS,
      replace_patterns: true,
    }),
  g("SOT", "SOT / TO fallback", 800, 50, "", {
    category: "LEGACY",
    requires_review: 1,
    pin_mode: "parse",
    patterns: SOT_PATTERNS,
    replace_patterns: true,
  }),
  g("CONNECTOR", "Connector fallback", 3000, 50,
    "CONN,CONNECTOR,CONNECTORS,HEADER,HEADERS,RCPT,JACK,SOCKET,SOCKETS,TERMINAL,TERMINALS,USB,PLUG,PLUGS,ĐẦU CẮM", {
      category: "LEGACY",
      mount: "Hàn tay",
      pin_mode: "manual",
    }),
  g("INDUCTOR", "Cuộn cảm legacy", 800, 50,
    "INDUCTOR,INDUCTORS,CUỘN CẢM,COIL,COILS", {
      category: "LEGACY",
      pin_count: 2,
    }),
];

const KEYWORD_PATCH_REMOVE = {
  SOT: [
    "TRANSISTOR", "TRANSISTORS", "DIODE", "DIODES", "MOSFET", "ĐI ỐT", "ĐIỐT",
    "IGBT", "TRIAC", "SCR", "RECTIFIER", "ZENER", "SCHOTTKY", "VARACTOR",
    "BJT", "DARLINGTON", "JFET", "BRIDGE RECTIFIER",
  ],
  MODULE: [
    "SENSOR", "SENSORS", "SHLD", "CHOKE", "CHOKES", "COMMON MODE", "CẢM BIẾN",
  ],
  MECH: [
    "TẢN NHIỆT", "HEATSINK", "ENCLOSURE", "COVER", "INSULATOR", "SHIELD",
  ],
  IC_GENERIC: [
    "REGULATOR", "REGULATORS", "FLASH", "MEMORY", "LDO", "BUCK", "BOOST",
    "CHARGE PUMP", "PWM", "GATE DRIVER", "MOTOR DRIVER", "LED DRIVER",
    "EEPROM", "SRAM", "DDR", "BIẾN ÁP", "OPTO",
  ],
  TESTPOINT: ["TEST PAD"],
  INDUCTOR: ["CHOKE", "CHOKES", "POWER INDUCTOR"],
};

const LEGACY_GROUP_CODES = new Set(["PASSIVE2", "SOT", "CONNECTOR", "INDUCTOR"]);

module.exports = {
  PASSIVE_PATTERNS,
  STANDARD_PRICE_GROUPS,
  KEYWORD_PATCH_REMOVE,
  LEGACY_GROUP_CODES,
};
