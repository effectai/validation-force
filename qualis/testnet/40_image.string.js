if (submission.toLowerCase() === answer.toLowerCase()) {
    return { value: true, quali_value: 'image_validator' }
} else {
    return { value: false, quali_value: 'image_validator_rejected' }
}

