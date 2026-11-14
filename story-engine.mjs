/**
 * GAME FILM: original narrative / editorial rules.
 * Pure module — safe to test without video, GPU or external APIs.
 * All paths lead to authored story beats; character preferences limit permutations.
 * Feelings are never "wrong". Choices teach respectful behavior, without shame.
 */
export const EPISODE = Object.freeze({
  id: "friends-first",
  title: "Friends First: The Theme Switch",
  audience: "Ages 5–12",
  language: "en",
  lesson: "Respect others' preferences, make room for feelings, and ask before borrowing.",
  cast: [
    {id: "sky", name: "Sky", likes: ["stars", "violet", "kindness"], dislikes: ["tight clothes", "being pulled by the hair"]},
    {id: "emma", name: "Emma", likes: ["ribbons", "dancing", "being heard"], dislikes: ["borrowing without asking"]}
  ]
});

export const BEATS = Object.freeze({
  outfit: {
    id: "outfit",
    prompt: "Help Sky get ready!",
    instruction: "Sky loves stars. Which outfit will feel right to her?",
    badge: "YOUR TURN · BE THE STYLIST",
    choices: [
      {id:"rose", emoji:"🎀", label:"ROSE POP", accepted:false, feedback:"Pink is lovely, but I really wanted stars tonight. Could we try another?"},
      {id:"star", emoji:"⭐", label:"STAR GLOW", accepted:true, feedback:"That's it! You remembered I love stars. Thank you!"},
      {id:"royal", emoji:"👑", label:"ROYAL FUN", accepted:false, feedback:"A crown is fun! But it doesn't feel like me tonight. Can we try the stars?"}
    ],
    hint:"Look for something with a bright star! ⭐",
    continueText:"BACK TO THE FILM →"
  },
  room: {
    id:"room",
    prompt:"The theme changed!",
    instruction:"The party is now GALAXY GLOW. Help decorate the room.",
    badge:"PLOT TWIST · BE THE SET DESIGNER",
    choices:[
      {id:"garden", emoji:"🌸", label:"FLOWER GARDEN", accepted:false, feedback:"These flowers are beautiful! But tonight the club asked for a galaxy theme."},
      {id:"cosmic", emoji:"🌌", label:"GALAXY GLOW", accepted:true, feedback:"Wow! The room feels like outer space. Now we're ready!"},
      {id:"beach", emoji:"🏖️", label:"BEACH PARTY", accepted:false, feedback:"I love the beach too! Could we save that for a summer party?"}
    ],
    hint:"Think space, stars and a glowing night sky! 🌌",
    continueText:"SEE THE NEW ROOM →"
  },
  feelings: {
    id:"feelings",
    prompt:"Emma looks upset...",
    instruction:"Someone borrowed Emma's ribbon without asking. What could help?",
    badge:"YOUR TURN · HELP THE FRIENDS",
    choices:[
      {id:"ignore", emoji:"🙈", label:"WALK AWAY", accepted:false, feedback:"Emma still looks sad. Maybe we should listen before we go?"},
      {id:"listen", emoji:"💬", label:"LISTEN & ASK", accepted:true, feedback:"Thank you for listening. Next time, please ask before using my things!"},
      {id:"laugh", emoji:"😆", label:"MAKE A JOKE", accepted:false, feedback:"A joke might not help while Emma is upset. Let's ask how she feels."}
    ],
    hint:"Try listening and asking what your friend needs. 💬",
    continueText:"CONTINUE THE STORY →"
  }
});

export function initialStoryState() {
  return { outift: null, outfit:null, room:null, feelings:null, tries:{outfit:0, room:0, feelings:0} };
}

export function evaluateChoice(beatId, choiceId, previousAttempts=0) {
  const beat = BEATS[beatId];
  if (!beat) throw new Error("Unknown story beat: " + beatId);
  const choice = beat.choices.find(item => item.id === choiceId);
  if (!choice) throw new Error("Unknown choice for " + beatId + ": " + choiceId);
  const attempts = previousAttempts + 1;
  return {
    id: choice.id,
    accepted: choice.accepted,
    feedback: choice.feedback,
    attempts,
    hint: !choice.accepted && attempts >= 2 ? beat.hint : null
  };
}

export function evolveStory(state, beatId, choiceId) {
  const outcome=evaluateChoice(beatId, choiceId, state.tries[beatId] || 0);
  const next={
    ...state,
    tries:{...state.tries, [beatId]:outcome.attempts}
  };
  if(outcome.accepted) next[beatId]=choiceId;
  return { state:next, outcome };
}
