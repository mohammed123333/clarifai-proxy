const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const CLARIFAI_KEYS = {
  PAT: 'your_pat_here',
  FOOD_MODEL: 'food-item-v1-recognition',
  FOOD_VERSION: 'dfebc169854e429086aceb8368662641',
  FACE_MODEL: 'face-detection',
  FACE_VERSION: '6dc7e46bc9124c5c8824be4822abe105'
};

app.post('/analyze', async (req, res) => {
  const base64 = req.body.base64;
  const rawImage = base64.split(',')[1];

  const faceResponse = await fetch(
    `https://api.clarifai.com/v2/models/${CLARIFAI_KEYS.FACE_MODEL}/versions/${CLARIFAI_KEYS.FACE_VERSION}/outputs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Key ${CLARIFAI_KEYS.PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_app_id: { user_id: 'clarifai', app_id: 'main' },
        inputs: [{ data: { image: { base64: rawImage } } }],
      }),
    }
  );
  const faceData = await faceResponse.json();
  const hasFace = faceData.outputs?.[0]?.data?.regions?.length > 0;

  if (hasFace) {
    return res.json({ name: "لحم بشري", calories: "😳 أمسكناك يا آكل لحوم البشر" });
  }

  const foodResponse = await fetch(
    `https://api.clarifai.com/v2/models/${CLARIFAI_KEYS.FOOD_MODEL}/versions/${CLARIFAI_KEYS.FOOD_VERSION}/outputs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Key ${CLARIFAI_KEYS.PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_app_id: { user_id: 'clarifai', app_id: 'main' },
        inputs: [{ data: { image: { base64: rawImage } } }],
      }),
    }
  );
  const result = await foodResponse.json();
  const concepts = result.outputs?.[0]?.data?.concepts || [];
  const valid = concepts.filter(c => c.value >= 0.9);

  if (valid.length === 0) return res.json({ name: "طعام غير معروف", calories: 0 });

  const best = valid.reduce((a, b) => (b.value > a.value ? b : a));
  res.json({ name: best.name, calories: "Estimated" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
