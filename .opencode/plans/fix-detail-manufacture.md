# Plan: Fix Page-DetailManufacture.vue — Phase 1 + 2 + 4

## File chính: `frontend/src/pages/Page-Manufacture/Page-DetailManufacture.vue`
## Composable: `frontend/src/composables/Manufacture/useManufactureFail.js`

---

## Phase 1 — Fix P0 Bugs (Crash + Hiển thị sai)

### 1.1: Tạo `GetItemHistory()` + DialogRemoveHistory

**Vấn đề**: Dòng 751 gọi `GetItemHistory(item)` nhưng hàm chưa tồn tại → crash khi bấm xóa lịch sử.

**Sửa (template, sau DialogRemove ~dòng 982)** — thêm dialog mới:
```html
<!-- Dialog Remove History -->
<BaseDialog
  v-model="DialogRemoveHistory"
  title="Xoá lịch sử sản xuất"
  icon="mdi-trash-can"
  max-width="500px"
>
  Bạn có chắc chắn muốn xóa bản ghi lịch sử này?
  <template #actions>
    <v-spacer />
    <ButtonCancel @cancel="DialogRemoveHistory = false" />
    <ButtonDelete @delete="RemoveItemHistory()" />
  </template>
</BaseDialog>
```

**Sửa (script, thêm trước `SaveEdit` ~dòng 1790)** — tạo hàm mới:
```js
const GetItemHistory = (item) => {
  GetIDHistory.value = item.id;
  GetSourceHistory.value = item.Source;
  DialogRemoveHistory.value = true;
};
```

---

### 1.2: Fix Card "Còn lại" percent sai

**Vấn đề**: Card "Còn lại" hiển thị giá trị = `totalInput - totalOutput` nhưng percent = `PercentError` = `(totalError × 100) / totalInput` → hai khái niệm khác nhau.

**Sửa (script, sau PercentError ~dòng 1096)** — thêm computed mới:
```js
const PercentRemaining = computed(() => {
  if (!totalInput.value) return 0;
  return Number(
    ((totalInput.value - totalOutput.value) * 100) / totalInput.value,
  ).toFixed(1);
});
```

**Sửa (template, card "Còn lại" ~dòng 66-81)** — đổi_percent tham chiếu:
```html
<!-- Thay PercentError bằng PercentRemaining -->
<div class="text-h6 font-weight-medium text-warning mb-1">
  {{ PercentRemaining }}%
</div>
<!-- ... -->
<v-progress-linear
  v-model="PercentRemaining"
  height="8"
  color="warning"
  ...
/>
```

---

### 1.3: Fix `pieDataTopBottom` "Còn lại" = 0% luôn

**Vấn đề**: Dòng 1388 dùng `divisor = pieTop + pieBottom` → tổng top% + bottom% = 100% → "Còn lại" luôn = 0.

**Sửa (dòng 1372-1413)** — đổi logic tính phần trăm:
```js
const pieDataTopBottom = computed(() => {
  const pieTop = Number(totalPassTop.value) || 0;
  const pieBottom = Number(totalPassBottom.value) || 0;
  const total = Number(totalInput.value) || 0;

  if (total === 0 && pieTop === 0 && pieBottom === 0) {
    return [
      {
        key: 1,
        title: "Còn lại",
        value: 100,
        color: "rgba(var(--v-theme-on-surface), .2)",
        pattern: "url(#pattern-0)",
      },
    ];
  }

  const divisor = total || 1;
  const topPercent = Number(((pieTop / divisor) * 100).toFixed(1)) || 0;
  const bottomPercent = Number(((pieBottom / divisor) * 100).toFixed(1)) || 0;

  return [
    {
      key: 1,
      title: "Top",
      value: topPercent,
      color: "#1976d2",
    },
    {
      key: 2,
      title: "Bottom",
      value: bottomPercent,
      color: "#ff6361",
    },
    {
      key: 3,
      title: "Còn lại",
      value: Math.max(100 - topPercent - bottomPercent, 0),
      color: "rgba(var(--v-theme-on-surface), .2)",
      pattern: "url(#pattern-0)",
    },
  ];
});
```

---

## Phase 2 — Fix P1 Bugs

### 2.1: Header table "Thời gian (s)" → "Thời gian (giờ)"

**Vấn đề**: Header table ghi "(s)" nhưng giá trị Time_Plan tính bằng giờ.

**Sửa (dòng 1189)**:
```
// Trước:
{ title: "Thời gian (s)", key: "Time_Plan" },
// Sau:
{ title: "Thời gian (giờ)", key: "Time_Plan" },
```

---

### 2.2: Fix `selectCard()` passOneSide logic

**Vấn đề**: Dòng 1757-1763 gán sai giá trị passOneSide.

**Sửa (dòng 1743-1771)** — xóa 2 đoạn if ghi đè:
```js
if (title === "SMT" || title === "AOI") {
  passTop.value = historys.value
    .filter((item) => item.Surface === "TOP")
    .reduce((sum, item) => sum + Number(item.Quantity || 0), 0);

  passBottom.value = historys.value
    .filter((item) => item.Surface === "BOTTOM")
    .reduce((sum, item) => sum + Number(item.Quantity || 0), 0);

  passOneSide.value = historys.value
    .filter((item) => item.Surface === "1 Mặt")
    .reduce((sum, item) => sum + Number(item.Quantity || 0), 0);
} else {
  passTop.value = 0;
  passBottom.value = 0;
  passOneSide.value = historys.value
    .filter((item) => item.Surface === "1 Mặt")
    .reduce((sum, item) => sum + Number(item.Quantity || 0), 0);
}
```

---

### 2.3: Validate `manufactureFail` data

**Vấn đề**: `useManufactureFail.js` dòng 22-25 luôn gán data dù không phải array.

**Sửa (`frontend/src/composables/Manufacture/useManufactureFail.js`)** — dòng 22-25:
```js
// Trước:
socket.on("ManufactureFailData", (data) => {
  if (Array.isArray(data)) {}
  manufactureFail.value = data;
});
// Sau:
socket.on("ManufactureFailData", (data) => {
  manufactureFail.value = Array.isArray(data) ? data : [];
});
```

---

## Phase 4 — Tech Debt / Cleanup

### 4.1: Xóa unused imports

**Xóa dòng 1004:**
```js
// Xóa:
import Chart from "chart.js/auto";
```

**Xóa dòng 1027:**
```js
// Xóa:
import PointLineChartSummary from "@/components/Chart-PointLine-Summary.vue";
```

---

### 4.2: Xóa dead code

**Xóa `planList` computed (dòng 1276-1280):**
```js
// Xóa toàn bộ:
const planList = computed(() =>
  history.value
    .filter((item) => item.Type === selectedTitle.value)
    .map((item) => Number(item.Quantity_Plan || 0)),
);
```

**Xóa `percent` computed (dòng 1655-1661):**
```js
// Xóa toàn bộ:
// Computed percent Input and Output
const percent = computed(() => {
  if (totalInput.value === 0 || totalWarehouse.value === 0) {
    return 0;
  }
  return Math.round((totalWarehouse.value / totalInput.value) * 100);
});
```

**Xóa CSS `.chart-container` (dòng 2078-2090):**
```css
/* Xóa:
.chart-container { ... }
.chart-container canvas { ... }
*/
```

---

### 4.3: Refactor `GetItem` / `GetItemOutput` gộp chung

**Sửa (dòng 1690-1718)** — tạo hàm chung + refactor:
```js
const populateEditFields = (item) => {
  Type_Edit.value = item.Type;
  PONumber_Edit.value = item.PONumber;
  Name_Order_Edit.value = item.Name_Order;
  Category_Edit.value = item.Category;
  Line_Edit.value = item.Line_SMT;
  Surface_Edit.value = item.Surface;
  Quantity_Plan_Edit.value = item.Quantity_Plan;
  CycleTime_Edit.value = item.CycleTime_Plan;
  Time_Edit.value = item.Time_Plan;
  Note_Edit.value = item.Note;
  Date_DetailManufacture_Edit.value = item.Created_At;
};

const GetItem = (item) => {
  DialogEdit.value = true;
  populateEditFields(item);
  GetID.value = item.id;
};

const GetItemOutput = (item) => {
  populateEditFields(item);
  GetID.value = item.id;
};
```

---

### 4.4: Fix `PercentOutput` string → Number

**Vấn đề**: `.toFixed(1)` trả string, v-model progress linear expects Number.

**Sửa (dòng 1090-1092)**:
```js
// Trước:
const PercentOutput = computed(() =>
  Number.parseFloat((totalOutput.value * 100) / totalInput.value).toFixed(1),
);
// Sau:
const PercentOutput = computed(() =>
  Number(Number((totalOutput.value * 100) / totalInput.value).toFixed(1)),
);
```

**Sửa (dòng 1094-1096, PercentError tương tự):**
```js
// Trước:
const PercentError = computed(() =>
  Number.parseFloat((totalError.value * 100) / totalInput.value).toFixed(1),
);
// Sau:
const PercentError = computed(() =>
  Number(Number((totalError.value * 100) / totalInput.value).toFixed(1)),
);
```

---

## Verify

1. `vite build` pass
2. Kiểm tra card "Còn lại" hiển thị đúng % = (totalInput - totalOutput) / totalInput
3. Pie chart Top/Bottom có slice "Còn lại" hiển thị đúng khi tổng < 100%
4. Bấm nút xóa lịch sử → dialog hiện → xóa thành công
5. Header table hiện "Thời gian (giờ)"
