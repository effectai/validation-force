// Imports need to be relative from the root of the project
import fetch from 'cross-fetch';

const response = await fetch(`https://api.twitter.com/2/users/by/username/${submissions.twitter_handle}`, {
    headers: { 'Authorization': `Bearer ${process.env.TWITTER_BEARER}` }
});

const body = await response.json();
console.log(body);
if (!body.data || !body.data.id) {
    return { valid: false, twitter_handle: submissions.twitter_handle }
} else {
    return { valid: true, twitter_handle: submissions.twitter_handle }
}
