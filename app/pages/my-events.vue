<script setup lang="ts">
import { useApi } from "~/composables/useApi";

definePageMeta({
  middleware: "auth",
});

const { get } = useApi();
const router = useRouter();
const loading = ref(true);

interface Registration {
  id: number;
  event_id: number;
  status: string;
  event?: {
    title: string;
    start_time: string;
    end_time?: string;
    category_name: string;
    participation_type: string;
  };
}

const registrations = ref<Registration[]>([]);

const fetchMyRegistrations = async () => {
  try {
    loading.value = true;
    const userId = Number(useCookie("userId").value);
    if (!userId) {
      throw new Error("User ID not set");
    }
    const data = await get(`/registrations/user/${userId}`);

    const enrichedRegistrations = await Promise.all(
      data.map(async (registration: any) => {
        try {
          const eventData = await get(`/events/${registration.event_id}`);
          return {
            ...registration,
            event: eventData,
          };
        } catch (eventError) {
          console.error(
            `Error fetching event ${registration.event_id}:`,
            eventError,
          );
          return registration;
        }
      }),
    );

    registrations.value = enrichedRegistrations;

    console.log("Registrations:", enrichedRegistrations);

    enrichedRegistrations.forEach((registration: any, index: number) => {
      console.log(`Event ${index + 1}:`, registration);
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    alert("Eroare la încărcarea înregistrărilor");
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

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-blue-100 text-blue-800";
};

const pad = (value: number) => String(value).padStart(2, "0");

const formatIcsDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
};

const escapeIcsText = (text: string) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const exportRegistrationsToIcs = () => {
  const icsEvents = registrations.value
    .filter((reg) => reg.event && reg.event.start_time)
    .map((reg, index) => {
      const eventData = reg.event!;
      const start = formatIcsDateTime(eventData.start_time);
      const endDate = eventData.end_time
        ? new Date(eventData.end_time)
        : new Date(new Date(eventData.start_time).getTime() + 60 * 60 * 1000);
      const end = formatIcsDateTime(endDate.toISOString());
      const summary = escapeIcsText(eventData.title || "Eveniment");
      const description = escapeIcsText(
        `Categorie: ${eventData.category_name || "-"}\nStatus: ${reg.status}`,
      );
      const uid = `registration-${reg.id}-${index}@frontend`;

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `SUMMARY:${summary}`,
        `DTSTAMP:${formatIcsDateTime(new Date().toISOString())}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT",
      ].join("\r\n");
    });

  if (!icsEvents.length) {
    alert("Nu există evenimente pentru export.");
    return;
  }

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyEventsApp//RO//EN",
    "CALSCALE:GREGORIAN",
    ...icsEvents,
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "evenimente_inscrise.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

onMounted(() => {
  fetchMyRegistrations();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">Evenimentele mele</h1>

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
          </div>
          <button
            @click="exportRegistrationsToIcs"
            :disabled="registrations.length === 0"
            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export .ics
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 text-lg">Se încarcă...</p>
      </div>

      <!-- Registrations List -->
      <div v-else-if="registrations.length > 0" class="space-y-4">
        <div
          v-for="reg in registrations"
          :key="reg.id"
          class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2">
                {{ reg.event?.title || "Eveniment" }}
              </h3>
              <div class="space-y-1 text-gray-600">
                <p v-if="reg.event?.start_time">
                  📅 {{ formatDate(reg.event.start_time) }}
                </p>
                <p v-if="reg.event?.category_name">
                  🏷️ {{ reg.event.category_name }}
                </p>
                <p v-if="reg.event?.participation_type">
                  🌐
                  {{
                    reg.event.participation_type === "online"
                      ? "Online"
                      : "Offline"
                  }}
                </p>
              </div>
            </div>

            <!-- Status Badge -->
            <span
              :class="`${getStatusColor(reg.status)} px-4 py-2 rounded-full font-medium text-sm`"
            >
              {{ reg.status }}
            </span>
          </div>

          <NuxtLink
            :to="`/events/${reg.event_id}`"
            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition inline-block text-center"
          >
            Vezi detalii
          </NuxtLink>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 bg-white rounded-lg">
        <p class="text-gray-600 text-lg mb-4">
          Nu ești înregistrat la niciun eveniment
        </p>
        <router-link
          to="/events"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
        >
          Caută un eveniment
        </router-link>
      </div>
    </div>
  </div>
</template>
