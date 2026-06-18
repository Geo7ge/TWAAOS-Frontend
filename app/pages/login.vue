<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const email = ref("");
const password = ref("");
const router = useRouter();

const login = async () => {
  try {
    const response = await fetch("http://127.0.0.1:8000/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    if (!response.ok) throw new Error("Login failed");

    const data = await response.json();

    useCookie("token").value = data.access_token;
    useCookie("isLoggedIn").value = "true";
    useCookie("userId").value = String(data.user_id);

    router.push("/");
  } catch (error) {
    console.error("Eroare login:", error);
    alert("Email sau parolă greșită");
  }
};

// 🔵 GOOGLE LOGIN
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:3000/auth/callback",
    },
  });

  if (error) {
    console.error("Google login error:", error);
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
      <h1 class="text-2xl font-bold text-center mb-6">Login</h1>

      <!-- EMAIL/PASSWORD LOGIN -->
      <form @submit.prevent="login" class="space-y-4">
        <div>
          <label class="block mb-2 text-sm font-medium">Email</label>
          <input
            v-model="email"
            type="email"
            class="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label class="block mb-2 text-sm font-medium">Parolă</label>
          <input
            v-model="password"
            type="password"
            class="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <button
          class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Autentificare
        </button>
      </form>

      <!-- 🔵 GOOGLE LOGIN BUTTON -->
      <button
        @click="handleGoogleLogin"
        class="w-full mt-4 flex items-center justify-center gap-2 border py-2 rounded-lg hover:bg-gray-100"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          class="w-5 h-5"
        />
        Continuă cu Google
      </button>

      <!-- 🔴 LOGOUT (opțional aici)
      <button
        @click="
          () => {
            useCookie('token').value = null;
            useCookie('isLoggedIn').value = null;
            router.push('/login');
          }
        "
        class="w-full mt-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
      >
        Logout
      </button> -->
    </div>
  </div>
</template>
