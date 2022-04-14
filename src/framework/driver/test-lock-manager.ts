import { LockState, TestState } from './lock-state';
import { EventEmitter } from 'events';

/**
 * During a concurrent run, the test lock manager will block other tests from running
 * when a test could effect the result of other running tests. 
 */
export class TestLockManager {
    private static locked: boolean = false;
    private static queue: LockState[] = [];
    private static currentLock: string = '';
    private static lockEmitter: EventEmitter = new EventEmitter();

    public static addToQueue(lockState: LockState): void {
        if (this.queue.some(itm => itm.testName === lockState.testName)) {
            const existing = this.queue.filter(itm => itm.testName === lockState.testName)[0];
            if (lockState.shouldLock) {
                if (!this.locked) {
                    this.locked = true;
                    this.currentLock = existing.testName;
                    existing.state = TestState.Running;
                } else {
                    existing.state = TestState.Waiting;
                }
            }
        }

        if (lockState.shouldLock) {
            if (!this.locked) {
                this.locked = true;
                this.currentLock = lockState.testName;
                lockState.state = TestState.Running;
            } else {
                lockState.state = TestState.Waiting;
            }

            this.queue.push(lockState);
        }
    }

    public static waitForTurn(lockState: LockState): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (TestLockManager.meetsRunCriteria(lockState) || this.currentLock === '') {
                    lockState.state = TestState.Running;
                    resolve();
                }
                else {
                    if (this.queue.filter(itm => itm.testName.toLowerCase().trim() === this.currentLock.toLowerCase().trim()).length > 0) {
                        console.log(`${lockState.testName} is waiting for ${this.currentLock} to complete.`);
                        TestLockManager.checkStatus(lockState.testName, resolve);
                    } else {
                        this.currentLock = '';
                        resolve();
                    }
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    private static meetsRunCriteria(lockState: LockState) {
        return !this.locked || lockState.ignoreLock || lockState.testName === this.currentLock;
    }

    private static checkStatus(testName: string, resolve: (value: void | PromiseLike<void>) => void) {
        this.lockEmitter.once('lockUpdated', (nextTestName: string) => {
            if (testName === nextTestName || nextTestName.length === 0) {
                resolve();
            } else {
                console.log(`${testName} is waiting for ${this.currentLock} to complete.`);

                this.checkStatus(testName, resolve);
            }
        });
    }

    public static markComplete(lockState: LockState): void {
        if (this.queue.some(itm => itm.testName === lockState.testName)) {
            const value: LockState = this.queue.filter(itm => itm.testName === lockState.testName)[0];
            const index: number = this.queue.indexOf(value);
            console.log(index);
            console.log(`removing lock for: ${lockState.testName}`);
            console.log(lockState.testName);
            value.state = TestState.Completed;

            let foundNewLock = false;
            try {
                for (const item of this.queue) {

                    if (item && item.shouldLock === true && item.state !== TestState.Completed) {
                        foundNewLock = true;
                        this.currentLock = item.testName;
                        this.lockEmitter.emit('lockUpdated', item.testName);
                        break;
                    }
                }

                if (!foundNewLock) {
                    this.locked = false;
                    this.currentLock = '';
                    this.lockEmitter.emit('lockUpdated', '');
                }
            } catch (e) {
                console.error('test lock issue');
                console.error(e.message);
            }

            console.log(this.queue);
        }
    }
}