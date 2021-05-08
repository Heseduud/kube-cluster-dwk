const axios = require('axios');

const getPage = async () => {
  const res = await axios.get('https://en.wikipedia.org/wiki/Special:Random');
  await axios.post('http://projectbackend-svc:5000/todos', { todo: res.request.res.responseUrl });
  console.log(res.request.res.responseUrl);
  return res;
}

getPage();