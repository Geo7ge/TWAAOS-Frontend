<script setup lang="ts">
import { useApi } from "~/composables/useApi";

definePageMeta({
  middleware: "auth",
});

const { post } = useApi();
const router = useRouter();

const loading = ref(false);

const form = ref({
  name: "",
  email: "",
  role: "student",
  password: "",
});

const createUser = async () => {
  try {
    loading.value = true;

    await post("/users/register", {
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      password: form.value.password,
    });

    alert("Utilizator creat cu succes!");

    router.push("/gestioneaza-utilizatori");
  } catch (error) {
    console.error(error);
    alert("Eroare la crearea utilizatorului");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-3xl mx-auto px-4">
      <button
        @click="router.back()"
        class="mb-6 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Înapoi
      </button>

      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-6">
          Creează utilizator
        </h1>

        <div class="space-y-6">
          <div>
            <label class="block font-semibold text-gray-600 mb-2"> Nume </label>

            <input
              v-model="form.name"
              class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nume utilizator"
            />
          </div>

          <div>
            <label class="block font-semibold text-gray-600 mb-2">
              Email
            </label>

            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@exemplu.ro"
            />
          </div>

          <div>
            <label class="block font-semibold text-gray-600 mb-2"> Rol </label>

            <select
              v-model="form.role"
              class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Student</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-gray-600 mb-2">
              Parolă
            </label>

            <input
              v-model="form.password"
              type="password"
              class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Introdu parola"
            />
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="router.back()"
              type="button"
              class="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Anulează
            </button>

            <button
              @click="createUser"
              :disabled="loading"
              class="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ loading ? "Se creează..." : "Creează utilizator" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
