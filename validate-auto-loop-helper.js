async function validate(submission, answer, key) {
    return submission === answer
}

const answers = {
    "calcmul":"27","humanint":"1","humantxt":"Yes","humanfriendyes":true,"overoveryes":true,"ballofwool":true,"humanSlider":"75","captchainput":"","captchaPath":"  "
}
const submission = {"calcmul":"27","humanint":"1","humantxt":"Yes","humanfriendyes":true,"overoveryes":true,"ballofwool":true,"humanSlider":"100","captchainput":"expheheyej","captchaPath":"codcrs"}

/*######################*/
async function testValidateFunction() {
    let correct = 0
    let wrong = 0
    for (const key in answers) {
        await validate(submission[key], answers[key], key) ? correct++ : wrong++
    }
    const score = correct / (correct+wrong)
    console.log("score", score)
}
testValidateFunction()
