// Imports need to be relative from the root of the project
// imports need to use require. import is not supported
// Also make sure that the import is present in index.js

const fetch = require('cross-fetch');

const response = await fetch(`https://api.twitter.com/2/users/by/username/${submissions.twitter_handle}`, {
    headers: { 'Authorization': `Bearer ${process.env.TWITTER_BEARER}` }
});

const body = await response.json();
console.log(body);
if (!body.data || !body.data.id) {
    return { value: false, quali_value: submissions.twitter_handle }
} else {
    return { value: true, quali_value: submissions.twitter_handle }
}
