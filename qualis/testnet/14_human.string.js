// Imports need to be relative from the root of the project
const { verifyCaptcha } = await import('./captcha.js')

const s = submissions
const a = answers
console.log('🔥submission', s, '🚒Answers', a)
const captchaPath = `${forceInfo.campaignId}${forceInfo.batchId}${forceInfo.accountId}${forceInfo.submissionId}`

console.log('🎏🎏🎏🎏', captchaPath)

const isValid = verifyCaptcha(captchaPath, submissions.captchainput);
return isValid && a.calcmul === s.calcmul && s.humanSlider >= a.humanSlider