import {BEATS,evolveStory,initialStoryState} from "../story-engine.mjs";

/** Real cinematic shots are authored offline; no live generative AI requests. */
export const CLIPS=Object.freeze({
  intro:"intro.mp4",
  outfit_ok:"outfit_ok.mp4",
  room_ok:"room_ok.mp4",
  empathy_ok:"empathy_ok.mp4"
});
export const REQUIRED_ASSETS=Object.freeze(Object.values(CLIPS));
export const EDIT_PHASES=Object.freeze(["outfit","room","feelings"]);

const TRANSITIONS=Object.freeze({
  intro:{ended:"outfit"},
  outfit_ok:{ended:"room"},
  room_ok:{ended:"feelings"},
  empathy_ok:{ended:"end"}
});
const ACCEPTED_CLIPS=Object.freeze({
  outfit:"outfit_ok",room:"room_ok",feelings:"empathy_ok"
});
export function beginEpisode(){
  return {phase:"intro",story:initialStoryState()};
}
export function afterVideo(state){
  const phase=TRANSITIONS[state.phase]?.ended;
  if(!phase)throw new Error("Cannot advance a nonvideo phase "+state.phase);
  return {...state,phase};
}
export function chooseStory(state,id){
  if(!EDIT_PHASES.includes(state.phase))throw new Error("Not inside an editable film moment");
  const result=evolveStory(state.story,state.phase,id);
  return {
    state:{
      phase:result.outcome.accepted ? ACCEPTED_CLIPS[state.phase] : state.phase,
      story:result.state
    },
    response:result.outcome
  };
}
export function currentClip(state){
  return CLIPS[state.phase]||null;
}
export function validateContinuity(state){
  if(["outfit_ok","room","room_ok","feelings","empathy_ok","end"].includes(state.phase)&&state.story.outfit!=="star")
    throw new Error("Outfit continuity broken");
  if(["room_ok","feelings","empathy_ok","end"].includes(state.phase)&&state.story.room!=="cosmic")
    throw new Error("Galaxy room continuity broken");
  if(["empathy_ok","end"].includes(state.phase)&&state.story.feelings!=="listen")
    throw new Error("Friendship resolution missing");
  return true;
}