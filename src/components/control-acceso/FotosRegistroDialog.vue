<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchFotoIneUrl, fetchFotosLlegadaUrls } from '@/api/onboardingClient'

/**
 * Visor de fotos del registro (1e.1a): INE del tutor y fotos de llegada, con
 * una foto grande y miniaturas a la derecha.
 */
const props = defineProps<{
  registroId: string
  titulo: string
  subtitulo?: string
}>()

const open = defineModel<boolean>({ required: true })

type Pestana = 'ine' | 'llegada'

const pestana = ref<Pestana>('ine')
const seleccion = ref(0)
const ineUrl = ref<string | null>(null)
const llegadaUrls = ref<string[]>([])
const cargando = ref(false)
const ineError = ref(false)
const llegadaError = ref(false)

function liberarUrls(): void {
  if (ineUrl.value) URL.revokeObjectURL(ineUrl.value)
  llegadaUrls.value.forEach((u) => URL.revokeObjectURL(u))
  ineUrl.value = null
  llegadaUrls.value = []
}

watch(open, async (visible) => {
  if (!visible) {
    liberarUrls()
    return
  }
  pestana.value = 'ine'
  seleccion.value = 0
  ineError.value = false
  llegadaError.value = false
  cargando.value = true
  const [ine, llegada] = await Promise.allSettled([
    fetchFotoIneUrl(props.registroId),
    fetchFotosLlegadaUrls(props.registroId),
  ])
  if (ine.status === 'fulfilled') ineUrl.value = ine.value
  else ineError.value = true
  if (llegada.status === 'fulfilled') llegadaUrls.value = llegada.value
  else llegadaError.value = true
  cargando.value = false
})

const fotos = computed(() =>
  pestana.value === 'ine' ? (ineUrl.value ? [ineUrl.value] : []) : llegadaUrls.value,
)
const fotoActual = computed(() => fotos.value[seleccion.value] ?? null)
const hayError = computed(() => (pestana.value === 'ine' ? ineError.value : llegadaError.value))

function cambiarPestana(p: Pestana): void {
  pestana.value = p
  seleccion.value = 0
}
</script>

<template>
  <q-dialog v-model="open" maximized transition-show="fade" transition-hide="fade">
    <div class="fotos">
      <header class="fotos__head">
        <button type="button" class="fotos__close" aria-label="Cerrar" @click="open = false">
          <q-icon name="close" size="22px" />
        </button>
        <div class="fotos__titles">
          <span class="fotos__title">{{ titulo }}</span>
          <span v-if="subtitulo" class="fotos__subtitle">{{ subtitulo }}</span>
        </div>
        <div class="fotos__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="pestana === 'ine'"
            :class="{ 'fotos__tab--on': pestana === 'ine' }"
            class="fotos__tab"
            @click="cambiarPestana('ine')"
          >
            INE / Identificación
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="pestana === 'llegada'"
            :class="{ 'fotos__tab--on': pestana === 'llegada' }"
            class="fotos__tab"
            @click="cambiarPestana('llegada')"
          >
            Fotos de llegada<template v-if="llegadaUrls.length">
              · {{ llegadaUrls.length }}</template
            >
          </button>
        </div>
      </header>

      <div class="fotos__body">
        <div class="fotos__main">
          <q-spinner v-if="cargando" color="white" size="48px" />
          <div v-else-if="hayError || !fotoActual" class="fotos__empty">
            <q-icon name="broken_image" size="48px" />
            <span>No disponible</span>
          </div>
          <img v-else :src="fotoActual" alt="" class="fotos__img" />
        </div>
        <div v-if="fotos.length > 1" class="fotos__thumbs">
          <button
            v-for="(url, i) in fotos"
            :key="url"
            type="button"
            class="fotos__thumb"
            :class="{ 'fotos__thumb--on': i === seleccion }"
            :aria-label="`Foto ${i + 1}`"
            @click="seleccion = i"
          >
            <img :src="url" alt="" />
          </button>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<style scoped lang="scss">
.fotos {
  width: 100%;
  height: 100%;
  background: #0d1230;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px 28px 28px;
  gap: 20px;

  &__head {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__close {
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  &__titles {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 20px;
    font-weight: 800;
  }

  &__subtitle {
    font-size: 13px;
    color: #aeb8e8;
  }

  &__tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
  }

  &__tab {
    height: 34px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: #fff;
    font: inherit;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;

    &--on {
      background: #fff;
      color: var(--text-strong);
    }
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 20px;
  }

  &__main {
    flex: 1;
    min-width: 0;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  &__img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #8f9bd4;
  }

  &__thumbs {
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }

  &__thumb {
    height: 132px;
    padding: 0;
    border: 2px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    background: #000;
    overflow: hidden;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &--on {
      border-color: #fff;
    }
  }
}
</style>
