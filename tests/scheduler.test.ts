import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isDue,scheduleReview} from '../src/lib/scheduler';
import {emptyState,addToQueue,startBatch,applyFreePracticeRating} from '../src/lib/vocabulary';
import {validState} from '../src/server/validation';

test('FSRS review persists, reloads and is separate from free study', async()=>{
 const entry={id:'test', en:'test',fa:'آزمایش',ipa:'',pos:'',exampleEn:'',exampleFa:''};
 const queued=addToQueue(emptyState(),entry,'manual','2026-01-01T00:00:00.000Z').state;
 const state=startBatch(queued,'test-batch','2026-01-01T00:00:00.000Z')!.state;
 const word=state.words[0], now=new Date('2026-01-01T00:00:00.000Z');
 assert.equal(isDue(word,now.getTime()),true);
 const review=await scheduleReview(undefined,'good',now);
 assert.equal(review.model,'FSRS-6'); assert.ok(Date.parse(review.card.dueAt)>now.getTime());
 const updated={...word,review,scheduledAt:review.card.dueAt};
 assert.equal(validState({...state,words:[updated]}),true);
 assert.equal(isDue(updated,now.getTime()),false);
 assert.equal(isDue(updated,Date.parse(review.card.dueAt)),true);
 const roundtrip=JSON.parse(JSON.stringify(review));
 const next=await scheduleReview(roundtrip,'good',new Date(review.card.dueAt));
 assert.equal(next.card.reps,2); assert.ok(Date.parse(next.card.dueAt)>Date.parse(review.card.dueAt));
 applyFreePracticeRating(updated,'forgot'); assert.deepEqual(updated.review,review);
 assert.equal(updated.status,word.status); assert.equal(updated.stage,word.stage);
 assert.equal(validState({...state,words:[{...updated,review:{...review,card:{...review.card,dueAt:'bad'}}}]}),false);
});
