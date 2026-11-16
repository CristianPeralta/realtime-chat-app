const baseURL = (typeof window !== 'undefined' && window.location.origin) || ''
module.exports.to = function (url) {
  return baseURL + url
}
