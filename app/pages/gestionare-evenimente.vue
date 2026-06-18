<script setup lang="ts">
import { useApi } from "~/composables/useApi";

definePageMeta({
  middleware: "auth",
});

const { get } = useApi();
const router = useRouter();
const loading = ref(true);

interface EventItem {
  id: number;
  title: string;
  start_time: string;
  end_time?: string;
  category_name?: string;
  organizer_id?: number;
}

const events = ref<EventItem[]>([]);

const fetchMyOrganizedEvents = async () => {
  try {
    loading.value = true;
    const userId = Number(useCookie("userId").value);
    if (!userId) {
      throw new Error("User ID not set");
    }

    // Fetch all events and filter by organizer_id
    const data = await get(`/events/`);
    if (Array.isArray(data)) {
      events.value = data.filter((e: any) => Number(e.organizer_id) === userId);
    } else {
      events.value = [];
    }
  } catch (error) {
    console.error("Error fetching organized events:", error);
    alert("Eroare la încărcarea evenimentelor organizate");
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

onMounted(() => {
  fetchMyOrganizedEvents();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">
          Gestionare evenimente
        </h1>

        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex gap-4 flex-wrap">
            <router-link
              to="/events"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Toate evenimentele
            </router-link>
            <router-link
              to="/"
              class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
            >
              Acasă
            </router-link>
            <router-link
              to="/create-event"
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Creează eveniment
            </router-link>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 text-lg">Se încarcă...</p>
      </div>

      <!-- Events List -->
      <div v-else-if="events.length > 0" class="space-y-4">
        <div
          v-for="ev in events"
          :key="ev.id"
          class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2">
                {{ ev.title || "Eveniment" }}
              </h3>
              <div class="space-y-1 text-gray-600">
                <p v-if="ev.start_time">📅 {{ formatDate(ev.start_time) }}</p>
                <p v-if="ev.category_name">🏷️ {{ ev.category_name }}</p>
              </div>
            </div>

            <span
              class="px-4 py-2 rounded-full font-medium text-sm bg-indigo-100 text-indigo-800"
            >
              Organizator
            </span>
          </div>

          <NuxtLink
            :to="`/events/${ev.id}`"
            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition inline-block text-center"
          >
            Vezi detalii
          </NuxtLink>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 bg-white rounded-lg">
        <p class="text-gray-600 text-lg mb-4">Nu ai creat niciun eveniment.</p>
        <router-link
          to="/events"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
        >
          Creează un eveniment
        </router-link>
      </div>
    </div>
  </div>
</template>
