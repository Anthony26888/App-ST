<template>
  <!-- Main Layout -->
  <v-card class="overflow-y-auto" height="100vh" variant="text">
    <v-card-title class="text-h4 font-weight-light"
      >Quản lý công việc</v-card-title
    >

    <v-card-text class="rounded-xl" elevation="2">
      <v-card
        variant="elevated"
        elevation="0"
        class="rounded-xl border"
        height="calc(100vh - 90px)"
      >
        <!-- Header with Date Navigation -->
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between flex-wrap ga-4">
            <!-- Add Todo Button -->
            <ButtonAdd @add="openAddDialog"> </ButtonAdd>
            <v-spacer></v-spacer>
            <InputSearch v-model="searchQuery" label="Tìm kiếm"></InputSearch>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <!-- Status Tabs -->
        <v-tabs v-model="activeTab" grow>
          <v-tab value="pending" class="text-caption">
            <v-icon start color="error" size="20">mdi-clock-outline</v-icon>
            <h3>Chưa xử lý</h3>
            <v-chip
              v-if="pendingTodos.length > 0"
              class="ml-2"
              size="small"
              color="error"
              variant="flat"
            >
              {{ pendingTodos.length }}
            </v-chip>
          </v-tab>

          <v-tab value="inProgress" class="text-caption">
            <v-icon start color="warning" size="20">mdi-progress-clock</v-icon>
            <h3>Đang xử lý</h3>
            <v-chip
              v-if="inProgressTodos.length > 0"
              class="ml-2"
              size="small"
              color="warning"
              variant="flat"
            >
              {{ inProgressTodos.length }}
            </v-chip>
          </v-tab>

          <v-tab value="completed" class="text-caption">
            <v-icon start color="success" size="20">mdi-check-circle</v-icon>
            <h3>Đã xử lý</h3>
            <v-chip
              v-if="completedTodos.length > 0"
              class="ml-2"
              size="small"
              color="success"
              variant="flat"
            >
              {{ completedTodos.length }}
            </v-chip>
          </v-tab>
        </v-tabs>

        <v-divider></v-divider>

        <!-- Tab Content -->
        <v-window v-model="activeTab">
          <!-- Pending Tab -->
          <v-window-item value="pending">
            <v-card-text class="pa-0">
              <div v-if="pendingTodos.length === 0" class="text-center py-12">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">
                  mdi-clipboard-check-outline
                </v-icon>
                <h3 class="text-h6 text-medium-emphasis mb-2">
                  Không có công việc
                </h3>
              </div>

              <v-table v-else hover density="comfortable">
                <thead>
                  <tr>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Trạng thái
                    </th>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Phòng ban
                    </th>
                    <th class="text-left font-weight-bold text-caption">
                      Chi tiết
                    </th>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Người thực hiện
                    </th>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Ngày tạo
                    </th>
                    <th
                      class="text-center font-weight-bold text-caption"
                      style="width: 180px"
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="todo in pendingTodos" :key="todo.id">
                    <td>
                      <v-icon :color="getStatusColor(todo.status)">{{
                        getStatusIcon(todo.status)
                      }}</v-icon>
                    </td>
                    <td>{{ todo.department }}</td>
                    <td>
                      <div class="py-2">
                        <div class="text-subtitle-1 font-weight-medium">
                          {{ todo.title }}
                        </div>
                        <div
                          class="text-body-2 text-medium-emphasis text-truncate"
                          style="max-width: 400px; white-space: pre-line"
                        >
                          {{ todo.description || "No description provided" }}
                        </div>
                      </div>
                    </td>
                    <td>{{ todo.creater }}</td>
                    <td>{{ todo.createdAt }}</td>
                    <td>
                      <div class="d-flex justify-center ga-2">
                        <v-btn
                          variant="text"
                          size="small"
                          color="warning"
                          icon="mdi-play"
                          @click="updateTodoStatus(todo.id, 'Đang tiến hành')"
                        >
                          <v-icon>mdi-play</v-icon>
                          <v-tooltip activator="parent" location="top"
                            >Bắt đầu</v-tooltip
                          >
                        </v-btn>
                        <v-btn
                          variant="tonal"
                          size="small"
                          color="success"
                          icon="mdi-check"
                          @click="updateTodoStatus(todo.id, 'Đã hoàn thành')"
                        >
                          <v-icon>mdi-check</v-icon>
                          <v-tooltip activator="parent" location="top"
                            >Hoàn thành</v-tooltip
                          >
                        </v-btn>
                        <v-btn
                          variant="tonal"
                          size="small"
                          color="error"
                          icon="mdi-delete"
                          @click="deleteTodo(todo.id)"
                        >
                          <v-icon>mdi-delete</v-icon>
                          <v-tooltip activator="parent" location="top"
                            >Xóa</v-tooltip
                          >
                        </v-btn>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-window-item>

          <!-- In Progress Tab -->
          <v-window-item value="inProgress">
            <v-card-text class="pa-0">
              <div
                v-if="inProgressTodos.length === 0"
                class="text-center py-12"
              >
                <v-icon size="64" color="grey-lighten-1" class="mb-4">
                  mdi-progress-clock
                </v-icon>
                <h3 class="text-h6 text-medium-emphasis mb-2">
                  Không có công việc trong quá trình 🎉
                </h3>
              </div>

              <v-table v-else hover density="comfortable">
                <thead>
                  <tr>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Trạng thái
                    </th>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Phòng ban
                    </th>
                    <th class="text-left font-weight-bold text-caption">
                      Chi tiết
                    </th>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Người thực hiện
                    </th>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Ngày tạo
                    </th>
                    <th
                      class="text-center font-weight-bold text-caption"
                      style="width: 180px"
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="todo in inProgressTodos" :key="todo.id">
                    <td>
                      <v-icon :color="getStatusColor(todo.status)">{{
                        getStatusIcon(todo.status)
                      }}</v-icon>
                    </td>
                    <td>{{ todo.department }}</td>
                    <td>
                      <div class="py-2">
                        <div class="text-subtitle-1 font-weight-medium">
                          {{ todo.title }}
                        </div>
                        <div
                          class="text-body-2 text-medium-emphasis text-truncate"
                          style="max-width: 400px"
                        >
                          {{ todo.description || "No description provided" }}
                        </div>
                      </div>
                    </td>
                    <td>{{ todo.creater }}</td>
                    <td>{{ todo.createdAt }}</td>
                    <td>
                      <div class="d-flex justify-center ga-2">
                        <v-btn
                          variant="tonal"
                          size="small"
                          color="success"
                          icon="mdi-check"
                          @click="updateTodoStatus(todo.id, 'Đã hoàn thành')"
                        >
                          <v-icon>mdi-check</v-icon>
                          <v-tooltip activator="parent" location="top"
                            >Hoàn thành</v-tooltip
                          >
                        </v-btn>
                        <v-btn
                          variant="tonal"
                          size="small"
                          color="error"
                          icon="mdi-delete"
                          @click="deleteTodo(todo.id)"
                        >
                          <v-icon>mdi-delete</v-icon>
                          <v-tooltip activator="parent" location="top"
                            >Xóa</v-tooltip
                          >
                        </v-btn>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-window-item>

          <!-- Completed Tab -->
          <v-window-item value="completed">
            <v-card-text class="pa-0">
              <div v-if="completedTodos.length === 0" class="text-center py-12">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">
                  mdi-check-circle-outline
                </v-icon>
                <h3 class="text-h6 text-medium-emphasis mb-2">
                  Không có công việc hoàn thành 🎉
                </h3>
              </div>

              <v-table v-else hover density="comfortable">
                <thead>
                  <tr>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Trạng thái
                    </th>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Phòng ban
                    </th>
                    <th class="text-left font-weight-bold text-caption">
                      Chi tiết
                    </th>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Người thực hiện
                    </th>
                    <th
                      class="text-left font-weight-bold text-caption"
                      style="width: 150px"
                    >
                      Ngày tạo
                    </th>
                    <th
                      class="text-center font-weight-bold text-caption"
                      style="width: 180px"
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="todo in completedTodos" :key="todo.id">
                    <td>
                      <v-icon :color="getStatusColor(todo.status)">{{
                        getStatusIcon(todo.status)
                      }}</v-icon>
                    </td>
                    <td>{{ todo.department }}</td>
                    <td>
                      <div class="py-2">
                        <div
                          class="text-subtitle-1 font-weight-medium text-decoration-line-through text-medium-emphasis"
                        >
                          {{ todo.title }}
                        </div>
                        <div
                          class="text-body-2 text-medium-emphasis text-truncate"
                          style="max-width: 400px"
                        >
                          {{ todo.description || "No description provided" }}
                        </div>
                      </div>
                    </td>
                    <td>{{ todo.creater }}</td>
                    <td>{{ todo.createdAt }}</td>
                    <td>
                      <div class="d-flex justify-center ga-2">
                        <v-btn
                          variant="tonal"
                          size="small"
                          color="info"
                          icon="mdi-restore"
                          @click="updateTodoStatus(todo.id, 'Chưa hoàn thành')"
                        >
                          <v-icon>mdi-restore</v-icon>
                          <v-tooltip activator="parent" location="top"
                            >Khôi phục</v-tooltip
                          >
                        </v-btn>
                        <v-btn
                          variant="tonal"
                          size="small"
                          color="error"
                          icon="mdi-delete"
                          @click="deleteTodo(todo.id)"
                        >
                          <v-icon>mdi-delete</v-icon>
                          <v-tooltip activator="parent" location="top"
                            >Xóa</v-tooltip
                          >
                        </v-btn>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-window-item>
        </v-window>
      </v-card>
    </v-card-text>
  </v-card>

  <!-- Add/Edit Todo Dialog -->
  <BaseDialog
    v-model="todoDialog"
    max-width="600"
    persistent
    :icon="editingTodo ? 'mdi-pencil' : 'mdi-plus'"
    :title="editingTodo ? 'Chỉnh sửa' : 'Thêm mới'"
  >
    <v-form ref="todoForm" v-model="formValid">
      <!-- Title Input -->
      <v-text-field
        v-model="todoFormData.title"
        label="Tên công việc"
        placeholder="Nhập tên công việc"
        variant="outlined"
        :rules="[rules.required]"
        prepend-inner-icon="mdi-format-title"
        class="mb-4"
        counter="100"
      ></v-text-field>

      <!-- Description Input -->
      <v-textarea
        v-model="todoFormData.description"
        label="Mô tả (Tùy chọn)"
        placeholder="Nhập mô tả"
        variant="outlined"
        rows="3"
        prepend-inner-icon="mdi-text"
        class="mb-4"
        counter="500"
      ></v-textarea>

      <!-- Creater Input -->
      <v-text-field
        v-model="todoFormData.creater"
        label="Người phụ trách"
        placeholder="Nhập người phụ trách"
        variant="outlined"
        :rules="[rules.required]"
        prepend-inner-icon="mdi-account"
        class="mb-4"
        counter="100"
      ></v-text-field>

      <!-- Due Date Input -->
      <v-text-field
        v-model="todoFormData.createdAt"
        label="Ngày tạo"
        type="date"
        variant="outlined"
        :rules="[rules.required]"
        prepend-inner-icon="mdi-calendar"
        class="mb-4"
      ></v-text-field>

      <!-- Status Select -->
      <v-select
        v-model="todoFormData.status"
        label="Trạng thái"
        :items="statusOptions"
        variant="outlined"
        :rules="[rules.required]"
        prepend-inner-icon="mdi-flag"
      ></v-select>
    </v-form>

    <template #actions>
      <v-spacer></v-spacer>
      <ButtonCancel variant="text" @click="closeDialog" size="large">
      </ButtonCancel>
      <ButtonSave
        color="primary"
        variant="flat"
        @click="saveTodo"
        :disabled="!formValid"
        size="large"
      >
        {{ editingTodo ? "Update" : "Add" }} Task
      </ButtonSave>
    </template>
  </BaseDialog>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";

import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonSave from "@/components/Button-Save.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

import { useToDo } from "@/composables/ToDo/useToDo";

// ==================== STATE ====================

// API Configuration
const Url = import.meta.env.VITE_API_URL;
const LevelUser = localStorage.getItem("LevelUser");
console.log(LevelUser);
const { todos, todosError } = useToDo();

// Tab state
const activeTab = ref("pending");
const searchQuery = ref("");

// Dialog state
const todoDialog = ref(false);
const formValid = ref(false);
const editingTodo = ref(null);
const todoForm = ref(null);

// Form data
const todoFormData = ref({
  title: "",
  description: "",
  createdAt: "",
  creater: "",
  status: "Chưa hoàn thành",
});

// Status options for select
const statusOptions = [
  { title: "Chưa hoàn thành", value: "Chưa hoàn thành" },
  { title: "Đang tiến hành", value: "Đang tiến hành" },
  { title: "Đã hoàn thành", value: "Đã hoàn thành" },
];

// Form validation rules
const rules = {
  required: (value) => !!value || "This field is required",
};

// Dialog state
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ==================== COMPUTED PROPERTIES ====================

// Filter todos based on LevelUser and Search Query
const filteredTodos = computed(() => {
  let filtered = todos.value;

  // Filter by Department (LevelUser)
  if (LevelUser !== "Admin") {
    filtered = filtered.filter((todo) => todo.department === LevelUser);
  }

  // Filter by Search Query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((todo) => {
      return (
        todo.title?.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query) ||
        todo.creater?.toLowerCase().includes(query) ||
        todo.department?.toLowerCase().includes(query)
      );
    });
  }

  return filtered;
});

// Filter by status
const pendingTodos = computed(() => {
  return filteredTodos.value.filter(
    (todo) => todo.status === "Chưa hoàn thành"
  );
});

const inProgressTodos = computed(() => {
  return filteredTodos.value.filter((todo) => todo.status === "Đang tiến hành");
});

const completedTodos = computed(() => {
  return filteredTodos.value.filter((todo) => todo.status === "Đã hoàn thành");
});

// ==================== METHODS ====================

// Open add dialog
const openAddDialog = () => {
  editingTodo.value = null;
  todoFormData.value = {
    department: LevelUser,
    title: "",
    creater: "",
    description: "",
    createdAt: new Date().toISOString().split("T")[0],
    status: "Chưa hoàn thành",
  };
  todoDialog.value = true;
};

// Close dialog
const closeDialog = () => {
  todoDialog.value = false;
  editingTodo.value = null;
  if (todoForm.value) {
    todoForm.value.reset();
  }
};

// Open edit dialog
const openEditDialog = (todo) => {
  editingTodo.value = todo;
  todoFormData.value = {
    department: todo.department,
    title: todo.title,
    description: todo.description,
    creater: todo.creater,
    createdAt: todo.createdAt,
    status: todo.status,
  };
  todoDialog.value = true;
};

// Save todo
const saveTodo = async () => {
  DialogLoading.value = true;
  if (!todoForm.value) return;

  const { valid } = await todoForm.value.validate();
  if (!valid) return;
  // Add new todo
  const newTodo = {
    department: LevelUser,
    title: todoFormData.value.title,
    description: todoFormData.value.description,
    status: todoFormData.value.status,
    creater: todoFormData.value.creater,
    created_at: todoFormData.value.createdAt,
  };
  try {
    const response = await axios.post(`${Url}/To-Do/Add-item`, newTodo);
    DialogLoading.value = false;
    DialogSuccess.value = true;
    MessageDialog.value = "Thêm công việc thành công";
  } catch (error) {
    DialogLoading.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = error.response.data.message;
  }
  closeDialog();
};

// Update todo status
const updateTodoStatus = async (todoId, status) => {
  DialogLoading.value = true;
  try {
    const response = await axios.put(`${Url}/To-Do/Update-status/${todoId}`, {
      status,
    });
    DialogLoading.value = false;
    DialogSuccess.value = true;
    MessageDialog.value = "Cập nhật trạng thái thành công";
  } catch (error) {
    DialogLoading.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = error.response.data.message;
  }
};

// Delete todo
const deleteTodo = async (todoId) => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(`${Url}/To-Do/Delete-item/${todoId}`);
    DialogLoading.value = false;
    DialogSuccess.value = true;
    MessageDialog.value = "Xóa công việc thành công";
  } catch (error) {
    DialogLoading.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = error.response.data.message;
  }
};

// ==================== HELPER FUNCTIONS ====================

// Get status chip color
const getStatusColor = (status) => {
  switch (status) {
    case "Chưa hoàn thành":
      return "error";
    case "Đang tiến hành":
      return "warning";
    case "Đã hoàn thành":
      return "success";
    default:
      return "grey";
  }
};

// Get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case "Chưa hoàn thành":
      return "mdi-clock-alert-outline";
    case "Đang tiến hành":
      return "mdi-progress-clock";
    case "Đã hoàn thành":
      return "mdi-check-circle";
    default:
      return "mdi-help-circle";
  }
};

// Get status label
const getStatusLabel = (status) => {
  switch (status) {
    case "Chưa hoàn thành":
      return "Chưa hoàn thành";
    case "Đang tiến hành":
      return "Đang tiến hành";
    case "Đã hoàn thành":
      return "Đã hoàn thành";
    default:
      return "Unknown";
  }
};

// Format date
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Get empty state message
const getEmptyStateMessage = (statusType) => {
  switch (statusType) {
    case "pending":
      return "All caught up! No pending tasks.";
    case "inProgress":
      return "No tasks in progress at the moment.";
    case "completed":
      return "No completed tasks yet.";
    default:
      return "No tasks found.";
  }
};
</script>

<style scoped>
/* Table customization */
.v-table :deep(th) {
  background-color: #f8fafc !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  letter-spacing: 0.05em;
  color: #64748b !important;
}

.v-table :deep(tr:hover) {
  background-color: #f1f5f9 !important;
}

.v-table :deep(td) {
  border-bottom: 1px solid #e2e8f0 !important;
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Text decoration for completed tasks */
.text-decoration-line-through {
  text-decoration: line-through;
}
</style>
