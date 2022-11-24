if (submission.toLowerCase() === answer.toLowerCase()) {
    return { value: true, quali_value: 'pirate' }
} else {
    return { value: false, quali_value: 'scallywag' }
}