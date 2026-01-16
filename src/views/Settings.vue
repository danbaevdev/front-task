<script setup lang="ts">
import { store } from '@/store'
import AppNumericField from "@/ui/shared/AppNumericField.vue";

function updateMinimumAge(value: number) {
  store.minimumAgeInMonths = value
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <router-link to="/" class="text-violet-600 hover:underline text-sm">&larr; Back</router-link>

    <h1 class="text-xl font-bold text-gray-700">Settings</h1>

    <AppNumericField
      v-model="store.minimumAgeInMonths"
      @update:modelValue="updateMinimumAge"
      label="MINIMUM AGE"
      suffix="months"
      placeholder="0"
      inputId="min-age-input"
    />
  </div>
</template>
