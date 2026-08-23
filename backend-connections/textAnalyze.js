import 'dotenv/config';

export const detectEmotions = async (message) =>{
    const requestOptions = {
        method : 'POST',
        headers : {
            "Content-Type" : "application/json",
            "X-API-KEY" : process.env.API_KEY
        },
        body : JSON.stringify({
            "message" : message,
            "context" : "to-do task"
        })
    }
    try {
        
        const response = await fetch("https://api.emotionwise.ai/api/v1/tools/emotion-detector", requestOptions);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Error sending emotion text');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:',error);
    }
}

