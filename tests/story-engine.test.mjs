import test from "node:test";
import assert from "node:assert/strict";
import {BEATS,EPISODE,initialStoryState,evaluateChoice,evolveStory} from "../story-engine.mjs";

test("three editorial breaks exist; film may continue only after the intended beat",()=>{
  assert.deepEqual(Object.keys(BEATS),["outfit","room","feelings"]);
  assert.equal(EPISODE.language,"en");
  for (const beat of Object.values(BEATS)) {
    assert.equal(beat.choices.filter(c=>c.accepted).length,1);
    assert.equal(beat.choices.length,3);
    assert.ok(beat.hint);
  }
});

test("unwanted outfits do not change editorial continuity",()=>{
  const start=initialStoryState();
  const first=evolveStory(start,"outfit","royal");
  assert.equal(first.outcome.accepted,false);
  assert.equal(first.state.outfit,null);
  assert.equal(first.outcome.hint,null);
  const second=evolveStory(first.state,"outfit","rose");
  assert.equal(second.outcome.accepted,false);
  assert.match(second.outcome.hint,/star/i);
  const third=evolveStory(second.state,"outfit","star");
  assert.equal(third.outcome.accepted,true);
  assert.equal(third.state.outfit,"star");
  assert.equal(start.outfit,null); // pure operation
});

test("room is selected independently and remains in the state after a later decision",()=>{
  const style=evolveStory(initialStoryState(),"outfit","star").state;
  const set=evolveStory(style,"room","cosmic").state;
  const friends=evolveStory(set,"feelings","listen").state;
  assert.equal(friends.outfit,"star");
  assert.equal(friends.room,"cosmic");
  assert.equal(friends.feelings,"listen");
});

test("respectful response is accepted and other behavior redirects without blaming feelings",()=>{
  assert.equal(evaluateChoice("feelings","listen").accepted,true);
  assert.equal(evaluateChoice("feelings","laugh").accepted,false);
  assert.equal(evaluateChoice("feelings","ignore",1).hint,BEATS.feelings.hint);
  for(const beat of Object.values(BEATS)) for(const item of beat.choices) {
    assert.doesNotMatch(item.feedback,/\b(stupid|bad kid|naughty child|idiot|shut up)\b/i);
  }
});

test("unknown choice rejected",()=>{
  assert.throws(()=>evaluateChoice("outfit","not-real"),/Unknown choice/);
  assert.throws(()=>evaluateChoice("unreal","star"),/Unknown story beat/);
});
