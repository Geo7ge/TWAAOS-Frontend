<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

definePageMeta({
  middleware: "auth",
});

const { get } = useApi();
const router = useRouter();
const appName = "Managementul evenimentelor universitare";
const user = ref<User | null>(null);

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const isOrganizer = computed(() => user.value?.role === "organizer");
const isAdmin = computed(() => user.value?.role === "admin");

const fetchUser = async () => {
  try {
    const userId = Number(useCookie("userId").value);
    if (!userId) return;
    const data = await get(`/users/${userId}`);
    user.value = data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
};

const logout = () => {
  useCookie("token").value = null;
  useCookie("isLoggedIn").value = null;
  useCookie("userId").value = null;
  useCookie("userEmail").value = null;
  useCookie("userName").value = null;
  router.push("/login");
};

onMounted(() => {
  fetchUser();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navigation Bar -->
    <nav class="bg-white shadow-lg">
      <div
        class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"
      >
        <h1 class="text-2xl font-bold text-gray-800">{{ appName }}</h1>

        <div class="flex gap-4 items-center">
          <router-link
            to="/events"
            class="px-4 py-2 text-gray-800 hover:text-blue-600 font-medium transition"
          >
            Evenimente
          </router-link>

          <router-link
            to="/my-events"
            class="px-4 py-2 text-gray-800 hover:text-blue-600 font-medium transition"
          >
            Evenimentele mele
          </router-link>

          <router-link
            v-if="isOrganizer"
            to="/gestionare-evenimente"
            class="px-4 py-2 text-gray-800 hover:text-blue-600 font-medium transition"
          >
            Gestionare evenimente
          </router-link>

          <router-link
            v-if="isAdmin"
            to="/gestioneaza-utilizatori"
            class="px-4 py-2 text-gray-800 hover:text-blue-600 font-medium transition"
          >
            Gestionează utilizatori
          </router-link>
          <router-link
            to="/profile"
            class="px-4 py-2 text-gray-800 hover:text-blue-600 font-medium transition"
          >
            Profil
          </router-link>

          <button
            @click="logout"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <h2 class="text-5xl font-bold mb-4">Bine venit!</h2>
        <p class="text-xl mb-8">
          Descoperă și participă la evenimentele tale preferate
        </p>

        <router-link
          to="/events"
          class="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition"
        >
          Descopera evenimente
        </router-link>
      </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-7xl mx-auto px-4 py-16">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8"></div>
    </div>
  </div>
</template>
