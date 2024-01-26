<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button, Progress } from 'vant'

const { t } = useI18n()

const isMac = /macintosh|mac os x/i.test(navigator.userAgent)
const version = ref({})
const downloadRate = ref(0)
const operating = ref(false)

window.api.Ver().then(data=>{
  // console.log("Ver:", data)
  version.value = data
  if (version.value.status == 'DOWNLOADED') {
    downloadRate.value = 100
  }
}).catch(err=>{
  alert(err)
})
window.api.VerListen((data)=>{
  // console.log("VerListen:", data)
  version.value = data
  if (version.value.status == 'DOWNLOADED') {
    downloadRate.value = 100
  }
})
window.api.VerListenDown((data)=>{
  // console.log("VerListenDown:", data)
  if (data.percent) {
    downloadRate.value = parseInt(data.percent.toFixed(0))
  }
})

const local = computed(()=>{
  if ('local' in version.value) {
    return version.value.local
  }
  return t('loading')
})
const server = computed(()=>{
  if ('server' in version.value) {
    return version.value.server
  }
  return t('loading')
})
const operateBtnDisabled = computed(()=>{
  if (operating.value) {
    return true
  }
  if ('status' in version.value) {
    switch (version.value.status) {
      case 'OUTDATED':
      case 'DOWNLOADED':
      case 'INSTALLED':
        return false
      default:
        return true
    }
  }
  return true
})
const operateBtnTxt = computed(()=>{
  if ('status' in version.value) {
    switch (version.value.status) {
      case 'LATEST':
      case 'OUTDATED':
      case 'DOWNLOADING_COMPARE':
      case 'DOWNLOADING':
      case 'DOWNLOADED':
      case 'INSTALLING':
      case 'INSTALLED':
      case 'ERROR':
        return t(`operate_btn.${version.value.status}`)
      default:
        return t('operate_btn.INVALID')
    }
  }
  return t('loading')
})
const windowoperaterPosition = computed(()=>{
  if (isMac) {
    return 'left'
  } else {
    return 'right'
  }
})

const operate = () => {
  if (operating.value) {
    return
  }
  if (!('status' in version.value)) {
    return
  }

  operating.value = true
  switch (version.value.status) {
    case 'OUTDATED':
      window.api.VerDown().catch(err=>{
        alert(err)
      }).finally(()=>{
        operating.value = false
      })
      break
    case 'DOWNLOADED':
      window.api.VerInst().catch(err=>{
        alert(err)
      }).finally(()=>{
        operating.value = false
      })
      break
    default:
      operating.value = false
  }
}

const canClose = () => {
  if ('isForce' in version.value) {
    return !version.value.isForce
  }
  return  false
}

const close = () => {
  window.api.VerClose().catch(err=>{
    console.error('VerClose failed:', err)
  })
}
</script>

<template>
  <div class="page">
    <div class="header">
      <div class="center">{{ $t('title') }}</div>
      <div :class="windowoperaterPosition">
        <img v-if="canClose" @click="close" class="window-operater no-drag" src="@/assets/icons/close.png">
      </div>
    </div>
    <div class="main">
      <div class="version">
        <div class="info">
          <div>
            <p>{{ $t('local_version') }}:</p>
            <p>{{ local }}</p>
          </div>
          <div>
            <p>{{ $t('latest_version') }}:</p>
            <p>{{ server }}</p>
          </div>
        </div>
        <div class="progress" v-if="version.status === 'DOWNLOADING' || version.status === 'DOWNLOADED'">
          <Progress v-if="!isNaN(downloadRate)" :percentage="downloadRate"/>
        </div>
        <div class="operate">
          <Button type="primary" round :disabled="operateBtnDisabled" @click="operate">{{ operateBtnTxt }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
p {
  margin: 0;
}
.version {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
.version .info {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 1rem;
}
.version .info div {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
.version .progress {
  width: 100%;
}
.van-button {
  height: 2.6rem;
  padding-left: 3rem;
  padding-right: 3rem;
}
@media screen and (max-width: 16.5rem) {
  .version .info {
    flex-direction: column;
  }
}
@media screen and (min-width: 16.5rem) {
  .version .info {
    flex-direction: row;
  }
}
</style>
