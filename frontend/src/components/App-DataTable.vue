<!--
  Bảng dùng chung toàn app: tự vừa khít chiều cao (flex-fill),
  Việt hóa sẵn, density theo màn hình.

  Dùng thay v-data-table-virtual / v-data-table ở trang chính:
    <AppDataTable :headers="Headers" :items="items" :search="search">
      <template #item.Status="{ value }">...</template>
    </AppDataTable>

  Mọi slots (item.*, group-header, expanded-row, top, bottom, no-data...)
  và mọi v-model (search, page, expanded, selected, sort-by, items-per-page)
  đều passthrough NGUYÊN OBJECT xuống table gốc qua render function
  (không dùng dynamic slot-name nên không gãy runtime) —
  migrate chỉ cần đổi tên tag.

  Props riêng:
    virtual (default true)  - false để dùng v-data-table thường (bảng nhỏ/dialog)
    density                 - ép density, bỏ trống để tự theo màn hình
    groupBy                 - truyền thẳng :group-by
    showExpand / showSelect - cờ hiển thị
    itemValue (default 'id')
    fill (default true)     - false cho bảng trong dialog (cao tự nhiên)
    height                  - cao tường minh khi cần; fill=true + bỏ trống => '100%'
    fitViewport             - tự đo viewport: cao = đáy màn hình - đỉnh bảng - margin
                              (cho trang cuộn tự nhiên, không flex cha).
                              Ưu tiên thấp hơn height tường minh.
    viewportMargin (default 16) - chừa đáy (px) khi fitViewport
    minHeight (default 280) - cao tối thiểu (px) khi fill/fitViewport
-->
<script>
import {
  computed,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
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
    fill: { type: Boolean, default: true },
    height: { type: String, default: "" },
    fitViewport: { type: Boolean, default: false },
    viewportMargin: { type: Number, default: 16 },
    minHeight: { type: Number, default: 280 },
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

    // Đo chiều cao vừa khít viewport (cho trang cuộn tự nhiên):
    // cao = đáy viewport - đỉnh bảng - margin, kẹp minHeight.
    const fitHeight = ref("");
    let rafId = 0;
    let ro = null;
    const updateFit = () => {
      if (!props.fitViewport) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = innerTable.value?.$el;
        if (!el || typeof window === "undefined") return;
        const top = el.getBoundingClientRect().top;
        const px = Math.max(
          props.minHeight,
          Math.floor(window.innerHeight - top - props.viewportMargin),
        );
        fitHeight.value = `${px}px`;
      });
    };
    const onResize = () => updateFit();
    onMounted(() => {
      if (!props.fitViewport) return;
      nextTick(updateFit);
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(updateFit);
        ro.observe(document.body);
      }
    });
    onUnmounted(() => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      ro?.disconnect();
    });

    return () => {
      const { class: attrsClass, style: attrsStyle, ...restAttrs } = attrs;
      const useFillClass = props.fill || props.fitViewport;
      return h(
        props.virtual ? VDataTableVirtual : VDataTable,
        {
          ...restAttrs,
          ref: innerTable,
          class: ["app-fit-table", { "app-fit-table--fill": useFillClass }, attrsClass],
          style: attrsStyle,
          density: finalDensity.value,
          groupBy: props.groupBy,
          showExpand: props.showExpand,
          showSelect: props.showSelect,
          itemValue: props.itemValue,
          fixedHeader: props.fixedHeader,
          hover: props.hover,
          height:
            props.height ||
            fitHeight.value ||
            (props.fill ? "100%" : undefined),
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
/* Giữ khung tối thiểu khi fill/fitViewport (đồng bộ default minHeight=280).
   Nếu đổi minHeight qua prop khác 280 mà cần CSS theo, dùng style inline ở trang. */
.app-fit-table--fill {
  height: 100%;
  min-height: 280px;
}
</style>
