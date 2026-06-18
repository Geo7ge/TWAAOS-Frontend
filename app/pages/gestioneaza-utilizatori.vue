<script setup lang="ts">
import { useApi } from "~/composables/useApi";

definePageMeta({
  middleware: "auth",
});

const { get, put, delete: deleteUserApi } = useApi();

const loading = ref(true);

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface EditableUser extends User {
  hasChanges?: boolean;
}

const users = ref<EditableUser[]>([]);
const originalUsers = ref<Record<number, User>>({});

const fetchUsers = async () => {
  try {
    loading.value = true;

    const data = await get("/users");

    users.value = (data || []).map((user: User) => ({
      ...user,
      hasChanges: false,
    }));

    originalUsers.value = {};

    users.value.forEach((user) => {
      originalUsers.value[user.id] = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    });
  } catch (error) {
    console.error(error);
    alert("Eroare la încărcarea utilizatorilor");
  } finally {
    loading.value = false;
  }
};

const checkChanges = (user: EditableUser) => {
  const original = originalUsers.value[user.id];

  if (!original) {
    user.hasChanges = false;
    return;
  }

  user.hasChanges =
    user.name !== original.name ||
    user.email !== original.email ||
    user.role !== original.role;
};

const saveUser = async (user: EditableUser) => {
  try {
    await put(`/users/${user.id}`, {
      name: user.name,
      email: user.email,
      role: user.role,
    });

    originalUsers.value[user.id] = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    user.hasChanges = false;

    alert("Utilizator actualizat cu succes!");
  } catch (error) {
    console.error(error);
    alert("Eroare la actualizarea utilizatorului");
  }
};

const deleteUser = async (userId: number) => {
  const confirmed = confirm("Sigur dorești să ștergi acest utilizator?");

  if (!confirmed) return;

  try {
    await deleteUserApi(`/users/${userId}`);

    users.value = users.value.filter((user) => user.id !== userId);

    delete originalUsers.value[userId];

    alert("Utilizator șters cu succes!");
  } catch (error) {
    console.error(error);
    alert("Eroare la ștergerea utilizatorului");
  }
};

onMounted(() => {
  fetchUsers();
});
</script>
<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">
          Gestionează utilizatori
        </h1>

        <div class="flex gap-4">
          <router-link
            to="/"
            class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
          >
            Acasă
          </router-link>

          <router-link
            to="/creaza-utilizator"
            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Creează utilizator
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 text-lg">Se încarcă...</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="user in users"
          :key="user.id"
          class="bg-white rounded-lg shadow-lg p-6"
        >
          <div class="space-y-4">
            <div>
              <label class="block font-semibold text-gray-600 mb-2">
                Nume
              </label>

              <input
                v-model="user.name"
                @input="checkChanges(user)"
                class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block font-semibold text-gray-600 mb-2">
                Email
              </label>

              <input
                v-model="user.email"
                @input="checkChanges(user)"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block font-semibold text-gray-600 mb-2">
                Rol
              </label>

              <select
                v-model="user.role"
                @change="checkChanges(user)"
                class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              @click="saveUser(user)"
              :disabled="!user.hasChanges"
              class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Salvează modificările
            </button>

            <button
              @click="deleteUser(user.id)"
              :disabled="user.id === Number(useCookie('userId').value)"
              class="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Șterge utilizatorul
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
