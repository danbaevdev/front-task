<template>
  <div
    class="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
    @click="focusInput"
    @focusin="handleFocus"
    @focusout="handleBlur"
    tabindex="-1"
  >
    <!-- Аватар -->
    <div
      v-if="avatarUrl"
      class="relative"
    >
      <img
        :src="avatarUrl"
        :alt="label || 'avatar'"
        class="w-14 h-14 rounded-full border-2 object-cover transition-all duration-200"
        :class="[
          isFocused
            ? 'border-violet-500 ring-2 ring-violet-200 ring-offset-2'
            : 'border-gray-300'
        ]"
      />
    </div>

    <div class="flex-1 min-w-0">
      <!-- Label -->
      <label
        v-if="label"
        :for="inputId"
        class="block text-sm font-bold tracking-wide transition-colors duration-200 mb-1"
        :class="isFocused ? 'text-violet-600' : 'text-gray-700'"
      >
        {{ label.toUpperCase() }}
      </label>

      <!-- Input с суффиксом -->
      <div class="flex items-center gap-2">
        <!-- Input field -->
        <input
          ref="inputRef"
          :value="displayValue"
          @input="handleInput"
          @keydown="handleKeyDown"
          @focus="handleFocus"
          @blur="handleBlur"
          :style="{ width: inputWidth + 'px' }"
          type="text"
          inputmode="numeric"
          :id="inputId"
          :placeholder="placeholder"
          class="font-medium text-gray-900 bg-white border border-gray-300 rounded px-3 py-2 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-100 flex-1 min-w-0"
        />

        <!-- Суффикс -->
        <span
          v-if="suffix"
          class="text-gray-600 whitespace-nowrap"
        >
          {{ suffix }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'

interface Props {
  modelValue: number
  avatarUrl?: string
  label?: string
  suffix?: string
  placeholder?: string
  minWidth?: number
  inputId?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '0',
  minWidth: 72,
  inputId: 'numeric-field-input'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)
const internalValue = ref('')

// Инициализируем внутреннее значение
watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue.toString()
}, { immediate: true })

// Отформатированное значение для отображения
const displayValue = computed(() => {
  if (!internalValue.value) return ''
  return internalValue.value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
})

// Адаптивная ширина
const inputWidth = computed(() => {
  const valueLength = internalValue.value.length

  if (valueLength === 0) return props.minWidth
  if (valueLength <= 3) return props.minWidth
  if (valueLength <= 6) return props.minWidth + (valueLength - 3) * 10
  if (valueLength <= 9) return props.minWidth + 30 + (valueLength - 6) * 8

  return Math.min(props.minWidth + 100, 300)
})

// Главная функция обработки ввода
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const cursorPosition = target.selectionStart || 0
  const oldValue = internalValue.value
  const inputText = target.value

  // Удаляем все нецифровые символы
  let newValue = inputText.replace(/\D/g, '')

  // Если старое значение было "0" и новое начинается с "0" но это не просто "0"
  if (oldValue === '0' && newValue.startsWith('0') && newValue.length > 1) {
    // Убираем первый ноль
    newValue = newValue.substring(1)
  }

  // Преобразуем в число
  const numericValue = newValue === '' ? 0 : parseInt(newValue, 10)

  // Обновляем внутреннее значение
  internalValue.value = newValue

  // Отправляем число
  emit('update:modelValue', isNaN(numericValue) ? 0 : numericValue)

  // Обновляем курсор
  nextTick(() => {
    updateCursorPosition(target, cursorPosition, inputText, newValue)
  })
}

// Функция обновления позиции курсора
const updateCursorPosition = (target: HTMLInputElement, oldCursorPos: number, oldDisplayValue: string, newCleanValue: string) => {
  if (!inputRef.value) return

  const formattedValue = newCleanValue ? newCleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''

  // Устанавливаем отформатированное значение
  inputRef.value.value = formattedValue

  if (!formattedValue) {
    inputRef.value.setSelectionRange(0, 0)
    return
  }

  const textBeforeCursor = oldDisplayValue.substring(0, oldCursorPos)
  const digitsBeforeCursor = textBeforeCursor.replace(/\D/g, '').length

  let newCursorPos = 0
  let digitCount = 0

  for (let i = 0; i < formattedValue.length; i++) {
    if (formattedValue[i] !== ' ') {
      digitCount++
    }

    if (digitCount === digitsBeforeCursor) {
      newCursorPos = i + 1
      break
    }
  }

  if (newCursorPos === 0) {
    newCursorPos = formattedValue.length
  }

  if (newCursorPos < formattedValue.length && formattedValue[newCursorPos] === ' ') {
    newCursorPos++
  }

  inputRef.value.setSelectionRange(newCursorPos, newCursorPos)
}

// Обработка клавиш
const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLInputElement

  const allowedKeys = [
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
    'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End',
    'Enter'
  ]

  if (event.ctrlKey || event.metaKey) {
    return
  }

  if (!/\d/.test(event.key) && !allowedKeys.includes(event.key)) {
    event.preventDefault()
    return
  }

  const currentValue = internalValue.value
  if (currentValue === '0' && /\d/.test(event.key)) {
    return
  }
}

// Фокус
const handleFocus = () => {
  isFocused.value = true
  nextTick(() => {
    if (inputRef.value) {
      const value = inputRef.value.value
      if (value) {
        inputRef.value.setSelectionRange(value.length, value.length)
      }
    }
  })
}

// Потеря фокуса
const handleBlur = () => {
  isFocused.value = false
}

// Фокус на инпут при клике на всю область
const focusInput = () => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

// Метод для внешнего фокуса
const focus = () => {
  inputRef.value?.focus()
}

defineExpose({
  focus
})
</script>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>
