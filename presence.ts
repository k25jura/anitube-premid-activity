import { ActivityType, Assets, getTimestamps } from 'premid'

const presence = new Presence({
  clientId: '503557087041683458',
})

const browsingTimestamp = Math.floor(Date.now() / 1000)

enum ActivityAssets {
  Logo = 'https://anitube.in.ua/apple-touch-icon.png',
}

const TRANSLATIONS = {
  uk: {
    watchingAnime: 'Переглядає аніме',
    browsing: 'Переглядає сайт...',
    viewHome: 'На головній сторінці',
    viewGenre: 'Жанр:',
    viewProfile: 'Профіль:',
    viewLists: 'Списки:',
    readingArticle: 'Читає статтю:',
    readingNews: 'Читає новини:',
    search: 'Шукає аніме',
    searchFor: 'Шукає:',
    searchingCatalog: 'В каталозі аніме',
    randomAnime: 'Шукає випадкове аніме',
    yearAnime: 'Аніме {year} року',
    voiceTeam: 'Озвучення: {team}',
    videoPaused: 'На паузі',
    videoPlaying: 'Відтворюється',
    buttonWatchAnime: 'Дивитися аніме',
    buttonReadArticle: 'Читати статтю',
    watchrooms: 'Кімнати спільного перегляду',
    seasons: 'Аніме за сезонами',
    topAnime: 'Топ аніме',
    collections: 'Колекції аніме',
    animetube: 'AnimeTube відео',
    kawaiChat: 'Спілкується в кавайному чатику',
    pmDialogs: 'Особисті повідомлення',
    pmChatWith: 'Переписується з {user}',
    statistics: 'Статистика сайту',
    lastComments: 'Останні коментарі',
    animeCatalog: 'Каталог аніме',
    allAnimeList: 'Всі аніме',
    news: 'Новини аніме',
    articles: 'Статті про аніме',
    subculture: 'Аніме-субкультура',
    friends: 'Друзі сайту',
    ageRestrictions: 'Вікові обмеження',
    favorites: 'Улюблене',
    writing: 'Пише...',
    reading: 'Читає...',
  },
  en: {
    watchingAnime: 'Watching anime',
    browsing: 'Browsing...',
    viewHome: 'Homepage',
    viewGenre: 'Genre:',
    viewProfile: 'Profile:',
    viewLists: 'Lists:',
    readingArticle: 'Reading article:',
    readingNews: 'Reading news:',
    search: 'Searching anime',
    searchFor: 'Searching for:',
    searchingCatalog: 'In anime catalog',
    randomAnime: 'Looking for a random anime',
    yearAnime: 'Anime of {year}',
    voiceTeam: 'Voice: {team}',
    videoPaused: 'Paused',
    videoPlaying: 'Playing',
    buttonWatchAnime: 'Watch Anime',
    buttonReadArticle: 'Read Article',
    watchrooms: 'Watchrooms',
    seasons: 'Anime Seasons',
    topAnime: 'Top Anime',
    collections: 'Anime Collections',
    animetube: 'AnimeTube Videos',
    kawaiChat: 'Chatting in Kawai Chat',
    pmDialogs: 'Direct Messages',
    pmChatWith: 'Chatting with {user}',
    statistics: 'Site Statistics',
    lastComments: 'Latest Comments',
    animeCatalog: 'Anime Catalog',
    allAnimeList: 'All Anime',
    news: 'Anime News',
    articles: 'Anime Articles',
    subculture: 'Anime Subculture',
    friends: 'Site Friends',
    ageRestrictions: 'Age Restrictions',
    favorites: 'Favorites',
    writing: 'Writing...',
    reading: 'Reading...',
  },
}

let cachedSettings: {
  forceLanguage: 'uk' | 'en'
  privacy: boolean
  showCover: boolean
  showTimestamps: boolean
  showButtons: boolean
} = {
  forceLanguage: 'uk',
  privacy: false,
  showCover: true,
  showTimestamps: true,
  showButtons: true,
}

function parseLanguage(val: unknown): 'uk' | 'en' {
  if (val === 1 || val === '1' || val === 'English' || val === 'en')
    return 'en'
  return 'uk'
}

async function refreshSettings(): Promise<void> {
  try {
    const [forceLanguage, privacy, showCover, showTimestamps, showButtons] = await Promise.all([
      presence.getSetting<string | number>('forceLanguage').catch(() => 0),
      presence.getSetting<boolean>('privacy').catch(() => false),
      presence.getSetting<boolean>('showCover').catch(() => true),
      presence.getSetting<boolean>('showTimestamps').catch(() => true),
      presence.getSetting<boolean>('showButtons').catch(() => true),
    ])
    cachedSettings = {
      forceLanguage: parseLanguage(forceLanguage),
      privacy: Boolean(privacy),
      showCover: showCover !== false,
      showTimestamps: showTimestamps !== false,
      showButtons: showButtons !== false,
    }
  }
  catch {}
}

refreshSettings()
setInterval(refreshSettings, 2500)

function t(key: keyof typeof TRANSLATIONS.uk, params?: Record<string, string>): string {
  const lang: 'uk' | 'en' = cachedSettings.forceLanguage
  let text = TRANSLATIONS[lang][key] || TRANSLATIONS.uk[key] || ''
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    }
  }
  return text
}

// Real-time playback state from player events
const playback = {
  currentTime: 0,
  duration: 0,
  paused: true,
  hasPlayed: false,
  lastTime: 0,
  lastUpdate: 0,
}

let lastPathname = ''

window.addEventListener('message', (event) => {
  try {
    let data = event.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      }
      catch {}
    }

    if (!data || typeof data !== 'object')
      return

    const ev = data.event || data.type || data.status

    if (ev === 'time' || ev === 'timeupdate' || ev === 'progress') {
      const time = Number.parseFloat(data.time || data.data || data.currentTime || 0)
      const duration = Number.parseFloat(data.duration || data.total || 0)

      if (duration > 0)
        playback.duration = duration

      if (time > 0) {
        if (time !== playback.lastTime) {
          playback.paused = false
          playback.hasPlayed = true
          playback.currentTime = time
          playback.lastTime = time
          playback.lastUpdate = Date.now()
        }
      }
    }
    else if (ev === 'duration') {
      const duration = Number.parseFloat(data.data || data.duration || 0)
      if (duration > 0)
        playback.duration = duration
    }
    else if (ev === 'pause' || ev === 'paused' || ev === 'stop' || ev === 'stopped') {
      playback.paused = true
      playback.lastUpdate = Date.now()
    }
    else if (ev === 'play' || ev === 'playing' || ev === 'start' || ev === 'started') {
      playback.paused = false
      playback.hasPlayed = true
      playback.lastUpdate = Date.now()
    }
  }
  catch {}
})

const GENRE_MAP: Record<string, { uk: string, en: string }> = {
  'dystopia': { uk: 'Антиутопія', en: 'Dystopia' },
  'fight': { uk: 'Бойове мистецтво', en: 'Martial Arts' },
  'action': { uk: 'Бойовик', en: 'Action' },
  'routine': { uk: 'Буденність', en: 'Slice of Life' },
  'war': { uk: 'Війна', en: 'War' },
  'gothic': { uk: 'Готика', en: 'Gothic' },
  'detective': { uk: 'Детектив', en: 'Detective' },
  'dementia': { uk: 'Деменція', en: 'Dementia' },
  'josei': { uk: 'Джьосей', en: 'Josei' },
  'drama': { uk: 'Драма', en: 'Drama' },
  'kids': { uk: 'Для дітей', en: 'Kids' },
  'ero': { uk: 'Еротика', en: 'Erotica' },
  'echi': { uk: 'Еччі', en: 'Ecchi' },
  'horror': { uk: 'Жахи', en: 'Horror' },
  'zombie': { uk: 'Зомбі', en: 'Zombie' },
  'isekai': { uk: 'Ісекай', en: 'Isekai' },
  'story': { uk: 'Історія', en: 'Historical' },
  'fairy': { uk: 'Казка', en: 'Fairy Tale' },
  'comedy': { uk: 'Комедія', en: 'Comedy' },
  'cyberpunk': { uk: 'Кіберпанк', en: 'Cyberpunk' },
  'komodo': { uk: 'Кодомо', en: 'Kodomo' },
  'majokko': { uk: 'Махо-шьоджьо', en: 'Mahou Shoujo' },
  'mecha': { uk: 'Меха', en: 'Mecha' },
  'mystic': { uk: 'Містика', en: 'Mystery' },
  'music': { uk: 'Музичний', en: 'Music' },
  'supernatural': { uk: 'Надприродне', en: 'Supernatural' },
  'parodya': { uk: 'Пародія', en: 'Parody' },
  'prigodi': { uk: 'Пригоди', en: 'Adventure' },
  'post-apocalyptic': { uk: 'Постапокаліптика', en: 'Post-Apocalyptic' },
  'romance': { uk: 'Романтика', en: 'Romance' },
  'seinen': { uk: 'Сейнен', en: 'Seinen' },
  'sport': { uk: 'Спорт', en: 'Sports' },
  'boyslove': { uk: 'Шьоджьо-aї', en: 'Shoujo Ai' },
  'girlslove': { uk: 'Шьонен-aї', en: 'Shounen Ai' },
  'triller': { uk: 'Триллер', en: 'Thriller' },
  'fantaskyka': { uk: 'Фантастика', en: 'Sci-Fi' },
  'fantasy': { uk: 'Фентезі', en: 'Fantasy' },
  'school-life': { uk: 'Школа', en: 'School' },
  'shoujo': { uk: 'Шьоджьо', en: 'Shoujo' },
  'shounen': { uk: 'Шьонен', en: 'Shounen' },
  'sub': { uk: 'Субтитри', en: 'Subtitles' },
}

const MYLIST_MAP: Record<string, { uk: string, en: string }> = {
  '': { uk: 'Всі аніме', en: 'All Anime' },
  'all': { uk: 'Всі аніме', en: 'All Anime' },
  'seen': { uk: 'Переглянуто', en: 'Completed' },
  'will': { uk: 'Заплановано', en: 'Plan to Watch' },
  'watch': { uk: 'Переглядаю', en: 'Watching' },
  'watching': { uk: 'Переглядаю', en: 'Watching' },
  'poned': { uk: 'Відкладено', en: 'On-Hold' },
  'delayed': { uk: 'Відкладено', en: 'On-Hold' },
  'aband': { uk: 'Покинуто', en: 'Dropped' },
  'dropped': { uk: 'Покинуто', en: 'Dropped' },
  'fav': { uk: 'Улюблене', en: 'Favorites' },
  'favorites': { uk: 'Улюблене', en: 'Favorites' },
}

function cleanTitle(rawTitle: string): string {
  if (!rawTitle)
    return ''

  return rawTitle
    .replace(/\s*-\s*онлайн\s*українською/gi, '')
    .replace(/\s*аніме\s*українською\s*онлайн/gi, '')
    .replace(/\s*українською\s*онлайн/gi, '')
    .replace(/\s*дивитися\s+онлайн/gi, '')
    .replace(/\s*дивитись\s+онлайн/gi, '')
    .replace(/\s*»\s*AniTube[^\n]*/gi, '')
    .replace(/\s*-\s*AniTube[^\n]*/gi, '')
    .replace(/\s*\|\s*AniTube/gi, '')
    .trim()
}

function getAnimeTitle(): string {
  const h2 = document.querySelector<HTMLElement>('h2[id-mal], .story_c_left h2, .story h2')
  if (h2) {
    const clone = h2.cloneNode(true) as HTMLElement
    clone.querySelectorAll('ul, script, style').forEach(el => el.remove())
    const text = clone.textContent?.trim()
    if (text) {
      const cleaned = cleanTitle(text)
      if (cleaned)
        return cleaned
    }
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
  if (ogTitle) {
    const cleaned = cleanTitle(ogTitle)
    if (cleaned)
      return cleaned
  }

  return cleanTitle(document.title) || 'AniTube'
}

function getActiveEpisodeText(): string {
  const epName = document.querySelector<HTMLElement>('.episode-name.active, .episode-name[style*="display: block"]')
  if (epName?.textContent?.trim())
    return epName.textContent.trim()

  const activeVideo = document.querySelector<HTMLElement>(
    '.playlists-videos li.active, .playlists-videos li.pl-vis.active, .playlists-videos .active',
  )
  if (activeVideo?.textContent?.trim())
    return activeVideo.textContent.trim()

  const firstVideo = document.querySelector<HTMLElement>('.playlists-videos li.pl-vis, .playlists-videos li')
  if (firstVideo?.textContent?.trim())
    return firstVideo.textContent.trim()

  return ''
}

function getActiveSeasonText(animeTitle: string): string {
  const lists = document.querySelectorAll<HTMLElement>('.playlists-lists li.active, .playlists-lists li')
  for (const item of lists) {
    const txt = item.textContent?.trim() || ''
    const match = txt.match(/(\d+)\s*сезон/i)
    if (match)
      return match[1] ?? ''
  }

  const match = animeTitle.match(/(\d+)\s*сезон/i)
    || document.title.match(/(\d+)\s*сезон/i)
  if (match)
    return match[1] ?? ''

  return ''
}

function formatSeasonAndEpisode(animeTitle: string): string {
  const isUk = cachedSettings.forceLanguage !== 'en'
  const epText = getActiveEpisodeText()
  const seasonNum = getActiveSeasonText(animeTitle)

  const epMatch = epText ? epText.match(/(\d+)/) : null
  const epNum = epMatch ? epMatch[1] : null

  let epStr = ''
  if (epNum) {
    epStr = isUk ? `${epNum} серія` : `Episode ${epNum}`
  }
  else if (epText) {
    if (/фільм/i.test(epText))
      epStr = isUk ? 'Фільм' : 'Movie'
    else if (/ова|ova/i.test(epText))
      epStr = 'OVA'
    else
      epStr = epText
  }

  let seasonStr = ''
  if (seasonNum) {
    seasonStr = isUk ? `${seasonNum} сезон` : `Season ${seasonNum}`
  }

  if (seasonStr && epStr)
    return `${seasonStr} • ${epStr}`
  if (epStr)
    return epStr
  if (seasonStr)
    return seasonStr

  return t('watchingAnime')
}

function getAnimePoster(): string | null {
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content')
  if (ogImage && ogImage.startsWith('http'))
    return ogImage

  const posterImg = document.querySelector<HTMLImageElement>('.story_c_left img, .story_c_l_2 img, .story_screens img')
  if (posterImg?.src && posterImg.src.startsWith('http'))
    return posterImg.src

  return null
}

function getGenreTitle(slug: string): string {
  const lang = cachedSettings.forceLanguage === 'en' ? 'en' : 'uk'
  if (GENRE_MAP[slug])
    return GENRE_MAP[slug][lang]

  const title = document.title
  const titleMatch = title.match(/жанрі\s+([^—\-|]+)/i)
  if (titleMatch?.[1])
    return titleMatch[1].replace(/\s*(?:аніме|онлайн|українською).*/i, '').trim()

  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

function getUserActiveList(): string | null {
  const lang = cachedSettings.forceLanguage === 'en' ? 'en' : 'uk'

  const activeTab = document.querySelector<HTMLElement>(
    '.user_profile .active, .profile_tabs .active, .inc_tab li.active, [data-status].active, .user-tabs .active',
  )
  if (activeTab?.textContent?.trim()) {
    const txt = activeTab.textContent.trim()
    if (txt && !txt.toLowerCase().includes('аніме'))
      return txt
  }

  const { search, pathname } = document.location
  const params = new URLSearchParams(search)

  const mode = params.get('mode') || params.get('status') || params.get('tab')
  if (mode) {
    const key = mode.toLowerCase()
    return MYLIST_MAP[key]?.[lang] || mode
  }

  if (params.get('do') === 'favorites' || pathname.includes('/favorites/'))
    return t('favorites')

  return null
}

presence.on('UpdateData', async () => {
  try {
    const { pathname, search, href } = document.location
    const searchParams = new URLSearchParams(search)
    const isUk = cachedSettings.forceLanguage !== 'en'
    const lang = isUk ? 'uk' : 'en'

    // Reset playback state if navigating away from anime page
    if (lastPathname !== pathname) {
      if (!/^\/\d+-[^/]+\.html/.test(pathname)) {
        playback.currentTime = 0
        playback.duration = 0
        playback.paused = true
        playback.hasPlayed = false
        playback.lastTime = 0
      }
      lastPathname = pathname
    }

    const { privacy, showCover, showTimestamps, showButtons } = cachedSettings

    if (privacy) {
      presence.setActivity({
        type: ActivityType.Watching,
        largeImageKey: ActivityAssets.Logo,
        details: 'AniTube',
        state: t('watchingAnime'),
        startTimestamp: browsingTimestamp,
      })
      return
    }

    const presenceData: PresenceData = {
      type: ActivityType.Watching,
      largeImageKey: ActivityAssets.Logo,
    }

    const isSearchFocused = document.activeElement?.id === 'story'
      || document.activeElement?.classList.contains('domen_name')

    // 1. search input focused
    if (isSearchFocused) {
      presenceData.details = t('search')
      presenceData.state = t('searchingCatalog')
      presenceData.smallImageKey = Assets.Search
      presenceData.smallImageText = t('search')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 2. anime page / video watching
    const isAnimePage = /^\/\d+-[^/]+\.html/.test(pathname)
      || searchParams.get('newsid') !== null

    if (isAnimePage) {
      const animeTitle = getAnimeTitle()
      const formattedEpisode = formatSeasonAndEpisode(animeTitle)
      const poster = getAnimePoster()

      presenceData.details = animeTitle || 'AniTube'
      presenceData.state = formattedEpisode

      if (showCover && poster) {
        presenceData.largeImageKey = poster
        presenceData.smallImageKey = ActivityAssets.Logo
        presenceData.smallImageText = 'AniTube'
      }
      else {
        presenceData.largeImageKey = ActivityAssets.Logo
      }

      const video = document.querySelector<HTMLVideoElement>('video')
      let isPaused = true
      let isPlaying = false
      let currentPos = 0
      let totalDur = 0

      if (video && video.duration && !Number.isNaN(video.duration) && video.duration > 0) {
        currentPos = Math.floor(video.currentTime)
        totalDur = Math.floor(video.duration)
        isPaused = video.paused
        isPlaying = !video.paused
      }
      else if (playback.duration > 0 && playback.hasPlayed) {
        currentPos = Math.floor(playback.currentTime)
        totalDur = Math.floor(playback.duration)
        if (Date.now() - playback.lastUpdate > 3500)
          playback.paused = true

        isPaused = playback.paused
        isPlaying = !playback.paused
      }

      if (isPlaying && totalDur > 0) {
        presenceData.smallImageKey = Assets.Play
        presenceData.smallImageText = t('videoPlaying')
        if (showTimestamps) {
          const [start, end] = getTimestamps(currentPos, totalDur)
          presenceData.startTimestamp = start
          presenceData.endTimestamp = end
        }
      }
      else if (isPaused && (playback.hasPlayed || (video && video.currentTime > 0))) {
        presenceData.smallImageKey = Assets.Pause
        presenceData.smallImageText = t('videoPaused')
        presenceData.startTimestamp = undefined
        presenceData.endTimestamp = undefined
      }
      else if (showTimestamps) {
        presenceData.startTimestamp = browsingTimestamp
        if (!presenceData.smallImageKey) {
          presenceData.smallImageKey = Assets.Viewing
          presenceData.smallImageText = t('browsing')
        }
      }

      if (showButtons) {
        const cleanUrl = href.split('#')[0] ?? href
        presenceData.buttons = [
          {
            label: t('buttonWatchAnime'),
            url: cleanUrl,
          },
        ]
      }

      presence.setActivity(presenceData)
      return
    }

    // 3. user lists (/mylists/<username>/ or /mylists/<username>/<list>/)
    if (pathname.startsWith('/mylists')) {
      const mylistMatch = pathname.match(/^\/mylists(?:\/([^/]+))?(?:\/([^/]*))?/)
      const username = mylistMatch?.[1] ? decodeURIComponent(mylistMatch[1]) : ''
      const listSlug = (mylistMatch?.[2] ?? '').toLowerCase()
      const listTitle = MYLIST_MAP[listSlug]?.[lang] || MYLIST_MAP['']?.[lang] || listSlug

      presenceData.details = username ? `${t('viewLists')} ${username}` : 'AniTube'
      presenceData.state = listTitle || t('allAnimeList')
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 4. user favorites
    const isFavorites = searchParams.get('do') === 'favorites' || pathname.startsWith('/favorites')
    if (isFavorites) {
      presenceData.details = 'AniTube'
      presenceData.state = t('favorites')
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 5. user profile (/user/<name>/)
    if (pathname.startsWith('/user/')) {
      const userMatch = pathname.match(/^\/user\/([^/]+)/)
      const username = userMatch?.[1] ? decodeURIComponent(userMatch[1]) : ''
      const activeList = getUserActiveList()

      presenceData.details = username ? `${t('viewProfile')} ${username}` : 'AniTube'
      presenceData.state = activeList || t('browsing')
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 6. collections (/collections/)
    if (pathname.startsWith('/collections')) {
      presenceData.details = 'AniTube'
      presenceData.state = t('collections')
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 7. watchrooms
    if (pathname.startsWith('/watchrooms')) {
      presenceData.details = 'AniTube'
      presenceData.state = t('watchrooms')
      presenceData.smallImageKey = Assets.Live
      presenceData.smallImageText = t('watchrooms')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 8. seasons
    if (pathname.startsWith('/seasons')) {
      presenceData.details = 'AniTube'
      presenceData.state = t('seasons')
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 9. top anime
    if (pathname.startsWith('/top')) {
      presenceData.details = 'AniTube'
      presenceData.state = t('topAnime')
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 10. animetube section
    if (pathname.startsWith('/animetube')) {
      presenceData.details = 'AniTube'
      presenceData.state = t('animetube')
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 11. fullscreen chat
    if (pathname.includes('big-kawai-chat.html')) {
      presenceData.details = 'AniTube'
      presenceData.state = t('kawaiChat')
      presenceData.smallImageKey = Assets.Writing
      presenceData.smallImageText = t('writing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 12. dms
    if (pathname.startsWith('/pm')) {
      const pmTarget = pathname.replace(/^\/pm\/?/, '').replace(/\/$/, '')
      if (pmTarget) {
        presenceData.details = t('pmDialogs')
        presenceData.state = t('pmChatWith', { user: decodeURIComponent(pmTarget) })
      }
      else {
        presenceData.details = 'AniTube'
        presenceData.state = t('pmDialogs')
      }
      presenceData.smallImageKey = Assets.Writing
      presenceData.smallImageText = t('writing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 13. site stats
    if (pathname.includes('statistics.html')) {
      presenceData.details = 'AniTube'
      presenceData.state = t('statistics')
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 14. latest comments
    if (searchParams.get('do') === 'lastcomments') {
      presenceData.details = 'AniTube'
      presenceData.state = t('lastComments')
      presenceData.smallImageKey = Assets.Reading
      presenceData.smallImageText = t('reading')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 15. search results
    if (searchParams.get('do') === 'search' || pathname.includes('/search/')) {
      const query = searchParams.get('story') || searchParams.get('q')
      presenceData.details = t('search')
      presenceData.state = query ? `${t('searchFor')} "${query}"` : t('search')
      presenceData.smallImageKey = Assets.Search
      presenceData.smallImageText = t('search')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 16. random anime
    if (searchParams.get('do') === 'random_anime') {
      presenceData.details = 'AniTube'
      presenceData.state = t('randomAnime')
      presenceData.smallImageKey = Assets.Question
      presenceData.smallImageText = t('randomAnime')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 17. year filter
    const yearMatch = pathname.match(/\/xfsearch\/year\/(\d+)/)
    if (yearMatch) {
      presenceData.details = t('browsing')
      presenceData.state = t('yearAnime', { year: yearMatch[1] ?? '' })
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 18. voice team filter
    const voiceMatch = pathname.match(/\/xfsearch\/(?:voiced|translation)\/([^/]+)/)
    if (voiceMatch) {
      const team = decodeURIComponent(voiceMatch[1] ?? '').replace(/_/g, ' ')
      presenceData.details = t('browsing')
      presenceData.state = t('voiceTeam', { team })
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 19. genre pages
    if (pathname.startsWith('/anime/')) {
      const genreSlug = pathname.replace(/^\/anime\//, '').replace(/\/$/, '').toLowerCase()
      if (genreSlug) {
        const genreName = getGenreTitle(genreSlug)
        presenceData.details = t('browsing')
        presenceData.state = genreName
      }
      else {
        presenceData.details = t('browsing')
        presenceData.state = t('animeCatalog')
      }
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 20. news
    if (pathname.startsWith('/news/')) {
      const isSingleNews = /^\/news\/\d+/.test(pathname)
      if (isSingleNews) {
        const newsTitle = getAnimeTitle()
        presenceData.details = t('readingNews')
        presenceData.state = newsTitle
        if (showButtons) {
          const cleanUrl = href.split('#')[0] ?? href
          presenceData.buttons = [
            {
              label: t('buttonReadArticle'),
              url: cleanUrl,
            },
          ]
        }
      }
      else {
        presenceData.details = 'AniTube'
        presenceData.state = t('news')
      }
      presenceData.smallImageKey = Assets.Reading
      presenceData.smallImageText = t('reading')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 21. articles
    if (pathname.startsWith('/statti/')) {
      const isSingleArticle = /^\/statti\/\d+/.test(pathname)
      if (isSingleArticle) {
        const articleTitle = getAnimeTitle()
        presenceData.details = t('readingArticle')
        presenceData.state = articleTitle
        if (showButtons) {
          const cleanUrl = href.split('#')[0] ?? href
          presenceData.buttons = [
            {
              label: t('buttonReadArticle'),
              url: cleanUrl,
            },
          ]
        }
      }
      else {
        presenceData.details = 'AniTube'
        presenceData.state = t('articles')
      }
      presenceData.smallImageKey = Assets.Reading
      presenceData.smallImageText = t('reading')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 22. static pages
    if (pathname === '/anme-subkultura.html') {
      presenceData.details = 'AniTube'
      presenceData.state = t('subculture')
      presenceData.smallImageKey = Assets.Reading
      presenceData.smallImageText = t('reading')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    if (pathname === '/friends.html') {
      presenceData.details = 'AniTube'
      presenceData.state = t('friends')
      presenceData.smallImageKey = Assets.Viewing
      presenceData.smallImageText = t('browsing')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    if (pathname === '/vik.html') {
      presenceData.details = 'AniTube'
      presenceData.state = t('ageRestrictions')
      presenceData.smallImageKey = Assets.Reading
      presenceData.smallImageText = t('reading')
      presenceData.startTimestamp = browsingTimestamp
      presence.setActivity(presenceData)
      return
    }

    // 23. default / homepage
    presenceData.details = 'AniTube'
    presenceData.state = t('viewHome')
    presenceData.smallImageKey = Assets.Viewing
    presenceData.smallImageText = t('browsing')
    presenceData.startTimestamp = browsingTimestamp

    presence.setActivity(presenceData)
  }
  catch (err) {
    console.error('[PreMiD] AniTube error in UpdateData:', err)
  }
})
