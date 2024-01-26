import { createI18n, useI18n } from 'vue-i18n'

const i18n = createI18n({
  locale: 'EN',
  legacy: false,
  globalInjection: true,
  messages: {
    CN: {
      title: '版本更新',
      loading: '加载中',
      local_version: '本地版本',
      latest_version: '最新版本',
      operate_btn: {
        LATEST: '无需更新',
        OUTDATED: '更新',
        DOWNLOADING_COMPARE: '比对中',
        DOWNLOADING: '下载中',
        DOWNLOADED: '安装',
        INSTALLING: '安装中',
        INSTALLED: '重启',
        ERROR: '错误',
        INVALID: '无效',
      },
    },
    EN: {
      title: 'Version Update',
      loading: 'Loading',
      local_version: 'Local version',
      latest_version: 'Latest version',
      operate_btn: {
        LATEST: 'No Update',
        OUTDATED: 'Update',
        DOWNLOADING_COMPARE: 'Comparing',
        DOWNLOADING: 'Downloading',
        DOWNLOADED: 'Install',
        INSTALLING: 'Installing',
        INSTALLED: 'Restart',
        ERROR: 'Error',
        INVALID: 'Invalid',
      },
    },
    FA: {
      title: 'به روز رسانی نسخه جدید',
      loading: 'بارگذاری',
      local_version: 'نسخه محلی',
      latest_version: 'آخرین ویرایش',
      operate_btn: {
        LATEST: 'بدون به روز رسانی',
        OUTDATED: 'به روز رسانی',
        DOWNLOADING_COMPARE: 'مقایسه کردن',
        DOWNLOADING: 'در حال دانلود',
        DOWNLOADED: 'نصب',
        INSTALLING: 'در حال نصب',
        INSTALLED: 'راه اندازی مجدد',
        ERROR: 'خطا',
        INVALID: 'بی اعتبار',
      },
    },
  },
})

window.api.VerLang().then(l=>{
  i18n.global.locale.value = l
}).catch(err=>{
  console.error('i18n get language failed:', err)
})

export default i18n