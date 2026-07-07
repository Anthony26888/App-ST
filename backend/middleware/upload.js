const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ===============================
// Tạo thư mục nếu chưa tồn tại
// ===============================

function createFolder(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

// ===============================
// Hàm tạo Storage
// ===============================

function createStorage(folder) {
  createFolder(folder);

  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, folder);
    },

    filename(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  });
}

// ===============================
// Hàm tạo Upload
// ===============================

function createUpload({ folder, extensions = [], maxSize = 100 }) {
  return multer({
    storage: createStorage(folder),

    limits: {
      fileSize: maxSize * 1024 * 1024,
    },

    fileFilter(req, file, cb) {
      if (extensions.length === 0) {
        return cb(null, true);
      }

      const ext = path.extname(file.originalname).toLowerCase();

      if (extensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`File không hợp lệ (${ext})`));
      }
    },
  });
}

// ===============================
// Upload BOM
// ===============================

const upload = createUpload({
  folder: "uploads",
  extensions: [
    ".xlsx",
    ".csv",
    ".gbr",
    ".gtl",
    ".gbl",
    ".gts",
    ".gbs",
    ".drl",
    ".ger",
    ".gtp",
    ".gbp",
    ".gko",
    ".cam",
    ".gto",
    ".gbo",
  ],
});

// ===============================
// Upload Pick Place
// ===============================

const uploadPnP = createUpload({
  folder: "uploads/pickplace",
  extensions: [".xlsx"],
});

// ===============================
// Upload Gerber
// ===============================

const uploadGerber = createUpload({
  folder: "uploads/gerber",
});

// ===============================
// Upload BOM Highlight
// ===============================

const uploadImageMPN = createUpload({
  folder: "uploads/bomhighlight",

  extensions: [".png", ".jpg", ".jpeg", ".webp", ".heic"],
});

// ===============================
// Upload QC
// ===============================

const uploadImageQC = createUpload({
  folder: "uploads/qc",

  extensions: [".png", ".jpg", ".jpeg", ".webp", ".heic", ".pdf"],
});

// ===============================
// Upload Machine
// ===============================

const uploadMachine = multer({
  storage: createStorage("uploads/machine"),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter(req, file, cb) {
    const allowMime = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/heic",
    ];

    if (allowMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép file ảnh"));
    }
  },
});

// ===============================
// Export
// ===============================

module.exports = {
  upload,

  uploadPnP,

  uploadGerber,

  uploadImageMPN,

  uploadImageQC,

  uploadMachine,
};
