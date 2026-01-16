<template>
  <div
    class="flex items-center gap-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
    @click="focusInput"
    @focusin="handleFocus"
    @focusout="handleBlur"
    tabindex="-1"
  >
    <div
      v-if="avatarUrl"
      class="relative shrink-0"
    >
      <img
        :src="avatarUrl"
        :alt="label || 'avatar'"
        class="size-20 rounded-full object-cover transition-all duration-200"
        :class="[
          isFocused && 'ring ring-primary ring-offset-2'
        ]"
      />
    </div>

    <div class="flex-1 min-w-0">
      <!-- Label -->
      <label
        v-if="label"
        :for="inputId"
        class="block transition-colors duration-200 mb-3"
        :class="isFocused ? 'text-primary' : 'text-dark'"
      >
        {{ label.toUpperCase() }}
      </label>

      <div class="flex items-center gap-3 relative">
        <span
          ref="measureRef"
          class="invisible absolute whitespace-pre font-medium font-inter text-lg px-3 h-11 flex items-center pointer-events-none"
          aria-hidden="true"
        >
          {{ displayValue || placeholder }}
        </span>

        <!-- Input field -->
        <input
          ref="inputRef"
          :value="displayValue"
          @input="handleInput"
          @keydown="handleKeyDown"
          @focus="handleFocus"
          @blur="handleBlur"
          type="tel"
          inputmode="numeric"
          :id="inputId"
          :placeholder="placeholder"
          :style="{ width: inputWidth + 'px', minWidth: minWidth + 'px' }"
          class="font-medium font-inter text-lg text-gray-900 bg-white border border-gray-300 rounded-[6px] px-3 h-11 outline-none transition-colors focus:border-primary-light"
        />

        <span
          v-if="suffix"
          class="text-dark font-inter whitespace-nowrap shrink-0"
        >
          {{ suffix.toLowerCase() }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted, onUnmounted } from 'vue'

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
const measureRef = ref<HTMLElement | null>(null)
const isFocused = ref(false)
const internalValue = ref('')
const measuredWidth = ref(props.minWidth)

// The largest safe integer in JavaScript
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER
const MAX_DIGITS = MAX_SAFE_INTEGER.toString().length

const updateMeasuredWidth = () => {
  if (!measureRef.value) return

  nextTick(() => {
    const width = measureRef.value?.offsetWidth || 0
    measuredWidth.value = Math.max(props.minWidth, width + 2)
  })
}

watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue.toString()
  updateMeasuredWidth()
}, { immediate: true })

const displayValue = computed(() => {
  if (!internalValue.value) return ''
  return internalValue.value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
})

const inputWidth = computed(() => {
  return measuredWidth.value
})

watch(displayValue, () => {
  updateMeasuredWidth()
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const cursorPosition = target.selectionStart || 0
  const oldValue = internalValue.value
  const inputText = target.value

  let newValue = inputText.replace(/\D/g, '')

  if (oldValue === '0' && newValue.startsWith('0') && newValue.length > 1) {
    newValue = newValue.substring(1)
  }

  // Limit to maximum safe integer (16 digits)
  if (newValue.length > MAX_DIGITS) {
    newValue = newValue.substring(0, MAX_DIGITS)
  }

  internalValue.value = newValue

  // Convert to a number, but check the bounds
  let numericValue = 0
  if (newValue) {
    const parsed = Number(newValue)
    if (!isNaN(parsed)) {
      numericValue = parsed > MAX_SAFE_INTEGER ? MAX_SAFE_INTEGER : parsed
    }
  }

  emit('update:modelValue', isNaN(numericValue) ? 0 : numericValue)

  nextTick(() => {
    updateCursorPosition(target, cursorPosition, inputText, newValue)
    updateMeasuredWidth()
  })
}

const updateCursorPosition = (target: HTMLInputElement, oldCursorPos: number, oldDisplayValue: string, newCleanValue: string) => {
  if (!inputRef.value) return

  const formattedValue = newCleanValue ? newCleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''

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

const handleBlur = () => {
  isFocused.value = false
}

const focusInput = () => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

const focus = () => {
  inputRef.value?.focus()
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateMeasuredWidth()

  if (measureRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateMeasuredWidth()
    })
    resizeObserver.observe(measureRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

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
