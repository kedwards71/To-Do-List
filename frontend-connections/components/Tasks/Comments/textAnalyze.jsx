import React from 'react'

const textAnalyze = ({emotion}) => {
  const emotionOptions = {
    "admiration" : '😍',
    "amusement" : '😆',
    "anger" : '🤬',
    'annoyance' : '🤦‍♂️🤦‍♀️',
    'approval' : '👌👍',
    'caring' : '🫂',
    'confusion' : '🤔🤷',
    'curiosity' : '🤓🧠📖',
    'desire' : '👀✨',
    'disappointment' : '😕😩',
    'disapproval' : '👎😒',
    'disgust' : '🤢🙅‍♂️🙅‍♀️',
    'embarrassment' : '😅🫣',
    'excitement' : '🎊😃🎊',
    'fear' : '👻😬😱',
    'gratitude' : '🙌🙏',
    'grief' : '💔😭',
    'joy' : '😂😂',
    'love' : '🫶💗🫶',
    'nervousness' : '😓😨',
    'optimism' : '😁🌈🍀',
    'pride' : '🌟ᕙ(  •̀ ᗜ •́  )ᕗ🌟',
    'realization' : '🤯💡',
    'relief' : '😅😌',
    'remorse' : '🙇‍♂️🥺🙇‍♀️',
    'sadness' : '🥀💔',
    'surprise' : '❗🎉🤯🎉',
    'neutral' : '😐🆗😐'
  }

  return (
    <div>{emotion ? emotionOptions[emotion] : 'No emotion to be detected.'}</div>
  )
}

export default textAnalyze