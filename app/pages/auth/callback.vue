<script setup lang="ts">
import { supabase } from "@/lib/supabase";

onMounted(async () => {
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/supabase-google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({ token: data.session.access_token }),
        },
      );

      if (!response.ok) {
        throw new Error("Google auth backend validation failed");
      }

      const result = await response.json();

      useCookie("token").value = result.access_token;
      useCookie("isLoggedIn").value = "true";
      useCookie("userId").value = String(result.user_id);
      useCookie("userEmail").value = result.email || "";
      useCookie("userName").value = result.name || result.email || "";
    } catch (error) {
      console.error("Error during Google auth callback:", error);
    }
  }

  navigateTo("/");
});
</script>
