<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { get, post, put, delete: apiDelete } = useApi();
const router = useRouter();
const route = useRoute();
const userId = computed(() => Number(useCookie("userId").value));

const eventId = computed(() => Number(route.params.id));
const event = ref<Event | null>(null);
const organizer = ref<User | null>(null);
const location = ref<Location | null>(null);
const locations = ref<Location[]>([]);
const eventRegistrations = ref<Registration[]>([]);
const registrationUsers = ref<Record<number, User>>({});
const showRegistrationList = ref(false);
const loading = ref(true);
const registering = ref(false);
const processingRegistrationId = ref<number | null>(null);
const registrationStatus = ref("");
const registrationId = ref<number | null>(null);
const errorMessage = ref("");

const editableEvent = ref<any>({});
const hasChanges = ref(false);

watch(
  editableEvent,
  (newValue) => {
    if (!event.value) {
      hasChanges.value = false;
      return;
    }

    hasChanges.value = JSON.stringify(newValue) !== JSON.stringify(event.value);
  },
  {
    deep: true,
  },
);

interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  category_name: string;
  max_participants: number;
  location_id: number;
  organizer_id?: number;
  participation_type?: string;
  registration_link?: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
}

interface User {
  id: number;
  name: string;
}

interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  status: string;
}

const isOrganizer = computed(() => {
  return (
    event.value && userId.value && event.value.organizer_id === userId.value
  );
});

const fetchLocation = async (locationId: number) => {
  try {
    const data = await get(`/locations/${locationId}`);
    location.value = data;
  } catch (error) {
    console.error("Error fetching location:", error);
    location.value = null;
  }
};

const fetchOrganizer = async (organizerId: number) => {
  try {
    const data = await get(`/users/${organizerId}`);
    organizer.value = data;
  } catch (error) {
    console.error("Error fetching organizer:", error);
    organizer.value = null;
  }
};

const fetchLocations = async () => {
  try {
    const data = await get(`/locations`);
    locations.value = data || [];
  } catch (error) {
    console.error("Error fetching locations:", error);
    locations.value = [];
  }
};

const displayLocation = computed<Location | null>(() => {
  const selectedLocation = locations.value.find(
    (loc) => loc.id === editableEvent.value.location_id,
  );
  return selectedLocation || location.value;
});

const confirmedRegistrations = computed(() =>
  eventRegistrations.value.filter(
    (registration) => registration.status === "confirmed",
  ),
);

const pendingRegistrations = computed(() =>
  eventRegistrations.value.filter(
    (registration) => registration.status === "pending",
  ),
);

const totalRegistrations = computed(() => eventRegistrations.value.length);

const fetchUserById = async (userId: number) => {
  try {
    if (registrationUsers.value[userId]) {
      return;
    }
    const data = await get(`/users/${userId}`);
    registrationUsers.value = {
      ...registrationUsers.value,
      [userId]: data,
    };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
  }
};

const fetchEventRegistrations = async () => {
  try {
    const data = await get(`/registrations/event/${eventId.value}`);
    eventRegistrations.value = data || [];

    const userIds = Array.from(
      new Set(
        (eventRegistrations.value || []).map(
          (registration) => registration.user_id,
        ),
      ),
    );
    await Promise.all(userIds.map((id) => fetchUserById(id)));
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    eventRegistrations.value = [];
  }
};

watch(
  () => editableEvent.value.location_id,
  (newLocationId) => {
    const selected = locations.value.find((loc) => loc.id === newLocationId);

    if (selected) {
      location.value = selected;
    }
  },
);

const formatForDateTimeLocal = (dateString: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const fetchEvent = async () => {
  try {
    loading.value = true;
    const id = eventId.value;
    if (!id) {
      throw new Error("Invalid event ID");
    }
    const data = await get(`/events/${id}`);
    event.value = data;
    editableEvent.value = {
      ...data,
      start_time: formatForDateTimeLocal(data.start_time),
      end_time: formatForDateTimeLocal(data.end_time),
    };

    hasChanges.value = false;
    if (isOrganizer.value) {
      await fetchLocations();
    }
    if (event.value?.location_id) {
      await fetchLocation(event.value.location_id);
    }
    if (event.value?.organizer_id) {
      await fetchOrganizer(event.value.organizer_id);
    }
    if (isOrganizer.value) {
      await fetchEventRegistrations();
    }

    // Check if already registered
    const userId = Number(useCookie("userId").value);
    if (!userId) {
      throw new Error("User ID not set");
    }
    const registrations = await get(`/registrations/user/${userId}`);
    const registration = registrations.find(
      (r: any) => r.event_id === eventId.value,
    );
    registrationStatus.value = registration?.status || "";
    registrationId.value = registration?.id || null;
  } catch (error) {
    console.error("Error fetching event:", error);
    errorMessage.value =
      "Nu s-a putut încărca evenimentul. Verifică dacă există sau dacă ai acces.";
    alert("Eroare la încărcarea evenimentului");
    router.push("/events");
  } finally {
    loading.value = false;
  }
};

const registerForEvent = async () => {
  try {
    registering.value = true;
    const userId = Number(useCookie("userId").value);
    if (!userId) {
      throw new Error("User ID not set");
    }
    await post(`/registrations/`, {
      user_id: userId,
      event_id: eventId.value,
    });
    alert("Înregistrare cu succes!");
    registrationStatus.value = "registered";
    await fetchEvent();
  } catch (error) {
    console.error("Error registering:", error);
    alert("Eroare la înregistrare");
  } finally {
    registering.value = false;
  }
};

const cancelRegistration = async () => {
  if (!registrationId.value) {
    alert("Nu există o înregistrare de anulat.");
    return;
  }

  try {
    registering.value = true;
    await apiDelete(`/registrations/${registrationId.value}`);
    await fetchEvent();
    alert("Înscrierea a fost anulată.");
  } catch (error) {
    console.error("Error cancelling registration:", error);
    alert("Eroare la anularea înregistrării");
  } finally {
    registering.value = false;
  }
};

const updateRegistrationStatus = async (
  registrationId: number,
  status: string,
) => {
  try {
    processingRegistrationId.value = registrationId;
    await put(`/registrations/${registrationId}`, {
      status,
    });
    await fetchEventRegistrations();
  } catch (error) {
    console.error("Error updating registration status:", error);
    alert("Eroare la actualizarea înregistrării");
  } finally {
    processingRegistrationId.value = null;
  }
};

const deleteRegistrationById = async (registrationId: number) => {
  try {
    processingRegistrationId.value = registrationId;
    await apiDelete(`/registrations/${registrationId}`);
    await fetchEventRegistrations();
  } catch (error) {
    console.error("Error deleting registration:", error);
    alert("Eroare la ștergerea înregistrării");
  } finally {
    processingRegistrationId.value = null;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatGoogleCalendarDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

const googleCalendarUrl = computed(() => {
  if (!event.value) {
    return "#";
  }

  const start = formatGoogleCalendarDate(event.value.start_time);
  const end = formatGoogleCalendarDate(
    event.value.end_time ||
      new Date(
        new Date(event.value.start_time).getTime() + 60 * 60 * 1000,
      ).toISOString(),
  );
  const locationText = location.value
    ? `${location.value.name}, ${location.value.address}, ${location.value.city}`
    : "";
  const timeZone =
    Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || "Europe/Bucharest";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.value.title,
    dates: `${start}/${end}`,
    details: event.value.description || "",
    location: locationText,
    ctz: timeZone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
});

const saveEvent = async () => {
  try {
    await put(`/events/${eventId.value}`, {
      title: editableEvent.value.title,
      description: editableEvent.value.description,
      start_time: new Date(editableEvent.value.start_time).toISOString(),

      end_time: new Date(editableEvent.value.end_time).toISOString(),
      location_id: editableEvent.value.location_id,
      category_name: editableEvent.value.category_name,
      organizer_id: event.value?.organizer_id,
      participation_type: editableEvent.value.participation_type || "open",
      registration_link: editableEvent.value.registration_link || "",
      qr_code: editableEvent.value.qr_code || "",
      max_participants: editableEvent.value.max_participants,
      deadline: editableEvent.value.deadline
        ? new Date(editableEvent.value.deadline).toISOString()
        : new Date(editableEvent.value.end_time).toISOString(),
    });

    alert("Eveniment actualizat cu succes!");

    event.value = {
      ...editableEvent.value,
    };

    hasChanges.value = false;

    await fetchEvent();
  } catch (error) {
    console.error("Error updating event:", error);
    alert("Eroare la actualizarea evenimentului");
  }
};

const deleteEvent = async () => {
  const confirmed = confirm(
    "Ești sigur că dorești să ștergi acest eveniment? Această acțiune nu poate fi anulată.",
  );

  if (!confirmed) {
    return;
  }

  try {
    await apiDelete(`/events/${eventId.value}`);

    alert("Evenimentul a fost șters cu succes.");

    router.push("/gestionare-evenimente");
  } catch (error) {
    console.error("Error deleting event:", error);
    alert("Eroare la ștergerea evenimentului.");
  }
};

watch(
  eventId,
  (id) => {
    if (id) {
      fetchEvent();
    }
  },
  { immediate: true },
);
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

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 text-lg">Se încarcă...</p>
      </div>

      <!-- Event Details -->
      <div v-else-if="event" class="bg-white rounded-lg shadow-lg p-8">
        <div v-if="isOrganizer">
          <input
            v-model="editableEvent.title"
            class="w-full border rounded p-2 text-3xl font-bold"
          />
        </div>

        <h1 v-else class="text-4xl font-bold text-gray-800 mb-4">
          {{ event.title }}
        </h1>

        <div class="mb-6 space-y-3 text-gray-700">
          <div class="flex items-start gap-3 text-sm text-gray-700">
            <span class="text-base mt-0.5" aria-hidden="true">📅</span>

            <div
              v-if="isOrganizer"
              class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <div class="flex flex-col gap-1">
                <label for="start-time" class="font-medium text-gray-600"
                  >Început:</label
                >
                <input
                  id="start-time"
                  type="datetime-local"
                  v-model="editableEvent.start_time"
                  class="px-3 py-1.5 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div class="flex flex-col gap-1">
                <label for="end-time" class="font-medium text-gray-600"
                  >Sfârșit:</label
                >
                <input
                  id="end-time"
                  type="datetime-local"
                  v-model="editableEvent.end_time"
                  class="px-3 py-1.5 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>

            <div v-else class="flex flex-col gap-1">
              <p class="m-0">
                <span class="font-semibold text-gray-600"
                  ><strong>Început:</strong></span
                >
                <span class="ml-1 text-gray-900">{{
                  formatDate(event.start_time)
                }}</span>
              </p>
              <p v-if="event.end_time" class="m-0">
                <span class="font-semibold text-gray-600"
                  ><strong>Sfârșit:</strong></span
                >
                <span class="ml-1 text-gray-900">{{
                  formatDate(event.end_time)
                }}</span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            📍
            <span>
              <strong>Locație:</strong>
              <template v-if="isOrganizer">
                <select
                  v-model.number="editableEvent.location_id"
                  class="ml-2 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option disabled value="">Selectează locația</option>
                  <option
                    v-for="loc in locations"
                    :key="loc.id"
                    :value="loc.id"
                  >
                    {{ loc.name }}
                  </option>
                </select>
              </template>
              <template v-else>
                <template v-if="displayLocation">
                  {{ displayLocation.name }}, {{ displayLocation.address }}
                </template>
                <template v-else>
                  {{ event.location_id }}
                </template>
              </template>
            </span>
          </div>
          <div
            v-if="organizer?.name || event.organizer_id"
            class="flex items-center gap-2"
          >
            👤
            <span>
              <strong>Organizator:</strong>
              <template v-if="organizer?.name">
                {{ organizer.name }}
              </template>
              <template v-else> ID {{ event.organizer_id }} </template>
            </span>
          </div>
          <div
            v-if="event.category_name || isOrganizer"
            class="flex items-center gap-2"
          >
            🏷️
            <span>
              <strong>Categorie:</strong>
              <template v-if="isOrganizer">
                <input
                  v-model="editableEvent.category_name"
                  class="ml-2 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </template>
              <template v-else>
                {{ event.category_name }}
              </template>
            </span>
          </div>

          <div
            v-if="event.participation_type || isOrganizer"
            class="flex items-center gap-2"
          >
            📝
            <span>
              <strong>Tip participare:</strong>
              <template v-if="isOrganizer">
                <select
                  v-model="editableEvent.participation_type"
                  class="ml-2 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </template>
              <template v-else>
                {{ event.participation_type }}
              </template>
            </span>
          </div>

          <div
            v-if="isOrganizer && editableEvent.participation_type === 'Online'"
            class="flex items-center gap-2"
          >
            🔗
            <span class="flex-1">
              <strong>Link înscriere:</strong>
              <input
                v-model="editableEvent.registration_link"
                placeholder="https://..."
                class="ml-2 w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </span>
          </div>

          <div
            v-else-if="
              !isOrganizer &&
              event.participation_type === 'Online' &&
              event.registration_link
            "
            class="flex items-center gap-2"
          >
            🔗
            <a
              :href="event.registration_link"
              target="_blank"
              rel="noopener noreferrer"
              class="ml-2 text-blue-600 hover:underline"
            >
              Deschide linkul pentru eveniment
            </a>
          </div>
          <div
            v-if="event.max_participants"
            class="flex items-center gap-3 text-sm text-gray-700"
          >
            <span class="text-base" aria-hidden="true">👥</span>

            <div v-if="isOrganizer" class="flex items-center gap-2">
              <label for="max-participants" class="font-medium text-gray-600">
                Participanți max:
              </label>
              <input
                id="max-participants"
                type="number"
                v-model.number="editableEvent.max_participants"
                min="1"
                class="w-20 px-2 py-1 border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-semibold"
              />
            </div>

            <p v-else class="m-0">
              <span class="font-semibold text-gray-600">Participanți max:</span>
              <span class="ml-1 font-bold text-gray-900">{{
                event.max_participants
              }}</span>
            </p>
          </div>
        </div>

        <div class="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 class="text-xl font-bold text-gray-800 mb-2">Descriere</h2>
          <div v-if="isOrganizer">
            <textarea
              v-model="editableEvent.description"
              rows="5"
              class="w-full border rounded p-2"
            />
          </div>

          <p v-else>
            {{ event.description }}
          </p>
        </div>

        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            :href="googleCalendarUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Adaugă în Google Calendar
          </a>
        </div>

        <div v-if="isOrganizer && hasChanges" class="mb-6">
          <button
            @click="saveEvent"
            class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Salvează modificările
          </button>
        </div>

        <div v-if="isOrganizer" class="mb-6">
          <button
            @click="deleteEvent"
            class="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium"
          >
            Șterge evenimentul
          </button>
        </div>

        <!-- Registration Section -->
        <div class="bg-blue-50 p-6 rounded-lg">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Înregistrare</h2>

          <div v-if="registrationStatus === 'confirmed'" class="text-center">
            <p class="text-green-600 font-medium text-lg">
              ✓ Ești deja înregistrat la acest eveniment
            </p>
            <button
              @click="cancelRegistration"
              :disabled="registering"
              class="mt-4 w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ registering ? "Se procesează..." : "Anulează înregistrarea" }}
            </button>
          </div>

          <div v-else-if="registrationStatus === 'pending'" class="text-center">
            <p class="text-yellow-600 font-medium text-lg">
              Cererea de înscriere este în curs de procesare
            </p>
            <button
              @click="cancelRegistration"
              :disabled="registering"
              class="mt-4 w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ registering ? "Se procesează..." : "Anulează înregistrarea" }}
            </button>
          </div>

          <div v-else>
            <button
              @click="registerForEvent"
              :disabled="registering"
              class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ registering ? "Se procesează..." : "Înregistrează-te" }}
            </button>
          </div>
        </div>

        <div
          v-if="isOrganizer"
          class="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
        >
          <button
            @click="showRegistrationList = !showRegistrationList"
            class="w-full flex items-center justify-between px-6 py-4 text-left text-gray-800 bg-gray-100 hover:bg-gray-200 transition"
          >
            <span class="font-semibold"
              >Înregistrări eveniment ({{ totalRegistrations }})</span
            >
            <span class="text-lg">{{ showRegistrationList ? "▾" : "▸" }}</span>
          </button>

          <div
            v-show="showRegistrationList"
            class="border-t border-gray-200 px-6 py-4"
          >
            <div class="mb-4">
              <h3 class="text-base font-semibold text-gray-800 mb-2">
                Confirmed
              </h3>
              <div v-if="confirmedRegistrations.length" class="space-y-2">
                <div
                  v-for="registration in confirmedRegistrations"
                  :key="registration.id"
                  class="rounded-lg border border-green-200 bg-green-50 p-3"
                >
                  <div
                    class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p class="text-sm text-gray-700">
                        {{
                          registrationUsers[registration.user_id]?.name ||
                          `#${registration.user_id}`
                        }}
                      </p>
                    </div>
                    <button
                      @click="deleteRegistrationById(registration.id)"
                      :disabled="processingRegistrationId === registration.id"
                      class="mt-3 sm:mt-0 inline-flex items-center justify-center rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {{
                        processingRegistrationId === registration.id
                          ? "Se procesează..."
                          : "Delete"
                      }}
                    </button>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-gray-500">
                Nu există înregistrări confirmate.
              </p>
            </div>

            <div>
              <h3 class="text-base font-semibold text-gray-800 mb-2">
                Pending
              </h3>
              <div v-if="pendingRegistrations.length" class="space-y-2">
                <div
                  v-for="registration in pendingRegistrations"
                  :key="registration.id"
                  class="rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                >
                  <div
                    class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p class="text-sm text-gray-700">
                        {{
                          registrationUsers[registration.user_id]?.name ||
                          `#${registration.user_id}`
                        }}
                      </p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        @click="
                          updateRegistrationStatus(registration.id, 'confirmed')
                        "
                        :disabled="processingRegistrationId === registration.id"
                        class="inline-flex items-center justify-center rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {{
                          processingRegistrationId === registration.id
                            ? "Se procesează..."
                            : "Confirm"
                        }}
                      </button>
                      <button
                        @click="deleteRegistrationById(registration.id)"
                        :disabled="processingRegistrationId === registration.id"
                        class="inline-flex items-center justify-center rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {{
                          processingRegistrationId === registration.id
                            ? "Se procesează..."
                            : "Delete"
                        }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-gray-500">
                Nu există înregistrări în așteptare.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12">
        <p class="text-gray-600 text-lg">
          {{ errorMessage || "Evenimentul nu a putut fi încărcat." }}
        </p>
        <button
          @click="router.push('/events')"
          class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Înapoi la lista de evenimente
        </button>
      </div>
    </div>
  </div>
</template>
