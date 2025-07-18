export const generateCarImage = async (make, model, carType = 'car') => {
  try {
    const response = await fetch('/.netlify/functions/generateImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        make,
        model,
        carType
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate image');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error generating car image:', error);
    return null; // Return null on error so the app can continue without image
  }
};
