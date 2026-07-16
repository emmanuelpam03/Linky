import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReactionSummary } from '../lib/message-interactions';

test('buildReactionSummary aggregates reactions and marks current user', () => {
  const summary = buildReactionSummary([
    { reaction: '❤️', userId: 'other' },
    { reaction: '❤️', userId: 'me' },
    { reaction: '👍', userId: 'me' },
  ], 'me');

  assert.deepEqual(summary, [
    { reaction: '❤️', count: 2, reactedByUser: true },
    { reaction: '👍', count: 1, reactedByUser: true },
  ]);
});

test('buildReactionSummary skips zero-count reactions', () => {
  const summary = buildReactionSummary([
    { reaction: '❤️', count: 0, userId: 'me' },
    { reaction: '👍', count: 1, userId: 'me' },
  ], 'me');

  assert.deepEqual(summary, [{ reaction: '👍', count: 1, reactedByUser: true }]);
});

test('buildReactionSummary returns empty array for no reactions', () => {
  assert.deepEqual(buildReactionSummary([]), []);
  assert.deepEqual(buildReactionSummary(undefined), []);
});
