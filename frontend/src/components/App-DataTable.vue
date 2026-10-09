<!--
  Bảng dùng chung toàn app: chảy tự nhiên theo data (chuẩn dashboard hiện đại),
  Việt hóa sẵn, density theo màn hình.

  Dùng thay v-data-table-virtual / v-data-table ở trang chính:
    <AppDataTable :headers="Headers" :items="items" :search="search">
      <template #item.Status="{ value }">...</template>
    </AppDataTable>

  - Cao tự nhiên, KHÔNG ép khung: thead dính (sticky) khi cuộn trang,
    footer/phân trang nằm ngay dưới bảng trong flow nên không bao giờ mất.
  - Mọi slots (item.*, group-header, expanded-row, top, bottom, no-data...)
    và mọi v-model (search, page, expanded, selected, sort-by, items-per-page)
    đều passthrough NGUYÊN OBJECT xuống table gốc qua render function —
    migrate chỉ cần đổi tên tag.

  Props riêng:
    virtual (default true)  - false để dùng v-data-table thường (bảng nhỏ/dialog)
    density                 - ép density, bỏ trống để tự theo màn hình
    groupBy                 - truyền thẳng :group-by
    showExpand / showSelect - cờ hiển thị
    itemValue (default 'id')
    height                  - CHỈ dùng khi thật sự cần scroll nội bộ;
                              bỏ trống = cao tự nhiên (khuyên dùng)
-->
<script>
import { computed, h, ref } from "vue";
import { useDisplay } from "vuetify";
import { VDataTable, VDataTableVirtual } from "vuetify/components";

export default {
  inheritAttrs: false,
  props: {
    virtual: { type: Boolean, default: true },
    density: { type: String, default: "" },
    groupBy: { type: [Array, Object, String], default: undefined },
    showExpand: { type: Boolean, default: false },
    showSelect: { type: Boolean, default: false },
    itemValue: { type: String, default: "id" },
    fixedHeader: { type: Boolean, default: true },
    hover: { type: Boolean, default: true },
    height: { type: String, default: "" },
    // Ẩn footer trong bảng (dùng khi dựng phân trang ngoài, không phụ thuộc internals)
    hideFooter: { type: Boolean, default: false },
    // Footer dính đáy viewport cho bảng dài (VD: expand rows).
    // Chỉ bật khi trang cuộn được (page scroll) — bảng dialog/short không cần.
    stickyFooter: { type: Boolean, default: false },
    loadingText: { type: String, default: "Đang tải dữ liệu..." },
    noDataText: { type: String, default: "Không có dữ liệu" },
    noResultsText: { type: String, default: "Không tìm thấy kết quả" },
    footerProps: {
      type: Object,
      default: () => ({
        "items-per-page-options": [10, 20, 50, 100],
        "items-per-page-text": "Số hàng mỗi trang",
      }),
    },
    headerProps: {
      type: Object,
      default: () => ({
        sortByText: "Sắp xếp theo",
        sortDescText: "Giảm dần",
        sortAscText: "Tăng dần",
      }),
    },
  },
  setup(props, { slots, attrs, expose }) {
    const { mdAndDown } = useDisplay();

    const finalDensity = computed(
      () => props.density || (mdAndDown.value ? "compact" : "comfortable"),
    );

    // Ref tới table gốc để chuyển tiếp API (VD: scrollToIndex cho bảng QC)
    const innerTable = ref(null);
    expose({
      scrollToIndex: (...args) =>
        innerTable.value?.scrollToIndex?.(...args),
    });

    return () => {
      const { class: attrsClass, style: attrsStyle, ...restAttrs } = attrs;
      return h(
        props.virtual ? VDataTableVirtual : VDataTable,
        {
          ...restAttrs,
          ref: innerTable,
          class: [
            "app-fit-table",
            { "app-sticky-footer": props.stickyFooter },
            attrsClass,
          ],
          style: attrsStyle,
          density: finalDensity.value,
          groupBy: props.groupBy,
          showExpand: props.showExpand,
          showSelect: props.showSelect,
          itemValue: props.itemValue,
          fixedHeader: props.fixedHeader,
          hover: props.hover,
          hideDefaultFooter: props.hideFooter,
          height: props.height || undefined,
          loadingText: props.loadingText,
          noDataText: props.noDataText,
          noResultsText: props.noResultsText,
          footerProps: props.footerProps,
          headerProps: props.headerProps,
        },
        slots,
      );
    };
  },
};
</script>

<style scoped>
/* thead dính dưới app-bar (cao 64px) khi cuộn trang */
.app-fit-table thead th {
  position: sticky;
  top: 64px;
  z-index: 2;
  background: rgb(var(--v-theme-surface));
}

/* Footer dính đáy viewport cho bảng dài + expand rows */
.app-sticky-footer .v-data-table-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
