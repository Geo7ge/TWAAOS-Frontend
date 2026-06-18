<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { get } = useApi();
const router = useRouter();

const events = ref<Event[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const selectedDate = ref("");
const selectedCategory = ref("");
const selectedLocation = ref<string | number>("");
const selectedOrganizer = ref<string | number>("");

interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  category_name: string;
  location_id: number;
  organizer_id?: number;
  location_name?: string;
  participation_type: string;
}

interface Location {
  id: number;
  name: string;
}

interface Organizer {
  id: number;
  name: string;
}

const getEventDate = (dateString: string) => {
  return new Date(dateString).toISOString().slice(0, 10);
};

const locationsList = ref<Location[]>([]);
const organizerMap = ref<Record<number, string>>({});

const fetchLocations = async () => {
  try {
    const data = await get("/locations/");
    locationsList.value = data;
  } catch (error) {
    console.error("Error fetching locations:", error);
    locationsList.value = [];
  }
};

const fetchOrganizerById = async (organizerId: number) => {
  if (organizerMap.value[organizerId]) {
    return;
  }

  try {
    const data = await get(`/users/${organizerId}`);
    organizerMap.value[organizerId] = data.name || `Organizator ${organizerId}`;
  } catch (error) {
    console.error(`Error fetching organizer ${organizerId}:`, error);
    organizerMap.value[organizerId] = `Organizator ${organizerId}`;
  }
};

const filteredEvents = computed(() => {
  return events.value.filter((event: Event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      event.category_name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());

    const matchesDate = selectedDate.value
      ? getEventDate(event.start_time) === selectedDate.value
      : true;

    const matchesCategory = selectedCategory.value
      ? event.category_name === selectedCategory.value
      : true;

    const matchesLocation = selectedLocation.value
      ? event.location_id === Number(selectedLocation.value)
      : true;

    const matchesOrganizer = selectedOrganizer.value
      ? event.organizer_id === Number(selectedOrganizer.value)
      : true;

    return (
      matchesSearch &&
      matchesDate &&
      matchesCategory &&
      matchesLocation &&
      matchesOrganizer
    );
  });
});

const categories = computed(() => {
  const uniqueCategories = new Set(
    events.value
      .map((event) => event.category_name)
      .filter((category) => category && category.trim() !== ""),
  );
  return Array.from(uniqueCategories).sort();
});

const availableCategories = computed(() => {
  const eventCategories = new Set(
    filteredEvents.value.map((e) => e.category_name),
  );
  return categories.value
    .filter((cat) => eventCategories.has(cat))
    .sort((a, b) => a.localeCompare(b));
});

const availableLocations = computed(() => {
  const eventIds = new Set(filteredEvents.value.map((e) => e.location_id));
  return locationsList.value
    .filter((loc) => eventIds.has(loc.id))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const availableOrganizers = computed(() => {
  const organizerIds = Array.from(
    new Set(filteredEvents.value.map((e) => e.organizer_id).filter(Boolean)),
  ) as number[];

  return organizerIds
    .map((id) => ({ id, name: organizerMap.value[id] || `Organizator ${id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const fetchEvents = async () => {
  try {
    loading.value = true;
    const data = await get("/events/");
    events.value = data;

    const organizerIds = Array.from(
      new Set(events.value.map((event) => event.organizer_id).filter(Boolean)),
    ) as number[];

    await Promise.all(organizerIds.map((id) => fetchOrganizerById(id)));
  } catch (error) {
    console.error("Error fetching events:", error);
    alert("Eroare la încărcarea evenimentelor");
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
  fetchEvents();
  fetchLocations();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">Evenimente</h1>

        <!-- Search Bar -->
        <div class="grid gap-4 mb-6 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Caută după titlu sau categorie..."
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div class="flex gap-2 items-center">
            <input
              v-model="selectedDate"
              type="date"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              v-if="selectedDate"
              type="button"
              @click="selectedDate = ''"
              class="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Șterge
            </button>
          </div>
          <div class="flex gap-2 items-center">
            <select
              v-model="selectedCategory"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="">Toate categoriile</option>
              <option
                v-for="category in availableCategories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </option>
            </select>
            <button
              v-if="selectedCategory"
              type="button"
              @click="selectedCategory = ''"
              class="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Șterge
            </button>
          </div>
          <div class="flex gap-2 items-center">
            <select
              v-model="selectedLocation"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="">Toate locațiile</option>
              <option
                v-for="loc in availableLocations"
                :key="loc.id"
                :value="loc.id"
              >
                {{ loc.name }}
              </option>
            </select>
            <button
              v-if="selectedLocation"
              type="button"
              @click="selectedLocation = ''"
              class="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Șterge
            </button>
          </div>
          <div class="flex gap-2 items-center">
            <select
              v-model="selectedOrganizer"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="">Toți organizatorii</option>
              <option
                v-for="org in availableOrganizers"
                :key="org.id"
                :value="org.id"
              >
                {{ org.name }}
              </option>
            </select>
            <button
              v-if="selectedOrganizer"
              type="button"
              @click="selectedOrganizer = ''"
              class="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Șterge
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex gap-4">
          <router-link
            to="/my-events"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Evenimentele mele
          </router-link>
          <router-link
            to="/"
            class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
          >
            Acasă
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 text-lg">Se încarcă evenimentele...</p>
      </div>

      <!-- Events Grid -->
      <div
        v-else-if="filteredEvents.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
        >
          <div class="p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-2">
              {{ event.title }}
            </h3>

            <p class="text-gray-600 text-sm mb-4 line-clamp-2">
              {{ event.description }}
            </p>

            <div class="space-y-2 text-sm text-gray-600 mb-4">
              <div>
                📅
                <span class="font-medium">
                  {{ formatDate(event.start_time) }}
                </span>
              </div>

              <div v-if="event.category_name">
                🏷️
                <span class="font-medium">
                  {{ event.category_name }}
                </span>
              </div>

              <div v-if="event.participation_type">
                🌐
                <span class="font-medium">
                  {{
                    event.participation_type === "online" ? "Online" : "Offline"
                  }}
                </span>
              </div>
            </div>
            <router-link
              :to="`/events/${event.id}`"
              class="w-full block bg-blue-600 text-white py-2 rounded-lg text-center hover:bg-blue-700 transition"
            >
              Vezi detalii
            </router-link>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="text-center py-12">
        <p class="text-gray-600 text-lg">Nu au fost găsite evenimente</p>
      </div>
    </div>
  </div>
</template>
