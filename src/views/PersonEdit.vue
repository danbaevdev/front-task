<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { store } from '@/store'
import AppNumericField from "@/ui/shared/AppNumericField.vue";

const route = useRoute()

const person = computed(() => {
  const id = Number(route.params.id)
  return store.people.find((p) => p.id === id)
})

function updateAge(value: number) {
  if (person.value) {
    person.value.ageInHours = value
  }
}
</script>

<template>
  <div v-if="person" class="flex flex-col gap-4">
    <router-link to="/" class="text-violet-600 hover:underline text-sm">&larr; Back</router-link>

    <AppNumericField
      v-model="person.ageInHours"
      @update:modelValue="updateAge"
      :avatarUrl="'/img.png'"
      :label="person.name + ' is'"
      suffix="hours old"
      placeholder="0"
      :minWidth="72"
      inputId="hours-input"
    />
  </div>

  <div v-else>
    <p class="text-gray-600">Person not found</p>
    <router-link to="/" class="text-violet-600 hover:underline text-sm">Back to list</router-link>
  </div>
</template>
