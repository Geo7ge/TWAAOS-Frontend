<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { get } = useApi();
const router = useRouter();

const user = ref<User | null>(null);
const loading = ref(true);
const editing = ref(false);

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const fetchUserProfile = async () => {
  try {
    loading.value = true;
    const userId = Number(useCookie("userId").value);
    if (!userId) {
      throw new Error("User ID not set");
    }
    const data = await get(`/users/${userId}`);
    user.value = data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    alert("Eroare la încărcarea profilului");
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  useCookie("token").value = null;
  useCookie("isLoggedIn").value = null;
  useCookie("userId").value = null;
  router.push("/login");
};

onMounted(() => {
  fetchUserProfile();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">Profilul meu</h1>
        <router-link
          to="/"
          class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
        >
          Înapoi
        </router-link>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 text-lg">Se încarcă...</p>
      </div>

      <!-- Profile Card -->
      <div v-else-if="user" class="bg-white rounded-lg shadow-lg p-8">
        <div v-if="!editing" class="space-y-6">
          <!-- Display Mode -->
          <div>
            <label class="block text-sm font-medium text-gray-600">Nume</label>
            <p class="text-lg text-gray-800">{{ user.name }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600">Email</label>
            <p class="text-lg text-gray-800">{{ user.email }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600">Rol</label>
            <p class="text-lg text-gray-800">{{ user.role }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600"
              >Cont creat</label
            >
            <p class="text-lg text-gray-800">
              {{ new Date(user.created_at).toLocaleDateString("ro-RO") }}
            </p>
          </div>

          <div class="pt-4">
            <button
              @click="logout"
              class="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
