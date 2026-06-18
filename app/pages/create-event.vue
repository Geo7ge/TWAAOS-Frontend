<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { get, post } = useApi();
const router = useRouter();

const loading = ref(false);
const locations = ref<any[]>([]);

const form = ref({
  title: "",
  description: "",
  start_time: "",
  end_time: "",
  location_id: null as number | null,
  category_name: "",
  participation_type: "offline",
  registration_link: "",
  qr_code: "",
  max_participants: 0,
  deadline: "",
});

const fetchLocations = async () => {
  try {
    locations.value = await get("/locations");
  } catch (error) {
    console.error(error);
    alert("Nu s-au putut încărca locațiile");
  }
};

const createEvent = async () => {
  try {
    loading.value = true;

    const organizerId = Number(useCookie("userId").value);

    await post("/events/", {
      title: form.value.title,
      description: form.value.description,
      start_time: new Date(form.value.start_time).toISOString(),
      end_time: new Date(form.value.end_time).toISOString(),
      location_id: form.value.location_id,
      category_name: form.value.category_name,
      organizer_id: organizerId,
      participation_type: form.value.participation_type,
      registration_link: form.value.registration_link,
      qr_code: form.value.qr_code,
      max_participants: form.value.max_participants,
      deadline: new Date(form.value.deadline).toISOString(),
    });

    alert("Eveniment creat cu succes!");

    router.push("/gestionare-evenimente");
  } catch (error) {
    console.error(error);
    alert("Eroare la crearea evenimentului");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLocations();
});
</script>
<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-3xl mx-auto px-4">
      <!-- Back Button -->
      <button
        @click="router.back()"
        class="mb-6 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Înapoi
      </button>

      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-6">Creează eveniment</h1>

        <div class="space-y-6 text-gray-700">
          <!-- Titlu -->
          <div>
            <label class="block font-semibold text-gray-600 mb-2">
              Titlu
            </label>

            <input
              v-model="form.title"
              class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Numele evenimentului"
            />
          </div>

          <!-- Dată -->
          <div class="flex items-start gap-3 text-sm text-gray-700">
            <span class="text-base mt-0.5">📅</span>

            <div class="flex flex-col sm:flex-row gap-4 w-full">
              <div class="flex flex-col gap-1 flex-1">
                <label class="font-medium text-gray-600"> Început </label>

                <input
                  type="datetime-local"
                  v-model="form.start_time"
                  class="px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div class="flex flex-col gap-1 flex-1">
                <label class="font-medium text-gray-600"> Sfârșit </label>

                <input
                  type="datetime-local"
                  v-model="form.end_time"
                  class="px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Deadline -->
          <div class="flex items-center gap-2">
            ⏳

            <div class="flex-1">
              <label class="block font-semibold text-gray-600 mb-2">
                Deadline înscriere
              </label>

              <input
                type="datetime-local"
                v-model="form.deadline"
                class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Locație -->
          <div class="flex items-center gap-2">
            📍

            <div class="flex-1">
              <label class="block font-semibold text-gray-600 mb-2">
                Locație
              </label>

              <select
                v-model.number="form.location_id"
                class="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option :value="null">Selectează locația</option>

                <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                  {{ loc.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Categorie -->
          <div class="flex items-center gap-2">
            🏷️

            <div class="flex-1">
              <label class="block font-semibold text-gray-600 mb-2">
                Categorie
              </label>

              <input
                v-model="form.category_name"
                class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Participare -->
          <div class="flex items-center gap-2">
            👥

            <div class="flex-1">
              <label class="block font-semibold text-gray-600 mb-2">
                Tip participare
              </label>

              <select
                v-model="form.participation_type"
                class="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="online">Online</option>

                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <!-- Participanți -->
          <div class="flex items-center gap-2">
            👤

            <div class="flex-1">
              <label class="block font-semibold text-gray-600 mb-2">
                Participanți maximi
              </label>

              <input
                type="number"
                min="1"
                v-model.number="form.max_participants"
                class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Link înscriere -->
          <div
            v-if="form.participation_type === 'online'"
            class="flex items-center gap-2"
          >
            🔗

            <div class="flex-1">
              <label class="block font-semibold text-gray-600 mb-2">
                Link participare online
              </label>

              <input
                v-model="form.registration_link"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://meet.google.com/... sau https://zoom.us/..."
              />
            </div>
          </div>

          <!-- Descriere -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h2 class="text-xl font-bold text-gray-800 mb-3">Descriere</h2>

            <textarea
              v-model="form.description"
              rows="6"
              class="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrierea evenimentului..."
            />
          </div>

          <!-- Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="router.back()"
              type="button"
              class="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Anulează
            </button>

            <button
              @click="createEvent"
              :disabled="loading"
              class="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
            >
              {{ loading ? "Se creează..." : "Creează eveniment" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
