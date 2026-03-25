import { onSnapshot } from 'firebase/firestore';

/**
 * Drop-in replacement for getDoc() that suppresses Firebase's internal
 * "Uncaught Error in snapshot listener" log.
 *
 * getDoc() uses an internal snapshot listener with no user-provided error
 * callback, so Firebase logs the error at SDK level before any try/catch
 * in user code can handle it. Using onSnapshot with an explicit error
 * callback makes the listener "handled" from Firebase's perspective,
 * keeping the error out of the console while still rejecting the Promise.
 */
export function getDocOnce(ref) {
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(
      ref,
      (snap) => { unsub(); resolve(snap); },
      (err)  => { unsub(); reject(err);  }
    );
  });
}
