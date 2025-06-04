const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors()); // ✅ Enables CORS for all origins
app.use(express.json({ limit: '10mb' }));

const PAT = '20dd574993e142a9a270a70e5ebd6450';
const USER_ID = 'clarifai';
const APP_ID = 'main';

const FOOD_MODEL_ID = 'food-item-v1-recognition';
const FOOD_MODEL_VERSION_ID = 'dfebc169854e429086aceb8368662641';

const FACE_MODEL_ID = 'face-detection';
const FACE_MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';

app.post('/analyze', async (req, res) => {
  console.log("🧠 Step 1: Checking for faces...");

  try {
    const imageBody = req.body;

    // First: Run face detection model
    const faceRes = await fetch(`https://api.clarifai.com/v2/models/${FACE_MODEL_ID}/versions/${FACE_MODEL_VERSION_ID}/outputs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${PAT}`
      },
      body: JSON.stringify(imageBody)
    });

    const faceData = await faceRes.json();
    console.log("🧍 Face detection model returned:", faceData);

    const regions = faceData.outputs?.[0]?.data?.regions || [];

    if (regions.length > 0) {
      // If any faces are detected
      console.log("🚫 Face detected!");
      return res.json({
        isHuman: true,
        foodName: 'لحم بشري',
        foodCalories: 'امسكناك يا آكل لحوم البشر!'
      });
    }

    // If no face → check food
    console.log("✅ No face detected → checking food...");

    const foodRes = await fetch(`https://api.clarifai.com/v2/models/${FOOD_MODEL_ID}/versions/${FOOD_MODEL_VERSION_ID}/outputs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${PAT}`
      },
      body: JSON.stringify(imageBody)
    });

    const foodData = await foodRes.json();
    console.log("🍕 Food model returned:", foodData);

    res.json(foodData);

  } catch (error) {
    console.error('🔥 Clarifai proxy error:', error);
    res.status(500).json({ error: 'Clarifai proxy failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

