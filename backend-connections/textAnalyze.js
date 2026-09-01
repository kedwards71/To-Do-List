import 'dotenv/config';
import pool from './db/pool.js'

// Emotion Detector for messages
export const textAnalyzer = async (comments) => {
    try {
        let updatedComments = []
        await comments.map( async (c) => {
            if(c.emotion === null){
                const emotion = await detectEmotions(c.task_comment);
                let strongestEmote = {
                    "emotion" : '',
                    "score" : 0
                }
                for (let key in emotion.confidence_scores){
                    if(strongestEmote.score < emotion.confidence_scores[key])
                    {
                        strongestEmote.emotion = key;
                        strongestEmote.score = emotion.confidence_scores[key];
                    }
                }
                const result = await pool.query(
                    `UPDATE task_comments SET 
                    emotion = $1 WHERE task_id = $2 AND comment_id = $3 RETURNING *`,
                    [strongestEmote.emotion, c.task_id, c.comment_id]
                );
                updatedComments = [...updatedComments, result.rows[0]];
            }
            else{
                updatedComments = [...updatedComments, c];
            }
        })
        return updatedComments;
    } catch (error) {
        try{
            const emotion = await detectEmotions(comments.task_comment);
            let strongestEmote = {
                "emotion" : '',
                "score" : 0
            }
            for (let key in emotion.confidence_scores){
                if(strongestEmote.score < emotion.confidence_scores[key])
                {
                    strongestEmote.emotion = key;
                    strongestEmote.score = emotion.confidence_scores[key];
                }
            }
            const result = await pool.query(
                `UPDATE task_comments SET
                emotion = $1 WHERE task_id = $2 AND comment_id = $3 RETURNING *`,
                [strongestEmote.emotion, comments.task_id, comments.comment_id]
    
            );
            return result.rows[0];
        }
        catch (err) {
            console.error('Error: ', err.stack)
        }
    }
}

// Emotion Detector for messages
export const textAnalyzerRoom = async (comments) => {
    try {
        let updatedComments = []
        await comments.map( async (c) => {
            if(c.emotion === null){
                const emotion = await detectEmotions(c.task_comment);
                let strongestEmote = {
                    "emotion" : '',
                    "score" : 0
                }
                for (let key in emotion.confidence_scores){
                    if(strongestEmote.score < emotion.confidence_scores[key])
                    {
                        strongestEmote.emotion = key;
                        strongestEmote.score = emotion.confidence_scores[key];
                    }
                }
                const result = await pool.query(
                    `UPDATE room_task_comments SET 
                    emotion = $1 WHERE task_id = $2 AND comment_id = $3 RETURNING *`,
                    [strongestEmote.emotion, c.task_id, c.comment_id]
                );
                updatedComments = [...updatedComments, result.rows[0]];
            }
            else{
                updatedComments = [...updatedComments, c];
            }
        })
        return updatedComments;
    } catch (error) {
        try{
            const emotion = await detectEmotions(comments.task_comment);
            let strongestEmote = {
                "emotion" : '',
                "score" : 0
            }
            for (let key in emotion.confidence_scores){
                if(strongestEmote.score < emotion.confidence_scores[key])
                {
                    strongestEmote.emotion = key;
                    strongestEmote.score = emotion.confidence_scores[key];
                }
            }
            const result = await pool.query(
                `UPDATE room_task_comments SET
                emotion = $1 WHERE task_id = $2 AND comment_id = $3 RETURNING *`,
                [strongestEmote.emotion, comments.task_id, comments.comment_id]
    
            );
            return result.rows[0];
        }
        catch (err) {
            console.error('Error: ', err.stack)
        }
    }
}

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

