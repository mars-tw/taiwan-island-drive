// R47: presentation-only guidance for the train math lesson.
// It never changes dispatch state or lesson numbers; it only decides what the coach says
// and which single button glows next. The corrective text is the lesson's own message.
export function dispatchGuide({ phase, action = '', message = '', front = 0, total = 0 }) {
  const retry = Boolean(message)
    && ((action === 'check' && (phase === 'load' || phase === 'split'))
      || (/^answer:\d+$/.test(action) && phase === 'subtract'));
  let nextStep = null;
  if (phase === 'load') nextStep = front < total ? 'add' : 'check';
  return { retry, cue: retry ? message : null, nextStep };
}
