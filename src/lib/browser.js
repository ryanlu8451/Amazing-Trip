export function getBrowserEnvironment() {
  const userAgent = window.navigator.userAgent || ''
  const lowerUserAgent = userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(lowerUserAgent)
  const isAndroid = lowerUserAgent.includes('android')
  const isMobile = isIOS || isAndroid || lowerUserAgent.includes('mobile')
  const isEmbeddedBrowser = [
    'fbav',
    'fban',
    'instagram',
    'line/',
    'micromessenger',
    'twitter',
    'linkedinapp',
    'tiktok',
    '; wv',
    'gsa/',
  ].some((token) => lowerUserAgent.includes(token))

  return {
    isAndroid,
    isEmbeddedBrowser,
    isIOS,
    isMobile,
    userAgent,
  }
}

export function getExternalBrowserName() {
  const { isIOS } = getBrowserEnvironment()
  return isIOS ? 'Safari' : 'Chrome'
}
