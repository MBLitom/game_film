import test from "node:test";
import assert from "node:assert/strict";
import {beginEpisode,afterVideo,chooseStory,currentClip,validateContinuity,REQUIRED_ASSETS} from "../cinema/story-playback.mjs";
test("film order is cinematic and only pauses at three editorial breaks",()=>{
 let s=beginEpisode();
 assert.equal(currentClip(s),"intro.mp4");
 s=afterVideo(s); assert.equal(s.phase,"outfit");
 let rejected=chooseStory(s,"royal");
 assert.equal(rejected.response.accepted,false);
 assert.equal(rejected.state.phase,"outfit");
 s=chooseStory(rejected.state,"star").state;validateContinuity(s);
 assert.equal(currentClip(s),"outfit_ok.mp4");
 s=afterVideo(s);assert.equal(s.phase,"room");
 s=chooseStory(s,"cosmic").state; validateContinuity(s);
 assert.equal(currentClip(s),"room_ok.mp4");
 s=afterVideo(s);assert.equal(s.phase,"feelings");
 s=chooseStory(s,"listen").state;validateContinuity(s);
 s=afterVideo(s);assert.equal(s.phase,"end");
 assert.equal(currentClip(s),null);
});
test("cinematic asset filenames are fixed; no invented infinite branches",()=>{
 assert.deepEqual(REQUIRED_ASSETS,["intro.mp4","outfit_ok.mp4","room_ok.mp4","empathy_ok.mp4"]);
});
test("choice cannot skip a film segment",()=>{
 assert.throws(()=>chooseStory(beginEpisode(),"star"),/non-editable|editable/);
});
test("accepted galaxy decoration cannot silently reset approved outfit",()=>{
 let s=beginEpisode();s=afterVideo(s);
 s=chooseStory(s,"star").state;s=afterVideo(s);s=chooseStory(s,"cosmic").state;
 assert.equal(s.story.outfit,"star");assert.equal(s.story.room,"cosmic");
});