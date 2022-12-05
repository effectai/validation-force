import { readFile } from 'fs/promises'
import campaign6 from './qualis/mainnet/6_human.string.js'
import campaign8 from './qualis/mainnet/8_twitter.string.js'

export default JSON.stringify([
    {
        "campaign_id": 6,
        "approve_qualification_id": 118,
        "reject_qualification_id": 119,
        "validate_function": campaign6,
        "auto_loop": false,
        "answers": {
            "calcmul":"27","humanSlider":"75"
        }
    },
    {
        "campaign_id": 8,
        "approve_qualification_id": 37,
        "reject_qualification_id": 38,
        "validate_function": campaign8,
        "auto_loop": false,
        "answers": {
        }
    },
    {
        "campaign_id": 21,
        "approve_qualification_id": 45,
        "reject_qualification_id": 46,
        "validate_function": "return { 'value': true, 'quali_value': submissions.insta_handle }",
        "auto_loop": false,
        "answers": {
        }
    },
    {
        "campaign_id": 22,
        "approve_qualification_id": 43,
        "reject_qualification_id": 44,
        "validate_function": "return { 'value': true, 'quali_value': submissions.youtube_handle }",
        "auto_loop": false,
        "answers": {
        }
    }
])
